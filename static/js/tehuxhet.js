(() => {

const ACTIVE_CLASS = 'active';
const PAGE_NUMBER_CLASS = 'pagenumber';
const NEXT_PAGE_CLASS = 'nextpage';
const PREVIOUS_PAGE_CLASS = 'previouspage';

let loggedIn = false;

const checkNginxErrorHtmlAndParseJson = async (res) => {
	const contentType = res.headers.get('Content-Type');
	if (contentType.includes('text/html')) {
		const html = await res.text();
		const message = html.split('<title>')[1].split('</title>')[0];
		throw new Error(message);
	}

	return res.json();
};

const tbody = document.body.querySelector('tbody');
const searchButton = document.body.querySelector('#search');
const resetButton = document.body.querySelector('#reset');
const authButton = document.body.querySelector('#auth');
const pagination = document.body.querySelector('.pagination');
const perpageSelect = document.body.querySelector('#perpage');
const nameInput = document.body.querySelector('#name');
const phoneInput = document.body.querySelector('#phone');
const addressInput = document.body.querySelector('#address');
const output = document.body.querySelector('output > strong');

const login = () => {
	output.textContent = '';
	output.classList.remove('error');
	authButton.disabled = true;

	if (loggedIn === true) {
		throw new Error('Вы уже вошли в систему');
	}

	const login = prompt('Введите логин') || '';
	const password = prompt('Введите пароль') || '';

	fetch('api/v2/login', {
		method: 'post',
		body: JSON.stringify({login, password}),
		headers: {
			'Content-Type': 'application/json',
			'accept-encoding': 'gzip'
		},
	})
	.then((res) => checkNginxErrorHtmlAndParseJson(res))
	.then(async (data) => {
		if (data?.success !== true) {
			throw new Error('Неверный логин или пароль');
		}

		loggedIn = true;
		authButton.textContent = 'Выйти';

		searchButton.disabled = false;
		resetButton.disabled = false;

		perpageSelect.disabled = false;
		nameInput.disabled = false;
		phoneInput.disabled = false;
		addressInput.disabled = false;

		output.textContent = 'Можете приступать к поиску';
	})
	.catch((err) => {
		output.classList.add('error');
		output.textContent = err.message || 'Неизвестная ошибка';
	})
	.finally(() => {
		authButton.disabled = false;
	});
};

const logout = () => {
	output.textContent = '';
	output.classList.remove('error');
	authButton.disabled = true;

	if (loggedIn === true) {
		throw new Error('Вы уже вошли в систему');
	}

	document.body.querySelectorAll('.page').forEach(
		(b) => { b.disabled = true; }
	);

	searchButton.disabled = true;
	resetButton.disabled = true;

	perpageSelect.disabled = true;
	nameInput.disabled = true;
	phoneInput.disabled = true;
	addressInput.disabled = true;

	fetch('api/v2/logout', {
		method: 'post',
		headers: {
			'accept-encoding': 'gzip'
		},
	})
	.then(({status}) => {
		console.log({status});
		if (status === 401 || status || 419) {
			loggedIn = false;
		}
		return res;
	})
	.then((res) => checkNginxErrorHtmlAndParseJson(res))
	.then(async (data) => {
		if (data?.success !== true) {
			throw new Error('Неверный логин или пароль');
		}

		loggedIn = false;
		authButton.textContent = 'Выйти';
		output.textContent = 'Залогинтесь';
	})
	.catch((err) => {
		console.log('err:');
		console.log(err);
		output.classList.add('error');
		output.textContent = err.message || 'Неизвестная ошибка';
	})
	.finally(() => {
		authButton.disabled = false;
	});
};

const fetchAbonents = (pageNumber) => {
	output.textContent = '';
	output.classList.remove('error');

	authButton.disabled = true;
	document.body.querySelectorAll('button').forEach(
		(b) => { b.disabled = true; }
	);
	perpageSelect.disabled = true;
	nameInput.disabled = true;
	phoneInput.disabled = true;
	addressInput.disabled = true;

	const url = new URL(location.origin + '/api/v2/light-flat-abonents');
	const searchParams = {
		pageSize: perpageSelect.value,
		pageNumber: Number(pageNumber) || 1,
	};
	if (nameInput.value) {
		searchParams.name = nameInput.value;
	}
	if (phoneInput.value) {
		searchParams.phone = phoneInput.value;
	}
	if (addressInput.value) {
		searchParams.address = addressInput.value;
	}
	url.search = new URLSearchParams(searchParams).toString();

	return fetch(url, {
		headers: {
			'accept-encoding': 'gzip',
		},
	})
	.then(({status}) => {
		console.log({status});
		if (status === 401 || status || 419) {
			loggedIn = false;
		}
		return res;
	})
	.then((res) => checkNginxErrorHtmlAndParseJson(res))
	.then((data) => {
		if (data?.error) {
			throw new Error(data?.message?.join('; ') || 'Неизвестная ошибка');
		}

		tbody.innerHTML = '';
		pagination.innerHTML = '';

		const [abonents, total, pageNumber, pageSize, totalPages] = data;

		abonents.forEach(([id, name, address, phone]) => {
			const tr = document.createElement('tr');
			tr.innerHTML = `<td>${id || '-'}</td><td>${name || '-'}</td><td>${phone || '-'}</td><td>${address || '-'}</td>`;
			tbody.append(tr);
		});

		let li = document.createElement('li');
		li.innerHTML = `<button type="button" class="page ${PREVIOUS_PAGE_CLASS}" ${!abonents.length || pageNumber === 1 ? 'disabled' : ''}> < </button>`;
		pagination.append(li);

		for (let i = 1; i <= totalPages; i++) {
			li = document.createElement('li');
			li.innerHTML = `<button type="button" class="page ${PAGE_NUMBER_CLASS} ${i === pageNumber ? ACTIVE_CLASS : ''}">${ i }</button>`;
			pagination.append(li);
		}

		li = document.createElement('li');
		li.innerHTML = `<button type="button" class="page ${NEXT_PAGE_CLASS}" ${!abonents.length || pageNumber === totalPages ? 'disabled' : ''}> > </button>`;
		pagination.append(li);

		output.textContent = `Получено ${ total } записей`;
	})
	.catch((err) => {
		console.log('err:');
		console.log(err);
		output.classList.add('error');
		output.textContent = err.message;
	})
	.finally(() => {
		authButton.disabled = false;

		searchButton.disabled = false;
		resetButton.disabled = false;

		perpageSelect.disabled = false;
		nameInput.disabled = false;
		phoneInput.disabled = false;
		addressInput.disabled = false;
	});
};

const searchAbonents = () => fetchAbonents();

const getCurrentPageNumber = () => {
	const pages = document.body.querySelectorAll('.page');

	for (const p of pages) {
		if (p.classList.contains(ACTIVE_CLASS)) {
			return Number(p.textContent);
		}
	}

	output.classList.add('error');
	output.textContent = 'Неисправность системы. Не удалось определить номер текущей страницы.';
};

const paginateAbonents = (event) => {
	if (event.target.classList.contains(ACTIVE_CLASS)) {
		event.preventDefault();
		event.stopPropagation();
		return;
	}

	if (event.target.classList.contains(PAGE_NUMBER_CLASS)) {
		return fetchAbonents(event.target.textContent);
	}

	if (event.target.classList.contains(NEXT_PAGE_CLASS)) {
		const pageNumber = getCurrentPageNumber();
		if (typeof pageNumber === 'number') {
			return fetchAbonents(pageNumber + 1);
		}
	}

	if (event.target.classList.contains(PREVIOUS_PAGE_CLASS)) {
		const pageNumber = getCurrentPageNumber();
		if (typeof pageNumber === 'number') {
			return fetchAbonents(pageNumber - 1);
		}
	}
};

authButton.addEventListener('click', () => {
	loggedIn === true ? logout() : login();
});
searchButton.addEventListener('click', searchAbonents);
pagination.addEventListener('click', paginateAbonents);

})();

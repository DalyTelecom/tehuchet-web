(() => {

const ACTIVE_CLASS = 'active';
const PAGE_NUMBER_CLASS = 'pagenumber';
const NEXT_PAGE_CLASS = 'nextpage';
const PREVIOUS_PAGE_CLASS = 'previouspage';

let authHeader = '';

const generateBasicAuthHeader = (login, password) => {
	return new Promise((resolve, reject) => {
		try {
			const reader = new FileReader();
			reader.readAsDataURL(new Blob([login + ':' + password]));
			reader.onerror = (e) => reject(e);
			reader.onloadend = () => {
				// data:application/octet-stream;base64,Z.....==
				const base64data = reader.result.split(',')[1];
				resolve('Basic ' + base64data);
			}

		} catch (error) {
			reject(error);
		}
	});
}

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

	if (authHeader.length > 0) {
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
	.then((res) => res.json())
	.then(async (data) => {
		if (data?.success !== true) {
			throw new Error('Неверный логин или пароль');
		}

		authHeader = await generateBasicAuthHeader(login, password);
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
	authHeader = '';
	output.classList.remove('error');
	authButton.textContent = 'Войти';

	document.body.querySelectorAll('.page').forEach(
		(b) => { b.disabled = true; }
	);

	searchButton.disabled = true;
	resetButton.disabled = true;

	perpageSelect.disabled = true;
	nameInput.disabled = true;
	phoneInput.disabled = true;
	addressInput.disabled = true;

	output.textContent = 'Залогинтесь';
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

	const url = new URL(location.origin + '/api/v2/abonents');
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
			'Authorization': authHeader,
		},
	})
	.then((res) => {
		return res.json();
	})
	.then((data) => {
		if (data?.error) {
			throw new Error(data?.message?.join('; ') || 'Неизвестная ошибка');
		}

		tbody.innerHTML = '';
		pagination.innerHTML = '';

		data.abonents.forEach((a) => {
			const tr = document.createElement('tr');
			tr.innerHTML = `<td>${a.name || '-'}</td><td>${a.phone || '-'}</td><td>${a.address || '-'}</td>`;
			tbody.append(tr);
		});

		let li = document.createElement('li');
		li.innerHTML = `<button type="button" class="page ${PREVIOUS_PAGE_CLASS}" ${!data.abonents.length || data.pageNumber === 1 ? 'disabled' : ''}> < </button>`;
		pagination.append(li);

		for (let i = 1; i <= data.totalPages; i++) {
			li = document.createElement('li');
			li.innerHTML = `<button type="button" class="page ${PAGE_NUMBER_CLASS} ${i === data.pageNumber ? ACTIVE_CLASS : ''}">${ i }</button>`;
			pagination.append(li);
		}

		li = document.createElement('li');
		li.innerHTML = `<button type="button" class="page ${NEXT_PAGE_CLASS}" ${!data.abonents.length || data.pageNumber === data.totalPages ? 'disabled' : ''}> > </button>`;
		pagination.append(li);

		output.textContent = `Получено ${ data.total } записей`;
	})
	.catch((err) => {
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
	authHeader.length > 0 ? logout() : login();
});
searchButton.addEventListener('click', searchAbonents);
pagination.addEventListener('click', paginateAbonents);

})();

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

const searchSection = document.body.querySelector('#search-section');
const tbody = document.body.querySelector('#abonents-list');
const searchButton = document.body.querySelector('#search');
const resetButton = document.body.querySelector('#reset');
const authButton = document.body.querySelector('#auth');
const pagination = document.body.querySelector('.pagination');
const perpageSelect = document.body.querySelector('#perpage');
const nameInput = document.body.querySelector('#name');
const phoneInput = document.body.querySelector('#phone');
const addressInput = document.body.querySelector('#address');
const output = document.body.querySelector('output > strong');

const detailsSection = document.body.querySelector('#details-section');
const abonentIdElement = document.body.querySelector('#abonent-id');
const abonentNameInput = document.body.querySelector('#abonent-name');
const abonentAddressInput = document.body.querySelector('#abonent-address');
const abonentPhoneInput = document.body.querySelector('#abonent-phone');
const abonentMobileInput = document.body.querySelector('#abonent-mobile');
const krossInput = document.body.querySelector('#kross');
const magistralInput = document.body.querySelector('#magistral');
const raspredInput = document.body.querySelector('#raspred');
const adslInput = document.body.querySelector('#adsl');
const boxes = document.body.querySelector('#boxes');
const backToListButton = document.body.querySelector('#back-to-list');

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

	if (loggedIn === false) {
		throw new Error('Вы уже вышли из системы');
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
	.then((res) => checkNginxErrorHtmlAndParseJson(res))
	.then((data) => {
		if (data?.error) {
			throw data;
		}

		if (data?.success !== true) {
			throw new Error('Неверный логин или пароль');
		}

		loggedIn = false;
		authButton.textContent = 'Войти';
		output.classList.add('error');
		output.textContent = 'Залогинтесь';
	})
	.catch((err) => {
		output.classList.add('error');
		let message = '';
		if (err?.error) {
			if (typeof err?.message === 'string') {
				message = err.message;
			}
			else if (Array.isArray(err?.message)) {
				message = err.message.join('; ');
			}
			else {
				message = 'Неизвестная ошибка';
			}

			if (err?.statusCode === 401 || err?.statusCode === 419) {
				loggedIn = false;
				authButton.textContent = 'Войти';
			}
		}
		else {
			message = err.message || 'Неизвестная ошибка';
		}

		output.textContent = message;
	})
	.finally(() => {
		authButton.disabled = false;

		if (loggedIn === true) {
			searchButton.disabled = false;
			resetButton.disabled = false;

			perpageSelect.disabled = false;
			nameInput.disabled = false;
			phoneInput.disabled = false;
			addressInput.disabled = false;
		}
	});
};

const initCheckAuth = () =>
{
	authButton.disabled = true;
	output.textContent = '';

	fetch('api/v2/check-auth')
		.then((res) => checkNginxErrorHtmlAndParseJson(res))
		.then((data) => {
			if (data?.success !== true) {
				throw data;
			}

			loggedIn = true;
			authButton.textContent = 'Выйти';

			searchButton.disabled = false;
			resetButton.disabled = false;

			perpageSelect.disabled = false;
			nameInput.disabled = false;
			phoneInput.disabled = false;
			addressInput.disabled = false;

			output.classList.remove('error');
			output.textContent = 'Можете приступать к поиску';
		})
		.catch((err) => {
			output.classList.add('error');
			let message = 'Залогинтесь';
			if (err?.error & err?.statusCode === 419 & typeof err?.message === 'string') {
				message = err.message;
			}
			output.textContent = message;
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
	.then((res) => checkNginxErrorHtmlAndParseJson(res))
	.then((data) => {
		if (data?.error) {
			throw data;
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
		output.classList.add('error');
		let message = '';
		if (err?.error) {
			if (typeof err?.message === 'string') {
				message = err.message;
			}
			else if (Array.isArray(err?.message)) {
				message = err.message.join('; ');
			}
			else {
				message = 'Неизвестная ошибка';
			}

			if (err?.statusCode === 401 || err?.statusCode === 419) {
				loggedIn = false;
				authButton.textContent = 'Войти';
			}
		}
		else {
			message = err.message || 'Неизвестная ошибка';
		}

		output.textContent = message;
	})
	.finally(() => {
		authButton.disabled = false;

		if (loggedIn === true) {
			searchButton.disabled = false;
			resetButton.disabled = false;

			perpageSelect.disabled = false;
			nameInput.disabled = false;
			phoneInput.disabled = false;
			addressInput.disabled = false;
		}
	});
};

const fetchAbonentDetails = (abonentID) => {
	if (!abonentID) {
		throw new Error('Ошибка приложения. Некорректный идентификатор абонента.');
	}

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

	return fetch(`api/v2/flat-abonents/${abonentID}`, {
		headers: {
			'accept-encoding': 'gzip',
		},
	})
	.then((res) => checkNginxErrorHtmlAndParseJson(res))
	.then((data) => {
		if (data?.error) {
			throw data;
		}

		const [
			apiAbonentID,
			apiName,
			apiAddress,
			apiPhone,
			apiMobile,
			apiKross,
			apiMagistral,
			apiRaspred,
			apiAdsl,
			apiBoxes,
			apiLatitude,
			apiLongitude,
		] = data;

		abonentIdElement.textContent = '#' + apiAbonentID;
		abonentNameInput.value = apiName || '';
		abonentAddressInput.value = apiAddress || '';
		abonentPhoneInput.value = apiPhone || '';
		abonentMobileInput.value = apiMobile || '';
		krossInput.value = apiKross || '';
		magistralInput.value = apiMagistral || '';
		raspredInput.value = apiRaspred || '';
		adslInput.value = apiAdsl || '';

		let boxesContent = '';
		apiBoxes.forEach((b, i) => {
			if (b) {
				boxesContent += `<input type="text" name="boxes${i + 1}" value="${b}" disabled />`;
			}
		});
		boxes.innerHTML = boxesContent;

		searchSection.classList.add('js-hidden');
		detailsSection.classList.remove('js-hidden');

	})
	.catch((err) => {
		output.classList.add('error');
		let message = '';
		if (err?.error) {
			if (typeof err?.message === 'string') {
				message = err.message;
			}
			else if (Array.isArray(err?.message)) {
				message = err.message.join('; ');
			}
			else {
				message = 'Неизвестная ошибка';
			}

			if (err?.statusCode === 401 || err?.statusCode === 419) {
				loggedIn = false;
				authButton.textContent = 'Войти';
			}
		}
		else {
			message = err.message || 'Неизвестная ошибка';
		}

		output.textContent = message;
	})
	.finally(() => {
		authButton.disabled = false;

		if (loggedIn === true) {
			searchButton.disabled = false;
			resetButton.disabled = false;

			perpageSelect.disabled = false;
			nameInput.disabled = false;
			phoneInput.disabled = false;
			addressInput.disabled = false;
			backToListButton.disabled = false;

			pagination.querySelectorAll('button').forEach(
				(b) => { b.disabled = false; }
			);
		}
	});
};

const closeDetails = () => {
	searchSection.classList.remove('js-hidden');
	detailsSection.classList.add('js-hidden');
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

tbody.addEventListener('click', (ev) => {
	const targetAbonentID = ev.target.closest('tr').querySelector('td').textContent;
	fetchAbonentDetails(targetAbonentID);
});
backToListButton.addEventListener('click', closeDetails);


document.addEventListener('DOMContentLoaded', initCheckAuth, {once: true});

})();

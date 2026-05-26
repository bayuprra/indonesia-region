const tokenStorageKey = 'indonesia-regions-access-token';
const userStorageKey = 'indonesia-regions-user';

const loginView = document.getElementById('login-view');
const regionsView = document.getElementById('regions-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const appError = document.getElementById('app-error');
const sessionEmail = document.getElementById('session-email');
const logoutButton = document.getElementById('logout-button');
const provinceSelect = document.getElementById('province-select');
const citySelect = document.getElementById('city-select');
const districtSelect = document.getElementById('district-select');
const villageCount = document.getElementById('village-count');
const villagesBody = document.getElementById('villages-body');

function getToken() {
  return window.localStorage.getItem(tokenStorageKey);
}

function setSession(session, user) {
  window.localStorage.setItem(tokenStorageKey, session.access_token);
  window.localStorage.setItem(userStorageKey, JSON.stringify(user));
}

function clearSession() {
  window.localStorage.removeItem(tokenStorageKey);
  window.localStorage.removeItem(userStorageKey);
}

function getStoredUser() {
  const raw = window.localStorage.getItem(userStorageKey);
  return raw ? JSON.parse(raw) : null;
}

function showError(element, message) {
  element.textContent = message;
  element.hidden = false;
}

function clearError(element) {
  element.textContent = '';
  element.hidden = true;
}

function showLogin() {
  loginView.hidden = false;
  regionsView.hidden = true;
}

function showRegions() {
  const user = getStoredUser();
  sessionEmail.textContent = user && user.email ? user.email : '';
  loginView.hidden = true;
  regionsView.hidden = false;
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    clearSession();
    showLogin();
    throw new Error('Authentication required');
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

function fillSelect(select, records, placeholder) {
  select.innerHTML = '';

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);

  records.forEach((record) => {
    const option = document.createElement('option');
    option.value = record.code;
    option.textContent = `${record.code} - ${record.name}`;
    select.appendChild(option);
  });
}

function renderVillages(records) {
  villagesBody.innerHTML = '';
  villageCount.textContent = `${records.length} record${records.length === 1 ? '' : 's'}`;

  records.forEach((record) => {
    const row = document.createElement('tr');
    const codeCell = document.createElement('td');
    const nameCell = document.createElement('td');

    codeCell.textContent = record.code;
    nameCell.textContent = record.name;
    row.append(codeCell, nameCell);
    villagesBody.appendChild(row);
  });
}

async function loadProvinces() {
  const payload = await apiFetch('/api/regions/provinces');
  fillSelect(provinceSelect, payload.data, 'Select province');
  fillSelect(citySelect, [], 'Select city / regency');
  fillSelect(districtSelect, [], 'Select district');
  renderVillages([]);
}

async function loadCities(provinceCode) {
  const payload = await apiFetch(`/api/regions/cities?province_code=${encodeURIComponent(provinceCode)}`);
  fillSelect(citySelect, payload.data, 'Select city / regency');
  fillSelect(districtSelect, [], 'Select district');
  renderVillages([]);
}

async function loadDistricts(cityCode) {
  const payload = await apiFetch(`/api/regions/districts?city_code=${encodeURIComponent(cityCode)}`);
  fillSelect(districtSelect, payload.data, 'Select district');
  renderVillages([]);
}

async function loadVillages(districtCode) {
  const payload = await apiFetch(`/api/regions/villages?district_code=${encodeURIComponent(districtCode)}`);
  renderVillages(payload.data);
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError(loginError);

  const formData = new FormData(loginForm);
  const email = formData.get('email') || document.getElementById('email').value;
  const password = formData.get('password') || document.getElementById('password').value;

  try {
    const payload = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    setSession(payload.session, payload.user);
    showRegions();
    await loadProvinces();
  } catch (error) {
    showError(loginError, error.message);
  }
});

logoutButton.addEventListener('click', async () => {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    // The local session is still cleared even if the network request fails.
  }

  clearSession();
  showLogin();
});

provinceSelect.addEventListener('change', async () => {
  clearError(appError);

  if (!provinceSelect.value) {
    fillSelect(citySelect, [], 'Select city / regency');
    fillSelect(districtSelect, [], 'Select district');
    renderVillages([]);
    return;
  }

  try {
    await loadCities(provinceSelect.value);
  } catch (error) {
    showError(appError, error.message);
  }
});

citySelect.addEventListener('change', async () => {
  clearError(appError);

  if (!citySelect.value) {
    fillSelect(districtSelect, [], 'Select district');
    renderVillages([]);
    return;
  }

  try {
    await loadDistricts(citySelect.value);
  } catch (error) {
    showError(appError, error.message);
  }
});

districtSelect.addEventListener('change', async () => {
  clearError(appError);

  if (!districtSelect.value) {
    renderVillages([]);
    return;
  }

  try {
    await loadVillages(districtSelect.value);
  } catch (error) {
    showError(appError, error.message);
  }
});

async function boot() {
  if (!getToken()) {
    showLogin();
    return;
  }

  try {
    const payload = await apiFetch('/api/auth/me');
    window.localStorage.setItem(userStorageKey, JSON.stringify(payload.user));
    showRegions();
    await loadProvinces();
  } catch (error) {
    clearSession();
    showLogin();
  }
}

boot();

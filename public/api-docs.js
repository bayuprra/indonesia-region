const nav = document.getElementById('docs-nav');
const endpointSections = document.getElementById('endpoint-sections');
const baseUrl = document.getElementById('base-url');

const examples = {
  'GET /api/health': {
    curl: 'curl http://localhost:3001/api/health'
  },
  'POST /api/auth/login': {
    curl: [
      'curl -X POST http://localhost:3001/api/auth/login \\',
      '  -H "Content-Type: application/json" \\',
      '  -d \'{"email":"user@example.com","password":"password"}\''
    ].join('\n')
  },
  'GET /api/auth/me': {
    curl: [
      'curl http://localhost:3001/api/auth/me \\',
      '  -H "Authorization: Bearer <access_token>"'
    ].join('\n')
  },
  'GET /api/regions/metadata': {
    curl: [
      'curl http://localhost:3001/api/regions/metadata \\',
      '  -H "Authorization: Bearer <access_token>"'
    ].join('\n')
  },
  'GET /api/regions/provinces': {
    curl: [
      'curl http://localhost:3001/api/regions/provinces \\',
      '  -H "Authorization: Bearer <access_token>"'
    ].join('\n')
  },
  'GET /api/regions/cities': {
    curl: [
      'curl "http://localhost:3001/api/regions/cities?province_code=31" \\',
      '  -H "Authorization: Bearer <access_token>"'
    ].join('\n')
  },
  'GET /api/regions/districts': {
    curl: [
      'curl "http://localhost:3001/api/regions/districts?city_code=3174" \\',
      '  -H "Authorization: Bearer <access_token>"'
    ].join('\n')
  },
  'GET /api/regions/villages': {
    curl: [
      'curl "http://localhost:3001/api/regions/villages?district_code=317409" \\',
      '  -H "Authorization: Bearer <access_token>"'
    ].join('\n')
  },
  'POST /api/admin/regions/regenerate': {
    curl: [
      'curl -X POST http://localhost:3001/api/admin/regions/regenerate \\',
      '  -H "Content-Type: application/json" \\',
      '  -H "x-admin-token: <ADMIN_API_TOKEN>" \\',
      '  -d \'{"province_codes":["31"],"concurrency":8}\''
    ].join('\n')
  }
};

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function methodClass(method) {
  return `method method-${method.toLowerCase()}`;
}

function securityLabel(operation) {
  if (!operation.security || operation.security.length === 0) {
    return 'Open';
  }

  if (operation.security.some((item) => item.bearerAuth)) {
    return 'Bearer JWT';
  }

  if (operation.security.some((item) => item.adminToken)) {
    return 'Admin token';
  }

  return 'Auth';
}

function createCodeBlock(value) {
  const wrapper = document.createElement('div');
  const pre = document.createElement('pre');
  const button = document.createElement('button');

  wrapper.className = 'code-block';
  button.className = 'copy-button';
  button.type = 'button';
  button.textContent = 'Copy';
  pre.textContent = value;

  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(value);
    button.textContent = 'Copied';
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 1200);
  });

  wrapper.append(button, pre);
  return wrapper;
}

function createParamTable(parameters) {
  if (!parameters || parameters.length === 0) {
    return null;
  }

  const table = document.createElement('table');
  table.className = 'param-table';
  table.innerHTML = '<thead><tr><th>Name</th><th>In</th><th>Required</th><th>Example</th></tr></thead>';

  const body = document.createElement('tbody');

  parameters.forEach((parameter) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><code>${parameter.name}</code></td>
      <td>${parameter.in}</td>
      <td>${parameter.required ? 'Yes' : 'No'}</td>
      <td><code>${parameter.example || ''}</code></td>
    `;
    body.appendChild(row);
  });

  table.appendChild(body);
  return table;
}

function createEndpointCard(method, path, operation) {
  const key = `${method.toUpperCase()} ${path}`;
  const card = document.createElement('article');
  const auth = securityLabel(operation);
  const id = slugify(key);
  const example = examples[key] && examples[key].curl;

  card.className = 'endpoint-card';
  card.id = id;

  const header = document.createElement('div');
  header.className = 'endpoint-header';
  header.innerHTML = `
    <span class="${methodClass(method)}">${method.toUpperCase()}</span>
    <div class="endpoint-path">
      <code>${path}</code>
      <span>${operation.summary || ''}</span>
    </div>
    <div class="badge-row">
      <span class="badge ${auth === 'Open' ? 'badge-open' : 'badge-auth'}">${auth}</span>
    </div>
  `;

  const body = document.createElement('div');
  body.className = 'endpoint-body';

  if (operation.description) {
    const description = document.createElement('p');
    description.textContent = operation.description;
    body.appendChild(description);
  }

  const params = createParamTable(operation.parameters);
  if (params) {
    body.appendChild(params);
  }

  if (operation.requestBody) {
    const heading = document.createElement('h3');
    heading.textContent = 'Request body';
    body.appendChild(heading);
    body.appendChild(createCodeBlock(JSON.stringify(operation.requestBody.content['application/json'].example || operation.requestBody.content['application/json'].examples || {}, null, 2)));
  }

  if (example) {
    const heading = document.createElement('h3');
    heading.textContent = 'Example';
    body.appendChild(heading);
    body.appendChild(createCodeBlock(example));
  }

  card.append(header, body);
  return card;
}

function renderSpec(spec) {
  baseUrl.textContent = window.location.origin;

  const grouped = new Map();

  Object.entries(spec.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const tag = (operation.tags && operation.tags[0]) || 'Other';
      if (!grouped.has(tag)) {
        grouped.set(tag, []);
      }
      grouped.get(tag).push({ path, method, operation });
    });
  });

  grouped.forEach((items, tag) => {
    const groupId = slugify(tag);
    const navGroup = document.createElement('section');
    navGroup.className = 'nav-group';
    navGroup.innerHTML = `<h3>${tag}</h3>`;

    const section = document.createElement('section');
    section.className = 'tag-section';
    section.id = groupId;
    section.innerHTML = `<h2>${tag}</h2>`;

    items.forEach(({ path, method, operation }) => {
      const key = `${method.toUpperCase()} ${path}`;
      const endpointId = slugify(key);
      const link = document.createElement('a');
      link.href = `#${endpointId}`;
      link.textContent = key;
      navGroup.appendChild(link);
      section.appendChild(createEndpointCard(method, path, operation));
    });

    nav.appendChild(navGroup);
    endpointSections.appendChild(section);
  });
}

fetch('/api/openapi.json')
  .then((response) => response.json())
  .then(renderSpec)
  .catch((error) => {
    endpointSections.textContent = `Failed to load API specification: ${error.message}`;
  });

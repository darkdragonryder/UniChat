const ADMIN_PASSWORD = 'yourStrongPassword123';

let licenses = [];

async function load() {
  const res = await fetch('/api/licenses', {
    headers: {
      'x-admin-pass': ADMIN_PASSWORD
    }
  });

  licenses = await res.json();
  render(licenses);
}

function render(data) {
  const table = document.getElementById('table');
  table.innerHTML = '';

  data.forEach(l => {
    const status =
      l.expired
        ? '❌ EXPIRED'
        : l.expiresAt === null
          ? '♾️ LIFETIME'
          : '✅ ACTIVE';

    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${l.key}</td>
      <td>${l.type}</td>
      <td>${l.usedByGuild || '-'}</td>
      <td>${l.usedByUser || '-'}</td>
      <td>${status}</td>
      <td>
        <button onclick="revoke('${l.key}')">Revoke</button>
      </td>
    `;

    table.appendChild(row);
  });
}

async function revoke(key) {
  await fetch('/api/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pass': ADMIN_PASSWORD
    },
    body: JSON.stringify({ key })
  });

  load();
}

document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();

  const filtered = licenses.filter(l =>
    (l.key || '').toLowerCase().includes(q) ||
    (l.usedByGuild || '').toLowerCase().includes(q) ||
    (l.usedByUser || '').toLowerCase().includes(q)
  );

  render(filtered);
});

load();

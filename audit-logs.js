// audit-logs.js - Logica specifica per la pagina Log di Audit

// Sovrascrive la funzione renderCurrentPage
UI.renderCurrentPage = function() {
  this.renderAuditLogs();
};

UI.renderAuditLogs = async function() {
  const container = this.qs('#auditLogsContent');
  if (!container) return;

  // Stato di caricamento
  container.innerHTML = `
    <div class="text-center text-gray-500">
      <p>Caricamento log di audit...</p>
    </div>
  `;

  try {
    const logs = await this.loadAuditLogs();

    if (!logs || logs.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-500">
          <p>Nessun log disponibile.</p>
        </div>
      `;
      return;
    }

    // Ordina per data desc
    logs.sort((a, b) => {
      const da = this.toJsDate(a.timestamp);
      const db = this.toJsDate(b.timestamp);
      return (db - da);
    });

    const rows = logs.map(l => {
      const d = this.toJsDate(l.timestamp);
      const ds = isNaN(d) ? '' : d.toLocaleString('it-IT');
      // Ricava nome staff da email se possibile
      const staffMember = (this.state.staff || []).find(s => (s.email || '').toLowerCase() === (l.userEmail || '').toLowerCase());
      const displayName = staffMember ? `${staffMember.nome} ${staffMember.cognome}` : '';
      return `
        <tr class="border-b last:border-0">
          <td class="p-2 whitespace-nowrap">${ds}</td>
          <td class="p-2 font-medium">${l.action}</td>
          <td class="p-2">${escapeHtml(displayName)}</td>
          <td class="p-2 text-gray-600 text-sm">${escapeHtml(JSON.stringify(l.changes || {}))}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-gray-100 text-gray-700">
            <tr>
              <th class="p-2">Data</th>
              <th class="p-2">Azione</th>
              <th class="p-2">Chi</th>
              <th class="p-2">Cosa</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Errore caricamento audit logs:', error);
    container.innerHTML = `
      <div class="text-center text-red-600">
        <p>Errore nel caricamento dei log.</p>
      </div>
    `;
  }
};

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Inizializza la pagina audit logs
document.addEventListener('DOMContentLoaded', () => {
  console.log('Pagina Log Audit caricata');
});





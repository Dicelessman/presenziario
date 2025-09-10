// calendario.js - Logica specifica per la pagina Calendario

UI.renderCurrentPage = function() {
  this.renderCalendarList();
  this.setupCalendarEvents();
};

UI.setupCalendarEvents = function() {
  const form = this.qs('#addActivityForm');
  if (form && !form._bound) {
    form._bound = true;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentUser) { alert('Devi essere loggato per aggiungere attività.'); return; }
      const tipo = this.qs('#activityTipo').value;
      const data = new Date(this.qs('#activityData').value);
      const descrizione = this.qs('#activityDescrizione').value.trim();
      const costo = this.qs('#activityCosto').value || '0';
      await DATA.addActivity({ tipo, data, descrizione, costo }, this.currentUser);
      this.state = await DATA.loadAll();
      this.rebuildPresenceIndex();
      this.renderCalendarList();
      form.reset();
    });
  }
};

UI.renderCalendarList = function() {
  const list = this.qs('#calendarList');
  if (!list) return;
  list.innerHTML = '';

  const activities = (this.state.activities || []).slice().sort((a, b) => this.toJsDate(a.data) - this.toJsDate(b.data));
  if (!activities.length) {
    list.innerHTML = '<p class="text-gray-500">Nessuna attività pianificata.</p>';
    return;
  }

  const today = new Date(); today.setHours(0,0,0,0);
  let nextActivityId = null;
  for (const a of activities) {
    const d = this.toJsDate(a.data); const dd = new Date(d); dd.setHours(0,0,0,0);
    if (dd >= today) { nextActivityId = a.id; break; }
  }

  activities.forEach(a => {
    const d = this.toJsDate(a.data);
    const ds = isNaN(d) ? '' : d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const isNext = a.id === nextActivityId;
    const costoLabel = parseFloat(a.costo || '0') > 0 ? ` — Costo: € ${a.costo}` : '';
    const bgClass = isNext ? 'bg-green-50 border-l-4 border-green-500' : 'bg-white';
    const textClass = isNext ? 'text-green-800' : 'text-green-700';
    list.insertAdjacentHTML('beforeend', `
      <div class="p-4 ${bgClass} rounded-lg shadow-sm flex items-start justify-between gap-4">
        <div>
          <p class="font-medium text-lg ${textClass}">${a.tipo} — ${ds}${isNext ? ' (Prossima)' : ''}</p>
          <p class="text-gray-700">${a.descrizione}${costoLabel}</p>
        </div>
      </div>
    `);
  });
};




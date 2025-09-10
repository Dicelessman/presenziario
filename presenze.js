// presenze.js - Logica specifica per la pagina Presenze

// Sovrascrive la funzione renderCurrentPage
UI.renderCurrentPage = function() {
  this.renderPresenceTable();
  this.setupPresenceEventListeners();
};

UI.setupPresenceEventListeners = function() {
  // Event listeners specifici per le presenze (mobile nav già opzionali)
  const prev = this.qs('#mobileActivityPrev');
  const next = this.qs('#mobileActivityNext');
  if (prev) prev.addEventListener('click', () => console.log('Prev activity'));
  if (next) next.addEventListener('click', () => console.log('Next activity'));
};

UI.getActivitiesSorted = function() {
  return [...(this.state.activities || [])].sort((a, b) => new Date(a.data) - new Date(b.data));
};

UI.getPresence = function(scoutId, activityId) {
  const key = `${scoutId}_${activityId}`;
  return this.presenceIndex?.get(key) || null;
};

UI.getDedupedPresences = function() {
  return Array.from(this.presenceIndex?.values() || []);
};

UI.formatDisplayDate = function(value) {
  const d = value && value.toDate ? value.toDate() : new Date(value);
  if (isNaN(d)) return '';
  const giorni = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
  const giorno = giorni[d.getDay()];
  const data = d.toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'2-digit' });
  return `${giorno} ${data}`;
};

UI._scoutSortDir = UI._scoutSortDir || 'asc';
UI._presenceTableScrollLeft = UI._presenceTableScrollLeft || 0;

UI.renderPresenceTable = function() {
  const body = this.qs('#presenceTableBody');
  const thDates = this.qs('#tableHeaderDates');
  const thNames = this.qs('#tableHeaderNames');
  if (!body || !thDates || !thNames) return;

  const container = this.qs('#presenceTableContainer');
  const prevScroll = container ? container.scrollLeft : 0;
  const savedScroll = sessionStorage.getItem('presenceTableScrollLeft');

  body.innerHTML = '';
  thDates.innerHTML = '<th id="thScoutName" rowspan="2" class="cursor-pointer select-none sticky left-0 !bg-green-800 !text-white !p-4 !border-r !border-white/50 text-left" title="Ordina per Esploratore">Esploratore</th>';
  thNames.innerHTML = '';

  const totalScouts = (this.state.scouts || []).length;
  const acts = this.getActivitiesSorted();

  // Header
  acts.forEach(a => {
    const presentCount = this.getDedupedPresences().filter(p => p.attivitaId === a.id && p.stato === 'Presente').length;
    const perc = totalScouts ? Math.round((presentCount / totalScouts) * 100) : 0;
    const displayDate = this.formatDisplayDate(a.data);
    thDates.insertAdjacentHTML('beforeend', `<th class="p-2 border-b-2 border-gray-200 bg-green-800 text-white font-semibold sticky top-0 border-r border-white/40">${displayDate}</th>`);
    thNames.insertAdjacentHTML('beforeend', `<th class="p-2 border-b-2 border-gray-200 bg-green-800 text-white font-semibold sticky top-0 border-r border-white/40">${a.tipo}<div class="text-xs font-normal text-white/90">${perc}% (${presentCount}/${totalScouts})</div></th>`);
  });

  // Sort handler su intestazione Esploratore
  const thScout = this.qs('#thScoutName');
  if (thScout && !thScout._sortBound) {
    thScout._sortBound = true;
    thScout.addEventListener('click', () => {
      this._scoutSortDir = this._scoutSortDir === 'asc' ? 'desc' : 'asc';
      this.renderPresenceTable();
    });
  }

  // Righe
  let sortedScouts = [...(this.state.scouts || [])].sort((a, b) => {
    const an = `${a.nome} ${a.cognome}`.toLowerCase();
    const bn = `${b.nome} ${b.cognome}`.toLowerCase();
    return an.localeCompare(bn);
  });
  if (this._scoutSortDir === 'desc') sortedScouts.reverse();

  sortedScouts.forEach(s => {
    const totalActs = (this.state.activities || []).length;
    const presentCount = this.getDedupedPresences().filter(p => p.esploratoreId === s.id && p.stato === 'Presente').length;
    const perc = totalActs ? Math.round((presentCount / totalActs) * 100) : 0;
    let row = `<tr><td class="p-4 border-r-2 border-gray-200 bg-gray-50 font-semibold text-left sticky left-0">${s.nome} ${s.cognome}
      <div class="text-xs font-normal text-gray-500">${presentCount} / ${totalActs} (${perc}%)</div>
    </td>`;

    acts.forEach(a => {
      const presence = this.getPresence(s.id, a.id) || { stato:'NR', pagato:false, tipoPagamento:null };
      const disabled = (this.selectedStaffId && this.currentUser) ? '' : 'disabled';
      const needsPayment = parseFloat(a.costo || '0') > 0;

      row += `<td class="p-2 border-r border-b border-gray-200">
        <div class="flex flex-col items-center gap-1">
          <select class="presence-select" data-selected="${presence.stato}" ${disabled}
            onchange="UI.updatePresenceCell({field:'stato', value:this.value, scoutId:'${s.id}', activityId:'${a.id}'})">
            <option value="Presente" ${presence.stato==='Presente'?'selected':''}>P</option>
            <option value="Assente" ${presence.stato==='Assente'?'selected':''}>A</option>
            <option value="NR" ${presence.stato==='NR'?'selected':''}>NR</option>
          </select>
          ${needsPayment ? `
          <div class="payment-section">
            <select class="payment-select mt-1" data-selected="${presence.pagato ? (presence.tipoPagamento || 'Pagato') : ''}" ${disabled}
              onchange="UI.updatePaymentCombined({value:this.value, scoutId:'${s.id}', activityId:'${a.id}'})">
              <option value="" ${!presence.pagato?'selected':''}>Non Pagato</option>
              <option value="Contanti" ${(presence.pagato && presence.tipoPagamento==='Contanti')?'selected':''}>Contanti</option>
              <option value="Satispay" ${(presence.pagato && presence.tipoPagamento==='Satispay')?'selected':''}>Satispay</option>
              <option value="Bonifico" ${(presence.pagato && presence.tipoPagamento==='Bonifico')?'selected':''}>Bonifico</option>
            </select>
          </div>` : ''}
        </div>
      </td>`;
    });

    row += `</tr>`;
    body.insertAdjacentHTML('beforeend', row);
  });

  // Ripristina posizione di scroll
  if (container) {
    const targetScroll = prevScroll || (savedScroll ? parseInt(savedScroll, 10) : 0);
    container.scrollLeft = isNaN(targetScroll) ? 0 : targetScroll;
    // Salva scroll su evento
    if (!container._scrollSaveBound) {
      container._scrollSaveBound = true;
      container.addEventListener('scroll', () => {
        sessionStorage.setItem('presenceTableScrollLeft', String(container.scrollLeft));
      }, { passive: true });
    }
  }
};

// Inizializza la pagina presenze
document.addEventListener('DOMContentLoaded', () => {
  console.log('Pagina Presenze caricata');
});

// esploratori.js - Logica specifica per la pagina Esploratori

// Sovrascrive la funzione renderCurrentPage
UI.renderCurrentPage = function() {
  this.renderScouts();
  this.setupScoutsEventListeners();
};

UI.setupScoutsEventListeners = function() {
  // Event listener per form aggiunta esploratore
  const form = this.qs('#addScoutForm');
  if (!form || form._bound) return;
  form._bound = true;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!this.currentUser) { 
      alert('Devi essere loggato per aggiungere esploratori.'); 
      return; 
    }
    
    const nome = this.qs('#scoutNome').value.trim();
    const cognome = this.qs('#scoutCognome').value.trim();
    
    await DATA.addScout({ nome, cognome }, this.currentUser);
    this.state = await DATA.loadAll();
    this.rebuildPresenceIndex();
    this.renderScouts();
    
    // Reset form
    form.reset();
  });
};

UI.renderScouts = function() {
  const list = this.qs('#scoutsList');
  if (!list) return;
  
  const sortedScouts = [...this.state.scouts].sort((a, b) => 
    a.nome.localeCompare(b.nome) || a.cognome.localeCompare(b.cognome)
  );

  this.renderInBatches({
    container: list,
    items: sortedScouts,
    batchSize: 200,
    renderItem: (scout) => {
      const toDate = (v) => (v && v.toDate) ? v.toDate() : (v ? new Date(v) : null);
      const fmt = (v) => { const d = toDate(v); return d && !isNaN(d) ? d.toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'2-digit' }) : ''; };
      const label = (abbr, val, color) => `<span class="text-${color} font-medium">${abbr}</span> <span class="text-gray-800">${val || '-'}</span>`;
      
      // Solo campi valorizzati
      const fields = [];
     
      if (scout.pv_promessa) fields.push(label('P', '', 'blue-700'));
      if (scout.pv_traccia1?.done) fields.push(label('T1', '', 'amber-700'));
      if (scout.pv_traccia2?.done) fields.push(label('T2', '', 'purple-700'));
      if (scout.pv_traccia3?.done) fields.push(label('T3', '', 'teal-700'));
      
      // Conta solo le specialità che hanno almeno una data di conseguimento valorizzata
      let specTot = 0;
      if (Array.isArray(scout.specialita)) {
        specTot = scout.specialita.filter(spec => {
          // Una specialità è considerata conseguita se ha almeno una data valorizzata
          return (spec.p1?.data && spec.p1.data.trim()) || 
                 (spec.p2?.data && spec.p2.data.trim()) || 
                 (spec.p3?.data && spec.p3.data.trim()) || 
                 (spec.cr?.data && spec.cr.data.trim());
        }).length;
      }
      if (specTot > 0) fields.push(label('Sp', String(specTot), 'rose-700'));
      
      if (scout.pv_giglio_data) fields.push(label('GT', '', 'indigo-700'));
     
      // CP/VCP - solo il valore
      if (scout.pv_vcp_cp) fields.push(`<span class="text-green-700 font-medium">${scout.pv_vcp_cp}</span>`);
      
      // Calcolo percentuale presenze
      const acts = this.state.activities || [];
      const pres = UI.getDedupedPresences ? UI.getDedupedPresences() : (this.state.presences || []);
      const today = new Date(); today.setHours(0,0,0,0);
      let nextActivityId = null;
      const pastIds = acts.filter(a => {
        const ad = (a.data && a.data.toDate) ? a.data.toDate() : new Date(a.data);
        const aday = new Date(ad); aday.setHours(0,0,0,0);
        if (nextActivityId === null && aday >= today) { nextActivityId = a.id; }
        return aday < today;
      }).map(a => a.id);
      const consideredIds = nextActivityId ? [...pastIds, nextActivityId] : pastIds;

      const validActIds = consideredIds.filter(aid => {
        const pr = pres.find(p => p.esploratoreId === scout.id && p.attivitaId === aid);
        return pr && (pr.stato === 'Presente' || pr.stato === 'Assente');
      });
      const presentCount = pres.filter(p => p.esploratoreId === scout.id && p.stato === 'Presente' && validActIds.includes(p.attivitaId)).length;
      const perc = validActIds.length ? Math.round((presentCount / validActIds.length) * 100) : 0;
      
      if (perc > 0) fields.push(label('Pr', String(perc), 'emerald-700'));

      return `
        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
          <div class="flex-1">
            <h4 class="font-medium text-gray-900"><a href="scout.html?id=${scout.id}" class="hover:underline">${scout.nome} ${scout.cognome}</a></h4>
            <div class="text-sm flex flex-wrap gap-x-4 gap-y-1 mt-1">
              ${fields.join('')}
            </div>
          </div>
          <div class="flex gap-2">
            <button 
              onclick="UI.openEditScoutModal('${scout.id}')" 
              class="p-2 text-gray-500 hover:text-green-600 rounded-full"
              ${this.currentUser ? '' : 'disabled'}
            >
              ✏️
            </button>
            <button 
              onclick="UI.confirmDeleteScout('${scout.id}')" 
              class="p-2 text-gray-500 hover:text-red-600 rounded-full"
              ${this.currentUser ? '' : 'disabled'}
            >
              🗑️
            </button>
          </div>
        </div>
      `;
    }
  });
};

UI.openEditScoutModal = function(id) {
  if (!this.currentUser) { 
    alert('Devi essere loggato per modificare esploratori.'); 
    return; 
  }
  
  const scout = this.state.scouts.find(s => s.id === id);
  if (!scout) return;
  
  this.qs('#editScoutId').value = scout.id;
  this.qs('#editScoutNome').value = scout.nome;
  this.qs('#editScoutCognome').value = scout.cognome;
  
  this.showModal('editScoutModal');
};

UI.confirmDeleteScout = function(id) {
  if (!this.currentUser) { 
    alert('Devi essere loggato per eliminare esploratori.'); 
    return; 
  }
  
  const scout = this.state.scouts.find(s => s.id === id);
  if (!scout) return;
  
  this.scoutToDeleteId = id;
  this.qs('#scoutNameToDelete').textContent = `${scout.nome} ${scout.cognome}`;
  this.showModal('confirmDeleteScoutModal');
};

// Inizializza la pagina esploratori
document.addEventListener('DOMContentLoaded', () => {
  console.log('Pagina Esploratori caricata');
});
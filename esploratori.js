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
      const vcp = scout.pv_vcp_cp || '';
      const promessa = fmt(scout.pv_promessa) || '';
      const t1 = scout.pv_traccia1?.done ? (fmt(scout.pv_traccia1.data) || '✓') : '';
      const t2 = scout.pv_traccia2?.done ? (fmt(scout.pv_traccia2.data) || '✓') : '';
      const t3 = scout.pv_traccia3?.done ? (fmt(scout.pv_traccia3.data) || '✓') : '';
      const specTot = Array.isArray(scout.specialita) ? scout.specialita.length : 0;
      const giglio = fmt(scout.pv_giglio_data) || '';
      const acts = this.state.activities || [];
      const pres = UI.getDedupedPresences ? UI.getDedupedPresences() : (this.state.presences || []);
      const presentCount = pres.filter(p => p.esploratoreId === scout.id && p.stato === 'Presente').length;
      const perc = acts.length ? Math.round((presentCount / acts.length) * 100) : 0;

      return `
        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
          <div class="flex-1">
            <h4 class="font-medium text-gray-900"><a href="scout.html?id=${scout.id}" class="hover:underline">${scout.nome} ${scout.cognome}</a></h4>
            <div class="text-sm flex flex-wrap gap-x-4 gap-y-1 mt-1">
              ${label('CP', vcp, 'green-700')}
              ${label('Pr', promessa, 'blue-700')}
              ${label('T1', t1, 'amber-700')}
              ${label('T2', t2, 'purple-700')}
              ${label('T3', t3, 'teal-700')}
              ${label('Sp', String(specTot), 'rose-700')}
              ${label('G', giglio, 'indigo-700')}
              ${label('%', String(perc), 'emerald-700')}
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
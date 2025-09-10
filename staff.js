// staff.js - Logica specifica per la pagina Staff

// Sovrascrive la funzione renderCurrentPage
UI.renderCurrentPage = function() {
  this.renderStaff();
  this.setupStaffEventListeners();
};

UI.setupStaffEventListeners = function() {
  // Event listener per form aggiunta staff (una sola volta)
  const form = this.qs('#addStaffForm');
  if (!form || form._bound) return;
  form._bound = true;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!this.currentUser) {
      alert("Devi essere loggato per aggiungere staff.");
      return;
    }

    const nome = this.qs('#staffNome').value.trim();
    const cognome = this.qs('#staffCognome').value.trim();
    const email = this.qs('#staffEmail').value.trim();

    await DATA.addStaff({ nome, cognome, email }, this.currentUser);
    this.state = await DATA.loadAll();
    this.rebuildPresenceIndex();
    this.renderStaff();

    // Reset form
    form.reset();
  });
};

UI.renderStaff = function() {
  const list = this.qs('#staffList');
  if (!list) return;

  const sortedStaff = [...(this.state.staff || [])].sort((a, b) =>
    a.nome.localeCompare(b.nome) || a.cognome.localeCompare(b.cognome)
  );

  this.renderInBatches({
    container: list,
    items: sortedStaff,
    batchSize: 200,
    renderItem: (member) => `
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <div class="flex-1">
          <h4 class="font-medium text-gray-900">${member.nome} ${member.cognome}</h4>
          <p class="text-sm text-gray-600">${member.email || ''}</p>
          <p class="text-sm text-gray-600">ID: ${member.id}</p>
        </div>
        <div class="flex gap-2">
          <button 
            onclick="UI.openEditStaffModal('${member.id}')" 
            class="p-2 text-gray-500 hover:text-green-600 rounded-full"
            ${this.currentUser ? '' : 'disabled'}
          >
            ✏️
          </button>
          <button 
            onclick="UI.confirmDeleteStaff('${member.id}')" 
            class="p-2 text-gray-500 hover:text-red-600 rounded-full"
            ${this.currentUser ? '' : 'disabled'}
          >
            🗑️
          </button>
        </div>
      </div>
    `
  });
};

UI.openEditStaffModal = function(id) {
  if (!this.currentUser) {
    alert("Devi essere loggato per modificare staff.");
    return;
  }

  const member = (this.state.staff || []).find(s => s.id === id);
  if (!member) return;

  this.qs('#editStaffId').value = member.id;
  this.qs('#editStaffNome').value = member.nome || '';
  this.qs('#editStaffCognome').value = member.cognome || '';
  this.qs('#editStaffEmail').value = member.email || '';

  this.showModal('editStaffModal');
};

UI.confirmDeleteStaff = function(id) {
  if (!this.currentUser) {
    alert("Devi essere loggato per eliminare staff.");
    return;
  }

  const member = (this.state.staff || []).find(s => s.id === id);
  if (!member) return;

  this.staffToDeleteId = id;
  const span = this.qs('#staffNameToDelete');
  if (span) span.textContent = `${member.nome} ${member.cognome}`;
  this.showModal('confirmDeleteStaffModal');
};

// Inizializza la pagina staff
document.addEventListener('DOMContentLoaded', () => {
  console.log('Pagina Staff caricata');
});





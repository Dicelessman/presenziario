// app.js (ES Module)
// --- Firebase (optional) ---
// If you want Firestore, fill firebaseConfig and set DATA.useFirestore() below.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, addDoc, setDoc, deleteDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ============== Data Layer ==============
class LocalAdapter {
  constructor() {
    const saved = JSON.parse(localStorage.getItem('presenziario-state') || '{}');
    this.state = {
      scouts: saved.scouts || [
        { id: 's1', nome: 'Mario', cognome: 'Rossi' },
        { id: 's2', nome: 'Luisa', cognome: 'Bianchi' },
        { id: 's3', nome: 'Andrea', cognome: 'Verdi' }
      ],
      staff: saved.staff || [
        { id: 'st1', nome: 'Giulia', cognome: 'Esposito' },
        { id: 'st2', nome: 'Marco', cognome: 'Gallo' }
      ],
      activities: saved.activities || [
        { id: 'a1', nome: 'Uscita al lago', data: '18/08/2024', pagamento: true },
        { id: 'a2', nome: 'Riunione settimanale', data: '25/08/2024', pagamento: false },
        { id: 'a3', nome: 'Escursione in montagna', data: '01/09/2024', pagamento: true },
        { id: 'a4', nome: 'Campo Estivo', data: '15/07/2024', pagamento: true }
      ],
      presences: saved.presences || [
        { esploratoreId: 's1', attivitaId: 'a1', stato: 'Presente', pagato: true, tipoPagamento: 'Contanti' },
        { esploratoreId: 's2', attivitaId: 'a1', stato: 'Presente', pagato: false, tipoPagamento: null },
        { esploratoreId: 's3', attivitaId: 'a1', stato: 'NR', pagato: false, tipoPagamento: null },
        { esploratoreId: 's1', attivitaId: 'a2', stato: 'Presente', pagato: false, tipoPagamento: null },
        { esploratoreId: 's2', attivitaId: 'a2', stato: 'Assente', pagato: false, tipoPagamento: null },
        { esploratoreId: 's3', attivitaId: 'a2', stato: 'Presente', pagato: false, tipoPagamento: null },
        { esploratoreId: 's1', attivitaId: 'a3', stato: 'Presente', pagato: true, tipoPagamento: 'Bonifico' },
        { esploratoreId: 's2', attivitaId: 'a3', stato: 'Presente', pagato: true, tipoPagamento: 'Satispay' },
        { esploratoreId: 's3', attivitaId: 'a3', stato: 'Presente', pagato: true, tipoPagamento: 'Contanti' },
        { esploratoreId: 's1', attivitaId: 'a4', stato: 'Presente', pagato: true, tipoPagamento: 'Bonifico' },
        { esploratoreId: 's2', attivitaId: 'a4', stato: 'Presente', pagato: true, tipoPagamento: 'Satispay' },
        { esploratoreId: 's3', attivitaId: 'a4', stato: 'Assente', pagato: false, tipoPagamento: null }
      ],
    };
  }
  persist() { localStorage.setItem('presenziario-state', JSON.stringify(this.state)); }
  async loadAll() { return structuredClone(this.state); }
  // Staff
  async addStaff({ nome, cognome }) {
    const id = 'st' + (Math.random().toString(36).slice(2, 8));
    this.state.staff.push({ id, nome, cognome }); this.persist(); return id;
  }
  async updateStaff({ id, nome, cognome }) {
    const m = this.state.staff.find(s => s.id === id); if (m) { m.nome = nome; m.cognome = cognome; this.persist(); }
  }
  async deleteStaff(id) {
    this.state.staff = this.state.staff.filter(s => s.id !== id); this.persist();
  }
  // Scouts
  async addScout({ nome, cognome }) {
    const id = 's' + (Math.random().toString(36).slice(2, 8));
    this.state.scouts.push({ id, nome, cognome });
    this.state.activities.forEach(a => this.state.presences.push({ esploratoreId: id, attivitaId: a.id, stato: 'NR', pagato: false, tipoPagamento: null }));
    this.persist(); return id;
  }
  async updateScout({ id, nome, cognome }) {
    const s = this.state.scouts.find(x => x.id === id); if (s) { s.nome = nome; s.cognome = cognome; this.persist(); }
  }
  async deleteScout(id) {
    this.state.scouts = this.state.scouts.filter(s => s.id !== id);
    this.state.presences = this.state.presences.filter(p => p.esploratoreId !== id);
    this.persist();
  }
  // Presences
  async updatePresence({ field, value, scoutId, activityId }) {
    let p = this.state.presences.find(x => x.esploratoreId === scoutId && x.attivitaId === activityId);
    if (!p) { p = { esploratoreId: scoutId, attivitaId: activityId, stato: 'NR', pagato: false, tipoPagamento: null }; this.state.presences.push(p); }
    p[field] = value;
    if (field === 'pagato' && !value) p.tipoPagamento = null;
    this.persist();
  }
}

// FirestoreAdapter: fill firebaseConfig and use DATA.useFirestore()
class FirestoreAdapter {
  constructor() {
    // Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyAoa8Rrlplr001PitiFrqBkrbEWL3TWrL4",
      authDomain: "presenziariomaori.firebaseapp.com",
      projectId: "presenziariomaori",
      storageBucket: "presenziariomaori.firebasestorage.app",
      messagingSenderId: "556210165397",
      appId: "1:556210165397:web:4f434e78fb97f02d116d9c"
    };
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    this.cols = {
      scouts: collection(this.db, 'scouts'),
      staff: collection(this.db, 'staff'),
      activities: collection(this.db, 'activities'),
      presences: collection(this.db, 'presences'),
    };
  }
  async loadAll() {
    const [scoutsSnap, staffSnap, actsSnap, presSnap] = await Promise.all([
      getDocs(this.cols.scouts), getDocs(this.cols.staff), getDocs(this.cols.activities), getDocs(this.cols.presences)
    ]);
    const scouts = scoutsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const staff = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const activities = actsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const presences = presSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { scouts, staff, activities, presences };
  }
  async addStaff({ nome, cognome }) { const ref = await addDoc(this.cols.staff, { nome, cognome }); return ref.id; }
  async updateStaff({ id, nome, cognome }) { await setDoc(doc(this.db, 'staff', id), { nome, cognome }, { merge: true }); }
  async deleteStaff(id) { await deleteDoc(doc(this.db, 'staff', id)); }

  async addScout({ nome, cognome }) { const ref = await addDoc(this.cols.scouts, { nome, cognome }); return ref.id; }
  async updateScout({ id, nome, cognome }) { await setDoc(doc(this.db, 'scouts', id), { nome, cognome }, { merge: true }); }
  async deleteScout(id) {
    await deleteDoc(doc(this.db, 'scouts', id));
    // Optional: delete presences for this scout (requires index or batch)
    // Firestore does not support server-side cascade; you may loop query results and delete.
  }

  async updatePresence({ field, value, scoutId, activityId }) {
    // presenceId = `${scoutId}_${activityId}` (deterministic)
    const presenceId = `${scoutId}_${activityId}`;
    await setDoc(doc(this.db, 'presences', presenceId), {
      esploratoreId: scoutId, attivitaId: activityId, [field]: value
    }, { merge: true });
  }
}

// Data Facade
const DATA = {
  adapter: new LocalAdapter(),
  useFirestore() { this.adapter = new FirestoreAdapter(); },
  async loadAll() { return await this.adapter.loadAll(); },
  async addStaff(p) { return await this.adapter.addStaff(p); },
  async updateStaff(p) { return await this.adapter.updateStaff(p); },
  async deleteStaff(id) { return await this.adapter.deleteStaff(id); },
  async addScout(p) { return await this.adapter.addScout(p); },
  async updateScout(p) { return await this.adapter.updateScout(p); },
  async deleteScout(id) { return await this.adapter.deleteScout(id); },
  async updatePresence(p) { return await this.adapter.updatePresence(p); },
};

// ============== UI Layer ==============
const UI = {
  selectedStaffId: null,
  staffToDeleteId: null,
  scoutToDeleteId: null,
  state: { scouts: [], staff: [], activities: [], presences: [] },

  qs(id) { return document.getElementById(id); },
  showModal(id){ this.qs(id).classList.add('show'); },
  closeModal(id){ this.qs(id).classList.remove('show'); },

  async init() {
    // Toggle Firestore by enabling the next line after adding firebaseConfig:
    DATA.useFirestore();

    // Load state
    this.state = await DATA.loadAll();
    // Sort activities by date once
    this.state.activities.sort((a, b) => {
      const [d1, m1, y1] = a.data.split('/'); const [d2, m2, y2] = b.data.split('/');
      return new Date(`${y1}-${m1}-${d1}`) - new Date(`${y2}-${m2}-${d2}`);
    });

    // Tabs
    this.setupTabs();

    // Initial renders
    this.renderScouts();
    this.renderStaff();
    this.renderPresenceTable();

    // Listeners
    document.querySelector('.hamburger-icon').addEventListener('click', () => {
      document.querySelector('.nav-links').classList.toggle('active');
    });

    // Forms
    this.qs('addScoutForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = this.qs('scoutNome').value.trim();
      const cognome = this.qs('scoutCognome').value.trim();
      if (!nome || !cognome) return;
      await DATA.addScout({ nome, cognome });
      this.state = await DATA.loadAll();
      this.renderScouts(); this.renderPresenceTable(); e.target.reset();
    });

    this.qs('addStaffForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = this.qs('staffNome').value.trim();
      const cognome = this.qs('staffCognome').value.trim();
      if (!nome || !cognome) return;
      await DATA.addStaff({ nome, cognome });
      this.state = await DATA.loadAll();
      this.renderStaff(); e.target.reset();
    });

    this.qs('editStaffForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = this.qs('editStaffId').value;
      const nome = this.qs('editStaffNome').value.trim();
      const cognome = this.qs('editStaffCognome').value.trim();
      await DATA.updateStaff({ id, nome, cognome });
      this.closeModal('editStaffModal');
      this.state = await DATA.loadAll(); this.renderStaff();
    });

    this.qs('editScoutForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = this.qs('editScoutId').value;
      const nome = this.qs('editScoutNome').value.trim();
      const cognome = this.qs('editScoutCognome').value.trim();
      await DATA.updateScout({ id, nome, cognome });
      this.closeModal('editScoutModal');
      this.state = await DATA.loadAll(); this.renderScouts(); this.renderPresenceTable();
    });

    this.qs('confirmDeleteStaffButton').addEventListener('click', async () => {
      if (!this.staffToDeleteId) return;
      await DATA.deleteStaff(this.staffToDeleteId);
      this.staffToDeleteId = null;
      this.closeModal('confirmDeleteStaffModal');
      this.state = await DATA.loadAll(); this.renderStaff();
      if (!this.state.staff.find(s => s.id === this.selectedStaffId)) {
        this.selectedStaffId = null; document.getElementById('selectedStaffName').textContent = 'Nessuno';
        this.renderPresenceTable();
      }
    });

    this.qs('confirmDeleteScoutButton').addEventListener('click', async () => {
      if (!this.scoutToDeleteId) return;
      await DATA.deleteScout(this.scoutToDeleteId);
      this.scoutToDeleteId = null;
      this.closeModal('confirmDeleteScoutModal');
      this.state = await DATA.loadAll(); this.renderScouts(); this.renderPresenceTable(); this.renderDashboard();
    });

    // Dashboard on demand
    this.qs('dashboardTabBtn').addEventListener('click', () => this.renderDashboard());

    // Show staff selection upfront
    this.showModal('staffSelectionModal');

    // Export globally helpers used in HTML onclick
    window.UI = UI;
  },

  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const setActive = (btnId) => {
      tabButtons.forEach(b => b.classList.remove('bg-green-600'));
      tabContents.forEach(c => c.classList.remove('active'));
      document.getElementById(btnId).classList.add('bg-green-600');
      document.getElementById(btnId.replace('Btn', '')).classList.add('active');
      document.querySelector('.nav-links').classList.remove('active');
    };
    // default
    setActive('presenzeTabBtn');
    tabButtons.forEach(btn => btn.addEventListener('click', () => setActive(btn.id)));
  },

  // ---- Rendering ----
  renderStaff() {
    const list = this.qs('staffList'); const selectList = this.qs('staffListForSelection');
    list.innerHTML = ''; selectList.innerHTML = '';
    if (!this.state.staff.length) list.innerHTML = '<p class="text-gray-500">Nessun membro staff.</p>';

    this.state.staff.forEach(member => {
      list.insertAdjacentHTML('beforeend', `
        <div class="p-4 bg-white rounded-lg shadow-sm flex items-center justify-between">
          <p class="font-medium text-lg">${member.nome} ${member.cognome}</p>
          <div class="flex gap-2">
            <button aria-label="Modifica staff" class="p-2 text-gray-500 hover:text-green-600 rounded-full" onclick="UI.openEditStaffModal('${member.id}')">
              ✏️
            </button>
            <button aria-label="Elimina staff" class="p-2 text-gray-500 hover:text-red-600 rounded-full" onclick="UI.confirmDeleteStaff('${member.id}')">
              🗑️
            </button>
          </div>
        </div>
      `);
      selectList.insertAdjacentHTML('beforeend', `
        <button class="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg" onclick="UI.selectStaff('${member.id}')">
          <span class="font-semibold text-green-700">${member.nome} ${member.cognome}</span>
        </button>
      `);
    });
  },
  async selectStaff(id) {
    this.selectedStaffId = id;
    const m = this.state.staff.find(s => s.id === id);
    document.getElementById('selectedStaffName').textContent = m ? `${m.nome} ${m.cognome}` : 'Nessuno';
    this.closeModal('staffSelectionModal');
    this.renderPresenceTable();
  },
  openEditStaffModal(id) {
    const m = this.state.staff.find(s => s.id === id); if (!m) return;
    this.qs('editStaffId').value = m.id;
    this.qs('editStaffNome').value = m.nome;
    this.qs('editStaffCognome').value = m.cognome;
    this.showModal('editStaffModal');
  },
  confirmDeleteStaff(id) {
    const m = this.state.staff.find(s => s.id === id); if (!m) return;
    this.staffToDeleteId = id;
    this.qs('staffNameToDelete').textContent = `${m.nome} ${m.cognome}`;
    this.showModal('confirmDeleteStaffModal');
  },

  renderScouts() {
    const list = this.qs('scoutsList'); list.innerHTML = '';
    this.state.scouts.forEach(s => {
      list.insertAdjacentHTML('beforeend', `
        <div class="p-4 bg-white rounded-lg shadow-sm flex items-center justify-between">
          <p class="font-medium text-lg">${s.nome} ${s.cognome}</p>
          <div class="flex gap-2">
            <button aria-label="Modifica esploratore" class="p-2 text-gray-500 hover:text-green-600 rounded-full" onclick="UI.openEditScoutModal('${s.id}')">✏️</button>
            <button aria-label="Elimina esploratore" class="p-2 text-gray-500 hover:text-red-600 rounded-full" onclick="UI.confirmDeleteScout('${s.id}')">🗑️</button>
          </div>
        </div>
      `);
    });
  },
  openEditScoutModal(id) {
    const s = this.state.scouts.find(x => x.id === id); if (!s) return;
    this.qs('editScoutId').value = s.id;
    this.qs('editScoutNome').value = s.nome;
    this.qs('editScoutCognome').value = s.cognome;
    this.showModal('editScoutModal');
  },
  confirmDeleteScout(id) {
    const s = this.state.scouts.find(x => x.id === id); if (!s) return;
    this.scoutToDeleteId = id;
    this.qs('scoutNameToDelete').textContent = `${s.nome} ${s.cognome}`;
    this.showModal('confirmDeleteScoutModal');
  },

  async updatePresenceCell({ field, value, scoutId, activityId }) {
    if (!this.selectedStaffId) return; // disabled without staff
    await DATA.updatePresence({ field, value, scoutId, activityId });
    this.state = await DATA.loadAll();
    // re-render only affected parts for simplicity -> full table for robustness
    this.renderPresenceTable(); this.renderDashboard();
  },

  renderPresenceTable() {
    const body = this.qs('presenceTableBody');
    const thDates = this.qs('tableHeaderDates');
    const thNames = this.qs('tableHeaderNames');
    body.innerHTML = ''; thDates.innerHTML = '<th rowspan="2" class="sticky left-0 !bg-green-700 !text-white !p-4 text-left">Esploratore</th>'; thNames.innerHTML='';

    // headers
    this.state.activities.forEach(a => {
      thDates.insertAdjacentHTML('beforeend', `<th class="p-2 border-b-2 border-gray-200 bg-green-600 text-white font-semibold sticky top-0">${a.data}</th>`);
      thNames.insertAdjacentHTML('beforeend', `<th class="p-2 border-b-2 border-gray-200 bg-green-500 text-white font-semibold sticky top-0">${a.nome}</th>`);
    });

    // rows
    this.state.scouts.forEach(s => {
      let row = `<tr><td class="p-4 border-r-2 border-gray-200 bg-gray-50 font-semibold text-left sticky left-0">${s.nome} ${s.cognome}</td>`;
      this.state.activities.forEach(a => {
        const presence = this.state.presences.find(p => p.esploratoreId === s.id && p.attivitaId === a.id) || { stato:'NR', pagato:false, tipoPagamento:null };
        const disabled = this.selectedStaffId ? '' : 'disabled';
        const paidDisabled = (!presence.pagato || !this.selectedStaffId) ? 'disabled' : '';

        row += `<td class="p-2 border-r border-b border-gray-200">
          <div class="flex flex-col items-center gap-1">
            <select class="presence-select" ${disabled} onchange="UI.updatePresenceCell({field:'stato', value:this.value, scoutId:'${s.id}', activityId:'${a.id}'})">
              <option value="Presente" ${presence.stato==='Presente'?'selected':''}>P</option>
              <option value="Assente" ${presence.stato==='Assente'?'selected':''}>A</option>
              <option value="NR" ${presence.stato==='NR'?'selected':''}>NR</option>
            </select>
            ${a.pagamento ? `
            <div class="payment-section">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" ${presence.pagato?'checked':''} ${disabled}
                  onchange="UI.updatePresenceCell({field:'pagato', value:this.checked, scoutId:'${s.id}', activityId:'${a.id}'})" />
                <span>Pagato</span>
              </label>
              <select class="payment-select mt-1" ${paidDisabled}
                onchange="UI.updatePresenceCell({field:'tipoPagamento', value:this.value, scoutId:'${s.id}', activityId:'${a.id}'})">
                <option value="" ${!presence.tipoPagamento?'selected':''}>- Tipo -</option>
                <option value="Contanti" ${presence.tipoPagamento==='Contanti'?'selected':''}>Contanti</option>
                <option value="Bonifico" ${presence.tipoPagamento==='Bonifico'?'selected':''}>Bonifico</option>
                <option value="Satispay" ${presence.tipoPagamento==='Satispay'?'selected':''}>Satispay</option>
              </select>
            </div>` : ''}
          </div>
        </td>`;
      });
      row += `</tr>`;
      body.insertAdjacentHTML('beforeend', row);
    });
  },

  // ---- Dashboard ----
  charts: { scout:null, activity:null },
  renderDashboard() {
    const { scouts, activities, presences } = this.state;
    // destroy previous
    if (this.charts.scout) { this.charts.scout.destroy(); this.charts.scout = null; }
    if (this.charts.activity) { this.charts.activity.destroy(); this.charts.activity = null; }
    Chart.register(ChartDataLabels);

    const scoutLabels = scouts.map(s => `${s.nome} ${s.cognome}`);
    const scoutPerc = scouts.map(s => {
      const count = presences.filter(p => p.esploratoreId === s.id && p.stato === 'Presente').length;
      return activities.length ? (count/activities.length)*100 : 0;
    });
    const ctx1 = document.getElementById('scoutPresenceChart').getContext('2d');
    this.charts.scout = new Chart(ctx1, {
      type: 'bar',
      data: { labels: scoutLabels, datasets: [{ label: 'Presenza %', data: scoutPerc }]},
      options: {
        indexAxis: 'y', responsive: true,
        scales: { x: { beginAtZero: true, max: 100, ticks: { callback:v => v+'%' } } },
        plugins: { legend: { display:false }, datalabels: { color:'#fff', formatter:v=> v>0? v.toFixed(1)+'%':'', anchor:'end', align:'end', offset:-5, font:{weight:'bold'}}}
      }
    });

    const actLabels = activities.map(a => `${a.nome}\n${a.data}`);
    const actData = activities.map(a => presences.filter(p => p.attivitaId === a.id && p.stato === 'Presente').length);
    const ctx2 = document.getElementById('activityPresenceChart').getContext('2d');
    this.charts.activity = new Chart(ctx2, {
      type: 'bar',
      data: { labels: actLabels, datasets: [{ label: 'Presenze', data: actData }]},
      options: {
        indexAxis: 'y', responsive: true,
        scales: { x: { beginAtZero: true, max: scouts.length + 1 } },
        plugins: { legend: { display:false }, datalabels: { color:'#fff', formatter:(v)=> v>0? `${v} / ${scouts.length}`:'', anchor:'end', align:'end', offset:-5, font:{weight:'bold'}}}
      }
    });
  },
};

// Kickoff
document.addEventListener('DOMContentLoaded', () => UI.init());

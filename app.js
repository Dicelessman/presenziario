// app.js (ES Module)
// --- Firebase (optional) ---
// If you want Firestore, fill firebaseConfig and set DATA.useFirestore() below.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, addDoc, setDoc, deleteDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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
        { id: 'a1', tipo: 'Uscita', data: new Date('2024-08-18'), descrizione: 'Uscita al lago', costo: '10' },
        { id: 'a2', tipo: 'Riunione', data: new Date('2024-08-25'), descrizione: 'Riunione settimanale', costo: '0' },
        { id: 'a3', tipo: 'Attività lunga', data: new Date('2024-09-01'), descrizione: 'Escursione in montagna', costo: '5' },
        { id: 'a4', tipo: 'Campo', data: new Date('2024-07-15'), descrizione: 'Campo Estivo', costo: '150' }
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
  // Activities
  async addActivity({ tipo, data, descrizione, costo }, currentUser) {
    const id = 'a' + (Math.random().toString(36).slice(2, 8));
    this.state.activities.push({ id, tipo, data, descrizione, costo });
    // pre-popola presenze per nuovi eventi
    this.state.scouts.forEach(s => this.state.presences.push({
      esploratoreId: s.id, attivitaId: id, stato: 'NR', pagato: false, tipoPagamento: null
    }));
    this.persist();
    console.log('LocalAdapter: addActivity', { tipo, data, descrizione, costo, id, currentUser: currentUser?.email });
    return id;
  }
  async updateActivity({ id, tipo, data, descrizione, costo }, currentUser) {
    const a = this.state.activities.find(x => x.id === id);
    if (a) { a.tipo = tipo; a.data = data; a.descrizione = descrizione; a.costo = costo; this.persist(); }
    console.log('LocalAdapter: updateActivity', { id, tipo, data, descrizione, costo, currentUser: currentUser?.email });
  }
  async deleteActivity(id, currentUser) {
    this.state.activities = this.state.activities.filter(a => a.id !== id);
    this.state.presences = this.state.presences.filter(p => p.attivitaId !== id);
    this.persist();
    console.log('LocalAdapter: deleteActivity', { id, currentUser: currentUser?.email });
  }
  // Staff
  async addStaff({ nome, cognome }, currentUser) {
    const id = 'st' + (Math.random().toString(36).slice(2, 8));
    this.state.staff.push({ id, nome, cognome }); this.persist(); return id;
    console.log('LocalAdapter: addStaff', { nome, cognome, id, currentUser: currentUser?.email });
  }
  async updateStaff({ id, nome, cognome }, currentUser) {
    const m = this.state.staff.find(s => s.id === id); if (m) { m.nome = nome; m.cognome = cognome; this.persist(); }
    console.log('LocalAdapter: updateStaff', { id, nome, cognome, currentUser: currentUser?.email });
  }
  async deleteStaff(id, currentUser) {
    this.state.staff = this.state.staff.filter(s => s.id !== id); this.persist();
    console.log('LocalAdapter: deleteStaff', { id, currentUser: currentUser?.email });
  }
  // Scouts
  async addScout({ nome, cognome }, currentUser) {
    const id = 's' + (Math.random().toString(36).slice(2, 8));
    this.state.scouts.push({ id, nome, cognome });
    this.state.activities.forEach(a => this.state.presences.push({ esploratoreId: id, attivitaId: a.id, stato: 'NR', pagato: false, tipoPagamento: null }));
    this.persist(); return id;
    console.log('LocalAdapter: addScout', { nome, cognome, id, currentUser: currentUser?.email });
  }
  async updateScout({ id, nome, cognome }, currentUser) {
    const s = this.state.scouts.find(x => x.id === id); if (s) { s.nome = nome; s.cognome = cognome; this.persist(); }
    console.log('LocalAdapter: updateScout', { id, nome, cognome, currentUser: currentUser?.email });
  }
  async deleteScout(id, currentUser) {
    this.state.scouts = this.state.scouts.filter(s => s.id !== id);
    this.state.presences = this.state.presences.filter(p => p.esploratoreId !== id);
    this.persist();
    console.log('LocalAdapter: deleteScout', { id, currentUser: currentUser?.email });
  }
  // Presences
  async updatePresence({ field, value, scoutId, activityId }, currentUser) {
    let p = this.state.presences.find(x => x.esploratoreId === scoutId && x.attivitaId === activityId);
    if (!p) { p = { esploratoreId: scoutId, attivitaId: activityId, stato: 'NR', pagato: false, tipoPagamento: null }; this.state.presences.push(p); }
    p[field] = value;
    if (field === 'pagato' && !value) p.tipoPagamento = null;
    this.persist();
    console.log('LocalAdapter: updatePresence', { field, value, scoutId, activityId, currentUser: currentUser?.email });
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
      auditLogs: collection(this.db, 'auditLogs'),
    };
    this.auth = getAuth(this.app);
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

  async addAuditLog(action, entityType, entityId, details, userId, userEmail) {
    if (!userId) { console.warn('Attempted to log audit event without userId.', { action, entityType, entityId }); return; }
    try {
      await addDoc(this.cols.auditLogs, {
        timestamp: new Date(),
        action,
        entityType,
        entityId,
        details,
        userId,
        userEmail,
      });
    } catch (error) {
      console.error('Error writing audit log:', error);
    }
  }

  async addActivity({ tipo, data, descrizione, costo }, currentUser) {
    const ref = await addDoc(this.cols.activities, { tipo, data, descrizione, costo });
    if (currentUser) { await this.addAuditLog('add', 'activity', ref.id, { tipo, data, descrizione, costo }, currentUser.uid, currentUser.email); }
    return ref.id;
  }
  async updateActivity({ id, tipo, data, descrizione, costo }, currentUser) {
    await setDoc(doc(this.db, 'activities', id), { tipo, data, descrizione, costo }, { merge: true });
    if (currentUser) { await this.addAuditLog('update', 'activity', id, { tipo, data, descrizione, costo }, currentUser.uid, currentUser.email); }
  }
  async deleteActivity(id, currentUser) {
    await deleteDoc(doc(this.db, 'activities', id));
    if (currentUser) { await this.addAuditLog('delete', 'activity', id, {}, currentUser.uid, currentUser.email); }
  }
  async addStaff({ nome, cognome }, currentUser) {
    const ref = await addDoc(this.cols.staff, { nome, cognome });
    if (currentUser) { await this.addAuditLog('add', 'staff', ref.id, { nome, cognome }, currentUser.uid, currentUser.email); }
    return ref.id;
  }
  async updateStaff({ id, nome, cognome }, currentUser) {
    await setDoc(doc(this.db, 'staff', id), { nome, cognome }, { merge: true });
    if (currentUser) { await this.addAuditLog('update', 'staff', id, { nome, cognome }, currentUser.uid, currentUser.email); }
  }
  async deleteStaff(id, currentUser) {
    await deleteDoc(doc(this.db, 'staff', id));
    if (currentUser) { await this.addAuditLog('delete', 'staff', id, {}, currentUser.uid, currentUser.email); }
  }

  async addScout({ nome, cognome }, currentUser) {
    const ref = await addDoc(this.cols.scouts, { nome, cognome });
    if (currentUser) { await this.addAuditLog('add', 'scout', ref.id, { nome, cognome }, currentUser.uid, currentUser.email); }
    return ref.id;
  }
  async updateScout({ id, nome, cognome }, currentUser) {
    await setDoc(doc(this.db, 'scouts', id), { nome, cognome }, { merge: true });
    if (currentUser) { await this.addAuditLog('update', 'scout', id, { nome, cognome }, currentUser.uid, currentUser.email); }
  }
  async deleteScout(id, currentUser) {
    await deleteDoc(doc(this.db, 'scouts', id));
    if (currentUser) { await this.addAuditLog('delete', 'scout', id, {}, currentUser.uid, currentUser.email); }
    // Optional: delete presences for this scout (requires index or batch)
    // Firestore does not support server-side cascade; you may loop query results and delete.
  }

  async updatePresence({ field, value, scoutId, activityId }, currentUser) {
    // presenceId = `${scoutId}_${activityId}` (deterministic)
    const presenceId = `${scoutId}_${activityId}`;
    // Get existing presence data to log before change if it exists
    const existingPresenceDoc = await getDoc(doc(this.db, 'presences', presenceId));
    const oldValue = existingPresenceDoc.exists() ? existingPresenceDoc.data()[field] : undefined;

    await setDoc(doc(this.db, 'presences', presenceId), {
      esploratoreId: scoutId, attivitaId: activityId, [field]: value
    }, { merge: true });

    if (currentUser) {
      await this.addAuditLog(
        'update', 'presence', presenceId,
        { field, oldValue, newValue: value, scoutId, activityId },
        currentUser.uid, currentUser.email
      );
    }
  }
}

// Data Facade
const DATA = {
  adapter: new LocalAdapter(),
  useFirestore() { this.adapter = new FirestoreAdapter(); },
  async loadAll() { return await this.adapter.loadAll(); },
  async addActivity(p, currentUser) { return await this.adapter.addActivity(p, currentUser); },
  async updateActivity(p, currentUser) { return await this.adapter.updateActivity(p, currentUser); },
  async deleteActivity(id, currentUser) { return await this.adapter.deleteActivity(id, currentUser); },
  async addStaff(p, currentUser) { return await this.adapter.addStaff(p, currentUser); },
  async updateStaff(p, currentUser) { return await this.adapter.updateStaff(p, currentUser); },
  async deleteStaff(id, currentUser) { return await this.adapter.deleteStaff(id, currentUser); },
  async addScout(p, currentUser) { return await this.adapter.addScout(p, currentUser); },
  async updateScout(p, currentUser) { return await this.adapter.updateScout(p, currentUser); },
  async deleteScout(id, currentUser) { return await this.adapter.deleteScout(id, currentUser); },
  async updatePresence(p, currentUser) { return await this.adapter.updatePresence(p, currentUser); },
};

// ============== UI Layer ==============
const UI = {
  selectedStaffId: null,
  staffToDeleteId: null,
  scoutToDeleteId: null,
  activityToDeleteId: null,
  state: { scouts: [], staff: [], activities: [], presences: [] },
  currentUser: null, // Aggiunto per tenere traccia dell'utente loggato

  qs(id) { return document.getElementById(id); },
  showModal(id){ this.qs(id).classList.add('show'); },
  closeModal(id){ this.qs(id).classList.remove('show'); },

  // ===== Helpers Date =====
  // Converte Date, Firestore Timestamp o stringhe legacy in Date JS
  toJsDate(value) {
    if (value instanceof Date) return value;
    if (value && typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed)) return parsed;
      const parts = value.split('/');
      if (parts.length === 3) {
        const [d, m, y] = parts;
        const dt = new Date(`${y}-${m}-${d}`);
        if (!isNaN(dt)) return dt;
      }
    }
    return new Date(value);
  },
  formatDisplayDate(value) {
    const d = this.toJsDate(value);
    return isNaN(d) ? '' : d.toLocaleDateString('it-IT');
  },
  normalizeActivitiesDates() {
    this.state.activities = (this.state.activities || []).map(a => ({ ...a, data: this.toJsDate(a.data) }));
  },
  sortActivities() {
    this.state.activities.sort((a, b) => this.toJsDate(a.data) - this.toJsDate(b.data));
  },

  // ===== Indice Presenze (deduplicato per esploratoreId + attivitaId) =====
  _presenceIndex: null,
  _presenceRank(stato) { return stato === 'Presente' ? 2 : (stato === 'Assente' ? 1 : 0); },
  rebuildPresenceIndex() {
    const map = new Map();
    const validActivityIds = new Set((this.state.activities || []).map(a => a.id));
    for (const p of (this.state.presences || [])) {
      if (!validActivityIds.has(p.attivitaId)) continue; // ignora presenze di attività eliminate
      const key = `${p.esploratoreId}_${p.attivitaId}`;
      const existing = map.get(key);
      if (!existing) { map.set(key, p); continue; }
      const exRank = this._presenceRank(existing.stato);
      const pRank = this._presenceRank(p.stato);
      if (pRank > exRank) { map.set(key, p); continue; }
      if (pRank === exRank) {
        if ((p.pagato ? 1 : 0) > (existing.pagato ? 1 : 0)) { map.set(key, p); continue; }
        // tie-breaker: prefer the newer reference
        map.set(key, p);
      }
    }
    this._presenceIndex = map;
  },
  getPresence(scoutId, activityId) {
    if (!this._presenceIndex) this.rebuildPresenceIndex();
    return this._presenceIndex.get(`${scoutId}_${activityId}`) || null;
  },
  getDedupedPresences() {
    if (!this._presenceIndex) this.rebuildPresenceIndex();
    return Array.from(this._presenceIndex.values());
  },

  async init() {
    try {
      // Toggle Firestore by enabling the next line after adding firebaseConfig:
      DATA.useFirestore();

      // Inizializza Firebase Auth
      onAuthStateChanged(DATA.adapter.auth, async (user) => {
        this.currentUser = user;
        if (user) {
          // Utente loggato
          console.log("Utente loggato:", user.email);
          this.closeModal('loginModal');
          // Carica lo stato solo dopo il login
          await this.loadAndRenderAll();
          // Imposta il nome dello staff se esiste un membro staff con questa email
          const loggedInStaff = this.state.staff.find(s => s.email === user.email);
          if (loggedInStaff) {
            this.enableEditing();
            this.selectStaff(loggedInStaff.id);
          } else {
            // Se l'utente non è un membro staff, disabilita modifiche
            document.getElementById('selectedStaffName').textContent = `Non Staff (${user.email})`;
            this.disableEditing();
          }
          // Mostra il bottone di logout
          this.qs('logoutButton').style.display = 'block';
        } else {
          // Utente non loggato
          console.log("Nessun utente loggato.");
          this.showModal('loginModal');
          this.selectedStaffId = null;
          document.getElementById('selectedStaffName').textContent = 'Nessuno';
          this.state = { scouts: [], staff: [], activities: [], presences: [] }; // Pulisci lo stato
          this.renderScouts(); this.renderStaff(); this.renderPresenceTable(); this.renderCalendar(); this.renderDashboard();
          this.disableEditing();
          // Nascondi il bottone di logout
          this.qs('logoutButton').style.display = 'none';
        }
      });

    // Forms
    this.qs('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = this.qs('loginEmail').value.trim();
      const password = this.qs('loginPassword').value.trim();
      const loginError = this.qs('loginError');
      loginError.textContent = '';
      try {
        await signInWithEmailAndPassword(DATA.adapter.auth, email, password);
        // L'onAuthStateChanged gestirà l'aggiornamento dell'UI
      } catch (error) {
        console.error("Errore login:", error);
        loginError.textContent = 'Email o password non validi.';
      }
    });

    this.qs('logoutButton').addEventListener('click', async () => {
      try {
        await signOut(DATA.adapter.auth);
        // L'onAuthStateChanged gestirà l'aggiornamento dell'UI
      } catch (error) {
        console.error("Errore logout:", error);
        alert('Errore durante il logout. Controlla la console per i dettagli.');
      }
    });

    this.qs('addScoutForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentUser) { alert('Devi essere loggato per aggiungere esploratori.'); return; }
      const nome = this.qs('scoutNome').value.trim();
      const cognome = this.qs('scoutCognome').value.trim();
      if (!nome || !cognome) return;
      await DATA.addScout({ nome, cognome }, this.currentUser);
      this.state = await DATA.loadAll();
      this.renderScouts(); this.renderPresenceTable(); e.target.reset();
    });

    this.qs('addStaffForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentUser) { alert('Devi essere loggato per aggiungere staff.'); return; }
      const nome = this.qs('staffNome').value.trim();
      const cognome = this.qs('staffCognome').value.trim();
      if (!nome || !cognome) return;
      await DATA.addStaff({ nome, cognome }, this.currentUser);
      this.state = await DATA.loadAll();
      this.renderStaff(); e.target.reset();
    });

    const addActivityForm = this.qs('addActivityForm');
    if (addActivityForm) {
      addActivityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!this.currentUser) { alert('Devi essere loggato per aggiungere attività.'); return; }
        const tipo = this.qs('activityTipo').value;
        const data = new Date(this.qs('activityData').value);
        const descrizione = this.qs('activityDescrizione').value.trim();
        const costo = this.qs('activityCosto').value.trim() || '0';
        if (!tipo || !data || !descrizione) return;
        await DATA.addActivity({ tipo, data, descrizione, costo }, this.currentUser);
        this.state = await DATA.loadAll();
        this.normalizeActivitiesDates();
        this.sortActivities();
        this.rebuildPresenceIndex();
        this.renderPresenceTable();
        this.renderCalendar && this.renderCalendar();
        this.renderDashboard();
        e.target.reset();
      });
    }

    const editActivityForm = this.qs('editActivityForm');
    if (editActivityForm) {
      editActivityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!this.currentUser) { alert('Devi essere loggato per modificare attività.'); return; }
        const id = this.qs('editActivityId').value;
        const tipo = this.qs('editActivityTipo').value;
        const data = new Date(this.qs('editActivityData').value);
        const descrizione = this.qs('editActivityDescrizione').value.trim();
        const costo = this.qs('editActivityCosto').value.trim() || '0';
        if (!id || !tipo || !data || !descrizione) return;
        await DATA.updateActivity({ id, tipo, data, descrizione, costo }, this.currentUser);
        this.closeModal('editActivityModal');
        this.state = await DATA.loadAll();
        this.normalizeActivitiesDates();
        this.sortActivities();
        this.rebuildPresenceIndex();
        this.renderPresenceTable(); this.renderCalendar(); this.renderDashboard();
      });
    }

    const confirmDeleteActivityButton = this.qs('confirmDeleteActivityButton');
    if (confirmDeleteActivityButton) {
      confirmDeleteActivityButton.addEventListener('click', async () => {
        if (!this.currentUser) { alert('Devi essere loggato per eliminare attività.'); return; }
        if (!this.activityToDeleteId) return;
        await DATA.deleteActivity(this.activityToDeleteId, this.currentUser);
        this.activityToDeleteId = null;
        this.closeModal('confirmDeleteActivityModal');
        this.state = await DATA.loadAll();
        this.normalizeActivitiesDates();
        this.sortActivities();
        this.rebuildPresenceIndex();
        this.renderPresenceTable(); this.renderCalendar(); this.renderDashboard();
      });
    }

    this.qs('editStaffForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentUser) { alert('Devi essere loggato per modificare staff.'); return; }
      const id = this.qs('editStaffId').value;
      const nome = this.qs('editStaffNome').value.trim();
      const cognome = this.qs('editStaffCognome').value.trim();
      await DATA.updateStaff({ id, nome, cognome }, this.currentUser);
      this.closeModal('editStaffModal');
      this.state = await DATA.loadAll(); this.rebuildPresenceIndex(); this.renderStaff();
    });

    this.qs('editScoutForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentUser) { alert('Devi essere loggato per modificare esploratori.'); return; }
      const id = this.qs('editScoutId').value;
      const nome = this.qs('editScoutNome').value.trim();
      const cognome = this.qs('editScoutCognome').value.trim();
      await DATA.updateScout({ id, nome, cognome }, this.currentUser);
      this.closeModal('editScoutModal');
      this.state = await DATA.loadAll(); this.rebuildPresenceIndex(); this.renderScouts(); this.renderPresenceTable();
    });

    this.qs('confirmDeleteStaffButton').addEventListener('click', async () => {
      if (!this.currentUser) { alert('Devi essere loggato per eliminare staff.'); return; }
      if (!this.staffToDeleteId) return;
      await DATA.deleteStaff(this.staffToDeleteId, this.currentUser);
      this.staffToDeleteId = null;
      this.closeModal('confirmDeleteStaffModal');
      this.state = await DATA.loadAll(); this.rebuildPresenceIndex(); this.renderStaff();
      if (!this.state.staff.find(s => s.id === this.selectedStaffId)) {
        this.selectedStaffId = null; document.getElementById('selectedStaffName').textContent = 'Nessuno';
        this.renderPresenceTable();
      }
    });

    this.qs('confirmDeleteScoutButton').addEventListener('click', async () => {
      if (!this.currentUser) { alert('Devi essere loggato per eliminare esploratori.'); return; }
      if (!this.scoutToDeleteId) return;
      await DATA.deleteScout(this.scoutToDeleteId, this.currentUser);
      this.scoutToDeleteId = null;
      this.closeModal('confirmDeleteScoutModal');
      this.state = await DATA.loadAll(); this.rebuildPresenceIndex(); this.renderScouts(); this.renderPresenceTable(); this.renderDashboard();
    });

    // Dashboard on demand
    this.qs('dashboardTabBtn').addEventListener('click', () => this.renderDashboard());

    // Show staff selection upfront - RIMOSSO, ora gestito da auth
    // this.showModal('staffSelectionModal');

    // Export globally helpers used in HTML onclick
    window.UI = UI;
    
    } catch (error) {
      console.error('Error during initialization:', error);
      alert('Errore durante l\'inizializzazione dell\'app. Controlla la console per i dettagli.');
    }
  },

  // Nuovo metodo per caricare e renderizzare tutto dopo il login
  async loadAndRenderAll() {
    this.state = await DATA.loadAll();
    console.log('Loaded state:', this.state);
    this.state = {
      scouts: this.state.scouts || [],
      staff: this.state.staff || [],
      activities: this.state.activities || [],
      presences: this.state.presences || []
    };
    this.normalizeActivitiesDates();
    this.sortActivities();
    this.rebuildPresenceIndex();
    this.setupTabs();
    this.renderScouts();
    this.renderStaff();
    this.renderPresenceTable();
    this.initMobilePresenceNav();
    this.renderCalendar();
    this.renderDashboard(); // Render dashboard on login as well
  },

  // Metodo per disabilitare/abilitare i campi di modifica
  disableEditing() {
    const forms = ['addScoutForm', 'addStaffForm', 'addActivityForm', 'editActivityForm', 'editStaffForm', 'editScoutForm'];
    forms.forEach(formId => {
      const form = this.qs(formId);
      if (form) {
        Array.from(form.elements).forEach(element => {
          if (element.tagName !== 'BUTTON') {
            element.setAttribute('disabled', 'true');
          } else if (element.type === 'submit') {
            element.setAttribute('disabled', 'true');
          }
        });
      }
    });
    // Disabilita i bottoni di modifica/eliminazione nelle liste
    // I bottoni e i selettori sono disabilitati tramite l'attributo 'disabled' nel markup al momento del rendering.
    document.getElementById('staff-info').style.display = 'none'; // Nascondi info staff
    document.getElementById('staffSelectionModal').classList.remove('show'); // Chiudi modale selezione staff
  },

  enableEditing() {
    const forms = ['addScoutForm', 'addStaffForm', 'addActivityForm', 'editActivityForm', 'editStaffForm', 'editScoutForm'];
    forms.forEach(formId => {
      const form = this.qs(formId);
      if (form) {
        Array.from(form.elements).forEach(element => {
          element.removeAttribute('disabled');
        });
      }
    });
    // I bottoni e i selettori sono abilitati tramite la rimozione dell'attributo 'disabled' nel markup al momento del rendering.
    document.getElementById('staff-info').style.display = 'block'; // Mostra info staff
    this.showModal('staffSelectionModal'); // Mostra modale selezione staff all'abilitazione
  },

  initMobilePresenceNav() {
    const picker = this.qs('mobileActivityPicker');
    const btnPrev = this.qs('mobileActivityPrev');
    const btnNext = this.qs('mobileActivityNext');
    const container = document.getElementById('presenceTableContainer');
    if (!picker || !btnPrev || !btnNext || !container) return;
    const isMobile = () => window.matchMedia('(max-width: 640px)').matches;

    const populate = () => {
      picker.innerHTML = '';
      const acts = this.getActivitiesSorted();
      acts.forEach((a, idx) => {
        const opt = document.createElement('option');
        opt.value = a.id;
        const displayDate = UI.formatDisplayDate(a.data);
        opt.textContent = `${displayDate} — ${a.tipo}`;
        opt.dataset.index = String(idx);
        picker.appendChild(opt);
      });
      picker.selectedIndex = 0;
    };

    const scrollToIndex = (index) => {
      const thDates = document.querySelectorAll('#tableHeaderDates th');
      const targetTh = thDates[index + 1];
      if (!targetTh) return;
      const rect = targetTh.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      const current = container.scrollLeft;
      const delta = (rect.left - contRect.left) + current - 16;
      container.scrollTo({ left: Math.max(0, delta), behavior: 'smooth' });
    };

    populate();
    picker.addEventListener('change', () => {
      const idx = picker.selectedIndex;
      if (idx >= 0) scrollToIndex(idx);
    });
    btnPrev.addEventListener('click', () => {
      if (!isMobile()) return;
      const idx = Math.max(0, picker.selectedIndex - 1);
      picker.selectedIndex = idx;
      scrollToIndex(idx);
    });
    btnNext.addEventListener('click', () => {
      if (!isMobile()) return;
      const idx = Math.min(this.state.activities.length - 1, picker.selectedIndex + 1);
      picker.selectedIndex = idx;
      scrollToIndex(idx);
    });

    this._scrollToSelectedActivity = () => {
      if (!isMobile()) return;
      const idx = picker.selectedIndex >= 0 ? picker.selectedIndex : 0;
      scrollToIndex(idx);
    };
  },

  getActivitiesSorted() {
    return [...this.state.activities].sort((a, b) => this.toJsDate(a.data) - this.toJsDate(b.data));
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
  renderCalendar() {
    const list = this.qs('calendarList');
    if (!list) return;
    list.innerHTML = '';
    if (!this.state.activities.length) {
      list.innerHTML = '<p class="text-gray-500">Nessuna attività pianificata.</p>';
      return;
    }

    // Ordina le attività per data
    const sortedActivities = [...this.state.activities].sort((a, b) => this.toJsDate(a.data) - this.toJsDate(b.data));

    // Trova la prossima attività (prima data futura o oggi)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nextActivityId = null;
    
    for (const a of sortedActivities) {
      const activityDate = this.toJsDate(a.data);
      if (activityDate >= today) {
        nextActivityId = a.id;
        break;
      }
    }

    sortedActivities.forEach(a => {
      const costoLabel = parseFloat(a.costo || '0') > 0 ? ` — Costo: € ${a.costo}` : '';
      const isNext = a.id === nextActivityId;
      const bgClass = isNext ? 'bg-green-50 border-l-4 border-green-500' : 'bg-white';
      const textClass = isNext ? 'text-green-800' : 'text-green-700';
      
      const displayDate = UI.formatDisplayDate(a.data);
      list.insertAdjacentHTML('beforeend', `
        <div class="p-4 ${bgClass} rounded-lg shadow-sm flex items-start justify-between gap-4">
          <div>
            <p class="font-medium text-lg ${textClass}">${a.tipo} — ${displayDate}${isNext ? ' (Prossima)' : ''}</p>
            <p class="text-gray-700">${a.descrizione}${costoLabel}</p>
          </div>
          <div class="flex gap-2">
            <button aria-label="Modifica attività" class="p-2 text-gray-500 hover:text-green-600 rounded-full" onclick="UI.openEditActivityModal('${a.id}')" ${this.currentUser ? '' : 'disabled'}>✏️</button>
            <button aria-label="Elimina attività" class="p-2 text-gray-500 hover:text-red-600 rounded-full" onclick="UI.confirmDeleteActivity('${a.id}')" ${this.currentUser ? '' : 'disabled'}>🗑️</button>
          </div>
        </div>
      `);
    });
  },

  openEditActivityModal(id) {
    if (!this.currentUser) { alert('Devi essere loggato per modificare attività.'); return; }
    const a = this.state.activities.find(x => x.id === id); if (!a) return;
    this.qs('editActivityId').value = a.id;
    this.qs('editActivityTipo').value = a.tipo;
    const editDate = UI.toJsDate(a.data).toISOString().split('T')[0];
    this.qs('editActivityData').value = editDate;
    this.qs('editActivityDescrizione').value = a.descrizione;
    this.qs('editActivityCosto').value = a.costo || '';
    this.showModal('editActivityModal');
  },
  confirmDeleteActivity(id) {
    if (!this.currentUser) { alert('Devi essere loggato per eliminare attività.'); return; }
    const a = this.state.activities.find(x => x.id === id); if (!a) return;
    this.activityToDeleteId = id;
    const displayDate = a.data instanceof Date ? a.data.toLocaleDateString('it-IT') : a.data;
    const info = `${a.tipo} — ${displayDate}${a.descrizione ? ' — ' + a.descrizione : ''}`;
    const el = this.qs('activityInfoToDelete'); if (el) el.textContent = info;
    this.showModal('confirmDeleteActivityModal');
  },
  renderStaff() {
    const list = this.qs('staffList'); const selectList = this.qs('staffListForSelection');
    list.innerHTML = ''; selectList.innerHTML = '';
    if (!this.state.staff.length) list.innerHTML = '<p class="text-gray-500">Nessun membro staff.</p>';

    this.state.staff.forEach(member => {
      list.insertAdjacentHTML('beforeend', `
        <div class="p-4 bg-white rounded-lg shadow-sm flex items-center justify-between">
          <p class="font-medium text-lg">${member.nome} ${member.cognome}</p>
          <div class="flex gap-2">
            <button aria-label="Modifica staff" class="p-2 text-gray-500 hover:text-green-600 rounded-full" onclick="UI.openEditStaffModal('${member.id}')" ${this.currentUser ? '' : 'disabled'}>
              ✏️
            </button>
            <button aria-label="Elimina staff" class="p-2 text-gray-500 hover:text-red-600 rounded-full" onclick="UI.confirmDeleteStaff('${member.id}')" ${this.currentUser ? '' : 'disabled'}>
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
    if (!this.currentUser) return; // Non permettere la selezione se non loggato
    this.selectedStaffId = id;
    const m = this.state.staff.find(s => s.id === id);
    document.getElementById('selectedStaffName').textContent = m ? `${m.nome} ${m.cognome}` : 'Nessuno';
    this.closeModal('staffSelectionModal');
    this.renderPresenceTable();
  },
  openEditStaffModal(id) {
    if (!this.currentUser) { alert('Devi essere loggato per modificare staff.'); return; }
    const m = this.state.staff.find(s => s.id === id); if (!m) return;
    this.qs('editStaffId').value = m.id;
    this.qs('editStaffNome').value = m.nome;
    this.qs('editStaffCognome').value = m.cognome;
    this.showModal('editStaffModal');
  },
  confirmDeleteStaff(id) {
    if (!this.currentUser) { alert('Devi essere loggato per eliminare staff.'); return; }
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
            <button aria-label="Modifica esploratore" class="p-2 text-gray-500 hover:text-green-600 rounded-full" onclick="UI.openEditScoutModal('${s.id}')" ${this.currentUser ? '' : 'disabled'}>✏️</button>
            <button aria-label="Elimina esploratore" class="p-2 text-gray-500 hover:text-red-600 rounded-full" onclick="UI.confirmDeleteScout('${s.id}')" ${this.currentUser ? '' : 'disabled'}>🗑️</button>
          </div>
        </div>
      `);
    });
  },
  openEditScoutModal(id) {
    if (!this.currentUser) { alert('Devi essere loggato per modificare esploratori.'); return; }
    const s = this.state.scouts.find(x => x.id === id); if (!s) return;
    this.qs('editScoutId').value = s.id;
    this.qs('editScoutNome').value = s.nome;
    this.qs('editScoutCognome').value = s.cognome;
    this.showModal('editScoutModal');
  },
  confirmDeleteScout(id) {
    if (!this.currentUser) { alert('Devi essere loggato per eliminare esploratori.'); return; }
    const s = this.state.scouts.find(x => x.id === id); if (!s) return;
    this.scoutToDeleteId = id;
    this.qs('scoutNameToDelete').textContent = `${s.nome} ${s.cognome}`;
    this.showModal('confirmDeleteScoutModal');
  },

  async updatePresenceCell({ field, value, scoutId, activityId }) {
    if (!this.currentUser) { alert('Devi essere loggato per modificare le presenze.'); return; }
    if (!this.selectedStaffId) return; // disabled without staff
    await DATA.updatePresence({ field, value, scoutId, activityId }, this.currentUser);
    this.state = await DATA.loadAll();
    // Normalizza attività e ricostruisci indice per coerenza
    this.normalizeActivitiesDates();
    this.sortActivities();
    this.rebuildPresenceIndex();
    this.renderPresenceTable();
    this.renderDashboard();
  },

  async updatePaymentCombined({ value, scoutId, activityId }) {
    if (!this.currentUser) { alert('Devi essere loggato per modificare i pagamenti.'); return; }
    if (!this.selectedStaffId) return;
    if (!value) {
      await DATA.updatePresence({ field: 'pagato', value: false, scoutId, activityId }, this.currentUser);
      await DATA.updatePresence({ field: 'tipoPagamento', value: null, scoutId, activityId }, this.currentUser);
    } else {
      await DATA.updatePresence({ field: 'pagato', value: true, scoutId, activityId }, this.currentUser);
      await DATA.updatePresence({ field: 'tipoPagamento', value, scoutId, activityId }, this.currentUser);
    }
    this.state = await DATA.loadAll();
    this.normalizeActivitiesDates();
    this.sortActivities();
    this.rebuildPresenceIndex();
    this.renderPresenceTable();
    this.renderDashboard();
  },

  renderPresenceTable() {
    const body = this.qs('presenceTableBody');
    const thDates = this.qs('tableHeaderDates');
    const thNames = this.qs('tableHeaderNames');
    body.innerHTML = ''; thDates.innerHTML = '<th rowspan="2" class="sticky left-0 !bg-green-700 !text-white !p-4 text-left">Esploratore</th>'; thNames.innerHTML='';

    // headers
    const totalScouts = this.state.scouts.length;
    const acts = this.getActivitiesSorted();
    acts.forEach(a => {
      const presentCount = this.getDedupedPresences().filter(p => p.attivitaId === a.id && p.stato === 'Presente').length;
      const perc = totalScouts ? Math.round((presentCount / totalScouts) * 100) : 0;
      const displayDate = UI.formatDisplayDate(a.data);
      thDates.insertAdjacentHTML('beforeend', `<th class="p-2 border-b-2 border-gray-200 bg-green-600 text-white font-semibold sticky top-0">${displayDate}</th>`);
      thNames.insertAdjacentHTML('beforeend', `<th class="p-2 border-b-2 border-gray-200 bg-green-500 text-white font-semibold sticky top-0">${a.tipo}<div class="text-xs font-normal text-white/90">${perc}% (${presentCount}/${totalScouts})</div></th>`);
    });

    // rows
    const sortedScouts = [...this.state.scouts].sort((a, b) => a.nome.localeCompare(b.nome) || a.cognome.localeCompare(b.cognome));
    sortedScouts.forEach(s => {
      const totalActs = this.state.activities.length;
      const presentCount = this.getDedupedPresences().filter(p => p.esploratoreId === s.id && p.stato === 'Presente').length;
      const perc = totalActs ? Math.round((presentCount / totalActs) * 100) : 0;
      let row = `<tr><td class="p-4 border-r-2 border-gray-200 bg-gray-50 font-semibold text-left sticky left-0">${s.nome} ${s.cognome}
        <div class="text-xs font-normal text-gray-500">${presentCount} / ${totalActs} (${perc}%)</div>
      </td>`;
      acts.forEach(a => {
        const presence = this.getPresence(s.id, a.id) || { stato:'NR', pagato:false, tipoPagamento:null };
        const disabled = (this.selectedStaffId && this.currentUser) ? '' : 'disabled'; // Modificato per considerare currentUser
        const needsPayment = parseFloat(a.costo || '0') > 0;

        row += `<td class="p-2 border-r border-b border-gray-200">
          <div class="flex flex-col items-center gap-1">
            <select class="presence-select" ${disabled} onchange="UI.updatePresenceCell({field:'stato', value:this.value, scoutId:'${s.id}', activityId:'${a.id}'})">
              <option value="Presente" ${presence.stato==='Presente'?'selected':''}>P</option>
              <option value="Assente" ${presence.stato==='Assente'?'selected':''}>A</option>
              <option value="NR" ${presence.stato==='NR'?'selected':''}>NR</option>
            </select>
            ${needsPayment ? `
            <div class="payment-section">
              <select class="payment-select mt-1" ${disabled}
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
    this._scrollToSelectedActivity && this._scrollToSelectedActivity();
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
    const dedup = this.getDedupedPresences();
    const scoutPerc = scouts.map(s => {
      const count = dedup.filter(p => p.esploratoreId === s.id && p.stato === 'Presente').length;
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

    const actLabels = activities.map(a => {
      const displayDate = UI.formatDisplayDate(a.data);
      return `${a.tipo}: ${a.descrizione}\n${displayDate}`;
    });
    const actData = activities.map(a => dedup.filter(p => p.attivitaId === a.id && p.stato === 'Presente').length);
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

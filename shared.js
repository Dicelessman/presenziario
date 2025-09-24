// shared.js - Codice condiviso tra tutte le pagine

// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, addDoc, setDoc, deleteDoc, onSnapshot, getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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
        { esploratoreId: 's2', attivitaId: 'a1', stato: 'Assente', pagato: false, tipoPagamento: null },
        { esploratoreId: 's3', attivitaId: 'a1', stato: 'Presente', pagato: true, tipoPagamento: 'Bonifico' }
      ]
    };
  }
  
  persist() {
    localStorage.setItem('presenziario-state', JSON.stringify(this.state));
  }
  
  async loadAll() {
    return this.state;
  }
  
  // Activities
  async addActivity({ tipo, data, descrizione, costo }, currentUser) {
    const id = 'a' + (Math.random().toString(36).slice(2, 8));
    this.state.activities.push({ id, tipo, data, descrizione, costo });
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
  async addStaff({ nome, cognome, email }, currentUser) {
    const id = 'st' + (Math.random().toString(36).slice(2, 8));
    this.state.staff.push({ id, nome, cognome, email }); 
    this.persist(); 
    return id;
    console.log('LocalAdapter: addStaff', { nome, cognome, email, id, currentUser: currentUser?.email });
  }
  
  async updateStaff({ id, nome, cognome, email }, currentUser) {
    const m = this.state.staff.find(s => s.id === id); 
    if (m) { m.nome = nome; m.cognome = cognome; m.email = email; this.persist(); }
    console.log('LocalAdapter: updateStaff', { id, nome, cognome, email, currentUser: currentUser?.email });
  }
  
  async deleteStaff(id, currentUser) {
    this.state.staff = this.state.staff.filter(s => s.id !== id); 
    this.persist();
    console.log('LocalAdapter: deleteStaff', { id, currentUser: currentUser?.email });
  }
  
  // Scouts
  async addScout({ nome, cognome }, currentUser) {
    const id = 's' + (Math.random().toString(36).slice(2, 8));
    this.state.scouts.push({ id, nome, cognome });
    this.state.activities.forEach(a => this.state.presences.push({ esploratoreId: id, attivitaId: a.id, stato: 'NR', pagato: false, tipoPagamento: null }));
    this.persist(); 
    return id;
    console.log('LocalAdapter: addScout', { nome, cognome, id, currentUser: currentUser?.email });
  }
  
  async updateScout({ id, nome, cognome }, currentUser) {
    const s = this.state.scouts.find(x => x.id === id);
    if (s) {
      // Unisci tutti i campi passati
      Object.assign(s, { nome, cognome });
      // Se sono stati passati altri campi nel payload originale, includili
      // Nota: la funzione è invocata con un oggetto già unito in DATA.updateScout
      for (const [k, v] of Object.entries(arguments[0] || {})) {
        if (k !== 'id') s[k] = v;
      }
      this.persist();
    }
    console.log('LocalAdapter: updateScout', { id, currentUser: currentUser?.email });
  }
  
  async deleteScout(id, currentUser) {
    this.state.scouts = this.state.scouts.filter(s => s.id !== id);
    this.state.presences = this.state.presences.filter(p => p.esploratoreId !== id);
    this.persist();
    console.log('LocalAdapter: deleteScout', { id, currentUser: currentUser?.email });
  }
  
  // Presences 
  async updatePresence({ field, value, scoutId, activityId }, currentUser) {
    const p = this.state.presences.find(x => x.esploratoreId === scoutId && x.attivitaId === activityId);
    if (!p) return;
    p[field] = value;
    if (field === 'pagato' && !value) p.tipoPagamento = null;
    this.persist();
    console.log('LocalAdapter: updatePresence', { field, value, scoutId, activityId, currentUser: currentUser?.email });
  }
}

class FirestoreAdapter {
  constructor() {
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
    const timers = { start: (typeof performance !== 'undefined' ? performance.now() : Date.now()) };
    const timed = async (label, promise) => {
      const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const res = await promise;
      const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      timers[label] = Math.round(t1 - t0);
      return res;
    };
    const [scoutsSnap, staffSnap, actsSnap, presSnap] = await Promise.all([
      timed('scouts', getDocs(this.cols.scouts)),
      timed('staff', getDocs(this.cols.staff)),
      timed('activities', getDocs(this.cols.activities)),
      timed('presences', getDocs(this.cols.presences))
    ]);
    const tEnd = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    timers.total = Math.round(tEnd - timers.start);
    try { console.info('[Perf] Firestore loadAll ms:', timers); } catch {}
    
    return {
      scouts: scoutsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      staff: staffSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      activities: actsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      presences: presSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
  }
  
  async addAuditLog(action, collection, documentId, changes, userId, userEmail) {
    try {
      await addDoc(this.cols.auditLogs, {
        action,
        collection,
        documentId,
        changes,
        userId,
        userEmail,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Errore nel salvataggio audit log:', error);
    }
  }
  
  // Activities
  async addActivity({ tipo, data, descrizione, costo }, currentUser) {
    const ref = await addDoc(this.cols.activities, { tipo, data, descrizione, costo });
    if (currentUser) { 
      await this.addAuditLog('create', 'activities', ref.id, { tipo, data, descrizione, costo }, currentUser.uid, currentUser.email); 
    }
    return ref.id;
  }
  
  async updateActivity({ id, tipo, data, descrizione, costo }, currentUser) {
    await setDoc(doc(this.db, 'activities', id), { tipo, data, descrizione, costo }, { merge: true });
    if (currentUser) { 
      await this.addAuditLog('update', 'activities', id, { tipo, data, descrizione, costo }, currentUser.uid, currentUser.email); 
    }
  }
  
  async deleteActivity(id, currentUser) {
    await deleteDoc(doc(this.db, 'activities', id));
    if (currentUser) { 
      await this.addAuditLog('delete', 'activities', id, {}, currentUser.uid, currentUser.email); 
    }
  }
  
  // Staff
  async addStaff({ nome, cognome, email }, currentUser) {
    const ref = await addDoc(this.cols.staff, { nome, cognome, email });
    if (currentUser) { 
      await this.addAuditLog('create', 'staff', ref.id, { nome, cognome, email }, currentUser.uid, currentUser.email); 
    }
    return ref.id;
  }
  
  async updateStaff({ id, nome, cognome, email }, currentUser) {
    await setDoc(doc(this.db, 'staff', id), { nome, cognome, email }, { merge: true });
    if (currentUser) { 
      await this.addAuditLog('update', 'staff', id, { nome, cognome, email }, currentUser.uid, currentUser.email); 
    }
  }
  
  async deleteStaff(id, currentUser) {
    await deleteDoc(doc(this.db, 'staff', id));
    if (currentUser) { 
      await this.addAuditLog('delete', 'staff', id, {}, currentUser.uid, currentUser.email); 
    }
  }
  
  // Scouts
  async addScout({ nome, cognome }, currentUser) {
    const ref = await addDoc(this.cols.scouts, { nome, cognome });
    if (currentUser) { 
      await this.addAuditLog('create', 'scouts', ref.id, { nome, cognome }, currentUser.uid, currentUser.email); 
    }
    return ref.id;
  }
  
  async updateScout({ id, nome, cognome }, currentUser) {
    await setDoc(doc(this.db, 'scouts', id), { nome, cognome, ...arguments[0] }, { merge: true });
    if (currentUser) { 
      await this.addAuditLog('update', 'scouts', id, arguments[0], currentUser.uid, currentUser.email); 
    }
  }
  
  async deleteScout(id, currentUser) {
    await deleteDoc(doc(this.db, 'scouts', id));
    if (currentUser) { 
      await this.addAuditLog('delete', 'scouts', id, {}, currentUser.uid, currentUser.email); 
    }
  }
  
  // Presences
  async updatePresence({ field, value, scoutId, activityId }, currentUser) {
    const presenceRef = doc(this.db, 'presences', `${scoutId}_${activityId}`);
    const presenceSnap = await getDoc(presenceRef);
    
    if (presenceSnap.exists()) {
      await setDoc(presenceRef, { [field]: value }, { merge: true });
    } else {
      await setDoc(presenceRef, { 
        esploratoreId: scoutId, 
        attivitaId: activityId, 
        [field]: value 
      });
    }
    
    if (currentUser) {
      await this.addAuditLog(
        'update', 
        'presences', 
        `${scoutId}_${activityId}`, 
        { field, value, scoutId, activityId }, 
        currentUser.uid, 
        currentUser.email
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
  async updateScout(id, p, currentUser) { return await this.adapter.updateScout({ id, ...p }, currentUser); },
  async deleteScout(id, currentUser) { return await this.adapter.deleteScout(id, currentUser); },
  async updatePresence(p, currentUser) { return await this.adapter.updatePresence(p, currentUser); },
};

// UI condiviso
const UI = {
  appVersion: 'v3',
  selectedStaffId: null,
  staffToDeleteId: null,
  scoutToDeleteId: null,
  activityToDeleteId: null,
  state: { scouts: [], staff: [], activities: [], presences: [] },
  currentUser: null,
  
  qs(selector) { return document.querySelector(selector); },
  qsa(selector) { return document.querySelectorAll(selector); },
  
  applyThemeFromStorage() {
    try {
      const saved = localStorage.getItem('theme') || '';
      const root = document.documentElement;
      root.classList.toggle('theme-dark', saved === 'dark');
      const btn = this.qs('#themeToggleBtn');
      if (btn) btn.textContent = saved === 'dark' ? 'Tema Chiaro' : 'Tema Scuro';
    } catch {}
  },
  toggleTheme() {
    const root = document.documentElement;
    const isDark = root.classList.toggle('theme-dark');
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
    const btn = this.qs('#themeToggleBtn');
    if (btn) btn.textContent = isDark ? 'Tema Chiaro' : 'Tema Scuro';
  },
  
  async init() {
    try {
      DATA.useFirestore();
      console.log('UI.init: Initializing...');
      this.logNetworkInfo();
      
      // Carica header e modali condivisi
      await this.loadSharedComponents();

      // Applica tema salvato e wiring toggle
      this.applyThemeFromStorage();
      const themeBtn = this.qs('#themeToggleBtn');
      if (themeBtn && !themeBtn._bound) {
        themeBtn._bound = true;
        themeBtn.addEventListener('click', () => this.toggleTheme());
      }

      // Prefetch pagine usate spesso
      try {
        const links = [
          'presenze.html','dashboard.html','calendario.html','esploratori.html','staff.html','audit-logs.html'
        ];
        links.forEach(href => {
          const l = document.createElement('link');
          l.rel = 'prefetch';
          l.href = href;
          document.head.appendChild(l);
        });
      } catch {}

      // Nascondi la modale login fino a quando lo stato auth non è noto
      const loginModal = this.qs('#loginModal');
      if (loginModal) loginModal.classList.remove('show');

      // Wiring eventi condivisi (serve anche per il login form)
      this.setupEventListeners();
      
      // Inizializza Firebase Auth
      // Imposta persistenza locale della sessione sull'istanza corretta
      try { await setPersistence(DATA.adapter.auth, browserLocalPersistence); } catch(e) { console.warn('Auth persistence set failed:', e); }

      onAuthStateChanged(DATA.adapter.auth, async (user) => {
        this.currentUser = user;
        if (user) {
          const emailEl = this.qs('#loggedInUserEmail');
          if (emailEl) { emailEl.textContent = ''; try { emailEl.style.display = 'none'; } catch {} }
          this.qs('#logoutButton').style.display = 'block';
          this.closeModal('loginModal');
          const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          this.state = await DATA.loadAll();
          const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          try { console.info('[Perf] DATA.loadAll total ms:', Math.round(t1 - t0)); } catch {}
          this.rebuildPresenceIndex();
          // Selezione staff: auto-seleziona se email corrisponde, altrimenti apri modale
          const match = (this.state.staff || []).find(s => (s.email || '').toLowerCase() === (user.email || '').toLowerCase());
          if (match) {
            this.selectStaff(match.id);
          } else {
            this.renderStaffSelectionList();
            this.showModal('staffSelectionModal');
          }
          const r0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          this.renderCurrentPage();
          const r1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          try { console.info('[Perf] renderCurrentPage ms:', Math.round(r1 - r0)); } catch {}
        } else {
          const emailEl = this.qs('#loggedInUserEmail');
          if (emailEl) { emailEl.textContent = ''; try { emailEl.style.display = 'none'; } catch {} }
          this.qs('#logoutButton').style.display = 'none';
          this.showModal('loginModal');
        }
      });

      // Install prompt A2HS discreto
      this.setupInstallPrompt();
      // Avvia una sonda di connettività non bloccante
      this.runConnectivityProbe();
      
    } catch (error) {
      console.error('UI.init error:', error);
    }
  },
  
  async loadSharedComponents() {
    try {
      // Carica header condiviso
      const headerResponse = await fetch('shared.html');
      const headerHtml = await headerResponse.text();
      this.qs('#shared-header').innerHTML = headerHtml;
      
      // Carica modali condivisi
      const modalsResponse = await fetch('modals.html');
      const modalsHtml = await modalsResponse.text();
      this.qs('#shared-modals').innerHTML = modalsHtml;
    } catch (error) {
      console.error('Errore nel caricamento componenti condivisi:', error);
    }
  },
  
  setupEventListeners() {
    // Event listeners condivisi
    const logoutBtn = this.qs('#logoutButton');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(DATA.adapter.auth);
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
    
    // Toggle tema se presente (fallback nel caso venga ricaricato header dopo)
    const themeBtn = this.qs('#themeToggleBtn');
    if (themeBtn && !themeBtn._bound) {
      themeBtn._bound = true;
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }
    
    // Hamburger menu
    const hamburgerIcon = this.qs('.hamburger-icon');
    const navLinks = this.qs('.nav-links');
    if (hamburgerIcon && navLinks) {
      hamburgerIcon.addEventListener('click', () => {
        navLinks.classList.toggle('active');
      });
    }
    
    // Login form
    const loginForm = this.qs('#loginForm');
    if (loginForm && !loginForm._bound) {
      loginForm._bound = true;
      loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
        const email = this.qs('#loginEmail').value.trim();
      const password = this.qs('#loginPassword').value;
      const loginError = this.qs('#loginError');
      loginError.textContent = '';
        console.log('Tentativo login per:', email);
      try {
        await signInWithEmailAndPassword(DATA.adapter.auth, email, password);
          console.log('Login riuscito per:', email);
      } catch (error) {
          console.error('Login error:', error.code, error.message);
          let msg = 'Accesso non riuscito.';
          switch (error.code) {
            case 'auth/invalid-email': msg = 'Email non valida.'; break;
            case 'auth/user-disabled': msg = 'Utente disabilitato.'; break;
            case 'auth/user-not-found': msg = 'Utente non trovato.'; break;
            case 'auth/wrong-password': msg = 'Password errata.'; break;
            case 'auth/too-many-requests': msg = 'Troppi tentativi, riprova più tardi.'; break;
          }
          loginError.textContent = msg;
        }
      });
    }
    
    // Modali event listeners
    this.setupModalEventListeners();
  },

  setupInstallPrompt() {
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      // Mostra un piccolo banner non invasivo nell'header
      const header = this.qs('#shared-header');
      if (!header || header._installShown) return;
      header._installShown = true;
      const bar = document.createElement('div');
      bar.style.background = '#e8f5e9';
      bar.style.borderTop = '1px solid #c8e6c9';
      bar.style.padding = '8px 12px';
      bar.style.display = 'flex';
      bar.style.justifyContent = 'space-between';
      bar.style.alignItems = 'center';
      bar.innerHTML = `
        <span class="text-sm text-green-800">Aggiungi l'app alla schermata Home per un accesso rapido.</span>
        <div class="flex gap-2">
          <button id="installAppBtn" class="btn-primary py-1 px-3 text-sm">Aggiungi</button>
          <button id="dismissInstallBtn" class="btn-secondary py-1 px-3 text-sm">Chiudi</button>
        </div>
      `;
      header.appendChild(bar);
      this.qs('#dismissInstallBtn')?.addEventListener('click', () => bar.remove());
      this.qs('#installAppBtn')?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        try { await deferredPrompt.userChoice; } catch {}
        deferredPrompt = null;
        bar.remove();
      });
    });
  },
  
  setupModalEventListeners() {
    // Edit Staff Form
    const editStaffForm = this.qs('#editStaffForm');
    if (editStaffForm) editStaffForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentUser) { alert('Devi essere loggato per modificare staff.'); return; }
      const id = this.qs('#editStaffId').value;
      const nome = this.qs('#editStaffNome').value.trim();
      const cognome = this.qs('#editStaffCognome').value.trim();
      const email = this.qs('#editStaffEmail').value.trim();
      await DATA.updateStaff({ id, nome, cognome, email }, this.currentUser);
      this.closeModal('editStaffModal');
      this.state = await DATA.loadAll(); 
      this.rebuildPresenceIndex(); 
      this.renderCurrentPage();
    });
    
    // Confirm Delete Staff
    const confirmDeleteStaffButton = this.qs('#confirmDeleteStaffButton');
    if (confirmDeleteStaffButton) confirmDeleteStaffButton.addEventListener('click', async () => {
      if (!this.currentUser) { alert('Devi essere loggato per eliminare staff.'); return; }
      if (!this.staffToDeleteId) return;
      await DATA.deleteStaff(this.staffToDeleteId, this.currentUser);
      this.staffToDeleteId = null;
      this.closeModal('confirmDeleteStaffModal');
      this.state = await DATA.loadAll(); 
      this.rebuildPresenceIndex(); 
      this.renderCurrentPage();
    });
    
    // Edit Scout Form
    const editScoutForm = this.qs('#editScoutForm');
    if (editScoutForm) editScoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentUser) { alert('Devi essere loggato per modificare esploratori.'); return; }
      const id = this.qs('#editScoutId').value;
      const nome = this.qs('#editScoutNome').value.trim();
      const cognome = this.qs('#editScoutCognome').value.trim();
      await DATA.updateScout(id, { id, nome, cognome }, this.currentUser);
      this.closeModal('editScoutModal');
      this.state = await DATA.loadAll(); 
      this.rebuildPresenceIndex(); 
      this.renderCurrentPage();
    });
    
    // Confirm Delete Scout
    const confirmDeleteScoutButton = this.qs('#confirmDeleteScoutButton');
    if (confirmDeleteScoutButton) confirmDeleteScoutButton.addEventListener('click', async () => {
      if (!this.currentUser) { alert('Devi essere loggato per eliminare esploratori.'); return; }
      if (!this.scoutToDeleteId) return;
      await DATA.deleteScout(this.scoutToDeleteId, this.currentUser);
      this.scoutToDeleteId = null;
      this.closeModal('confirmDeleteScoutModal');
      this.state = await DATA.loadAll(); 
      this.rebuildPresenceIndex(); 
      this.renderCurrentPage();
    });
    
    // Edit Activity Form
    const editActivityForm = this.qs('#editActivityForm');
    if (editActivityForm) editActivityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentUser) { alert('Devi essere loggato per modificare attività.'); return; }
      const id = this.qs('#editActivityId').value;
      const tipo = this.qs('#editActivityTipo').value;
      const data = new Date(this.qs('#editActivityData').value);
      const descrizione = this.qs('#editActivityDescrizione').value.trim();
      const costo = this.qs('#editActivityCosto').value || '0';
      await DATA.updateActivity({ id, tipo, data, descrizione, costo }, this.currentUser);
      this.closeModal('editActivityModal');
      this.state = await DATA.loadAll(); 
      this.rebuildPresenceIndex(); 
      this.renderCurrentPage();
    });
    
    // Confirm Delete Activity
    const confirmDeleteActivityButton = this.qs('#confirmDeleteActivityButton');
    if (confirmDeleteActivityButton) confirmDeleteActivityButton.addEventListener('click', async () => {
      if (!this.currentUser) { alert('Devi essere loggato per eliminare attività.'); return; }
      if (!this.activityToDeleteId) return;
      await DATA.deleteActivity(this.activityToDeleteId, this.currentUser);
      this.activityToDeleteId = null;
      this.closeModal('confirmDeleteActivityModal');
      this.state = await DATA.loadAll(); 
      this.rebuildPresenceIndex(); 
      this.renderCurrentPage();
    });
  },

  renderStaffSelectionList() {
    const container = this.qs('#staffListForSelection');
    if (!container) return;
    container.innerHTML = '';
    if (!this.state.staff || !this.state.staff.length) {
      container.innerHTML = '<p class="text-gray-500">Nessun membro staff disponibile.</p>';
      return;
    }
    this.state.staff.forEach(member => {
      const btn = document.createElement('button');
      btn.className = 'w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg';
      btn.textContent = `${member.nome} ${member.cognome}${member.email ? ' — ' + member.email : ''}`;
      btn.addEventListener('click', () => this.selectStaff(member.id));
      container.appendChild(btn);
    });
  },

  selectStaff(id) {
    this.selectedStaffId = id;
    const m = (this.state.staff || []).find(s => s.id === id);
    const label = this.qs('#selectedStaffName');
    if (label) label.textContent = m ? `${m.nome} ${m.cognome}` : 'Nessuno';
    this.closeModal('staffSelectionModal');
    // Rirender per abilitare le select nelle tabelle
    this.renderCurrentPage();
  },
  
  renderCurrentPage() {
    // Questa funzione sarà sovrascritta da ogni pagina specifica
    console.log('Rendering current page...');
  },
  
  // Funzioni condivise per modali, rendering, etc.
  showModal(modalId) {
    const modal = this.qs(`#${modalId}`);
    if (modal) {
      modal.classList.add('show');
    }
  },
  
  closeModal(modalId) {
    const modal = this.qs(`#${modalId}`);
    if (modal) {
      modal.classList.remove('show');
    }
  },
  
  // Funzioni di utilità
  debounce(fn, wait = 250) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), wait);
    };
  },

  logNetworkInfo() {
    try {
      const nav = navigator;
      const c = nav && nav.connection ? nav.connection : null;
      if (c) {
        console.info('[Net] connection', {
          effectiveType: c.effectiveType,
          rtt: c.rtt,
          downlink: c.downlink,
          saveData: c.saveData
        });
      }
    } catch {}
  },

  async runConnectivityProbe() {
    try {
      const t = async (label, url) => {
        const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        try {
          const res = await fetch(url, { cache: 'no-store' });
          const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          console.info('[Net] probe', label, Math.round(t1 - t0) + 'ms', res.status);
        } catch (e) {
          const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          console.warn('[Net] probe FAILED', label, Math.round(t1 - t0) + 'ms', String(e));
        }
      };
      // Stesso dominio (indicativo di lentezza locale/SW)
      t('same-origin manifest', 'manifest.json');
      // Esterno (indicativo di rete generale)
      t('gstatic 204', 'https://www.gstatic.com/generate_204');
      // Firebase Auth JS (CDN)
      t('firebase-auth.js', 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js');
    } catch {}
  },

  async renderInBatches({ container, items, renderItem, batchSize = 100 }) {
    if (!container) return;
    if (!Array.isArray(items) || items.length === 0) { container.innerHTML = ''; return; }
    if (items.length <= batchSize) {
      container.innerHTML = items.map(renderItem).join('');
      return;
    }
    container.innerHTML = '';
    for (let i = 0; i < items.length; i += batchSize) {
      const slice = items.slice(i, i + batchSize);
      container.insertAdjacentHTML('beforeend', slice.map(renderItem).join(''));
      // Rilascia il thread UI
      // eslint-disable-next-line no-await-in-loop
      await new Promise(requestAnimationFrame);
    }
  },

  toJsDate(firestoreDate) {
    if (firestoreDate && firestoreDate.toDate) {
      return firestoreDate.toDate();
    }
    return new Date(firestoreDate);
  },
  
  rebuildPresenceIndex() {
    // Ricostruisce l'indice delle presenze per ottimizzare le ricerche
    this.presenceIndex = new Map();
    this.state.presences.forEach(p => {
      const key = `${p.esploratoreId}_${p.attivitaId}`;
      this.presenceIndex.set(key, p);
    });
  },

  // Presenze deduplicate disponibili ovunque (non solo in presenze.js)
  getDedupedPresences() {
    if (this.presenceIndex && this.presenceIndex.size > 0) {
      return Array.from(this.presenceIndex.values());
    }
    return Array.isArray(this.state.presences) ? this.state.presences : [];
  },
  
  // Funzioni per audit logs
  async loadAuditLogs() {
    if (DATA.adapter.constructor.name === 'FirestoreAdapter') {
      try {
        const auditSnap = await getDocs(DATA.adapter.cols.auditLogs);
        return auditSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Errore nel caricamento audit logs:', error);
        return [];
      }
    } else {
      return [];
    }
  },

  // Aggiornamenti presenze con refresh stato e dashboard
  async updatePresenceCell({ field, value, scoutId, activityId }) {
    if (!this.currentUser) { alert('Devi essere loggato per modificare le presenze.'); return; }
    if (!this.selectedStaffId) { alert('Seleziona uno Staff per abilitare le modifiche.'); return; }
    await DATA.updatePresence({ field, value, scoutId, activityId }, this.currentUser);
    this.state = await DATA.loadAll();
    this.rebuildPresenceIndex();
    // Aggiorna UI corrente
    this.renderCurrentPage();
    // Se siamo in dashboard, aggiorna i grafici se esiste la funzione
    if (typeof this.renderDashboardCharts === 'function') {
      try { this.renderDashboardCharts(); } catch {}
    }
    // Aggiorna anche la sezione pagamenti per attività se presente
    if (typeof this.renderPaymentsPerActivity === 'function') {
      try { this.renderPaymentsPerActivity(); } catch {}
    }
  },

  async updatePaymentCombined({ value, scoutId, activityId }) {
    if (!this.currentUser) { alert('Devi essere loggato per modificare i pagamenti.'); return; }
    if (!this.selectedStaffId) { alert('Seleziona uno Staff per abilitare le modifiche.'); return; }
    if (!value) {
      await DATA.updatePresence({ field: 'pagato', value: false, scoutId, activityId }, this.currentUser);
      await DATA.updatePresence({ field: 'tipoPagamento', value: null, scoutId, activityId }, this.currentUser);
    } else {
      await DATA.updatePresence({ field: 'pagato', value: true, scoutId, activityId }, this.currentUser);
      await DATA.updatePresence({ field: 'tipoPagamento', value, scoutId, activityId }, this.currentUser);
    }
    this.state = await DATA.loadAll();
    this.rebuildPresenceIndex();
    this.renderCurrentPage();
    if (typeof this.renderDashboardCharts === 'function') {
      try { this.renderDashboardCharts(); } catch {}
    }
    if (typeof this.renderPaymentsPerActivity === 'function') {
      try { this.renderPaymentsPerActivity(); } catch {}
    }
  },

  // Helpers Calendario: apertura modali modifica/elimina attivita
  openEditActivityModal(id) {
    if (!this.currentUser) { alert('Devi essere loggato per modificare attività.'); return; }
    const a = (this.state.activities || []).find(x => x.id === id);
    if (!a) return;
    const d = this.toJsDate(a.data);
    const yyyyMmDd = isNaN(d) ? '' : d.toISOString().split('T')[0];
    const tipoEl = this.qs('#editActivityTipo');
    const dataEl = this.qs('#editActivityData');
    const descEl = this.qs('#editActivityDescrizione');
    const costoEl = this.qs('#editActivityCosto');
    const idEl = this.qs('#editActivityId');
    if (idEl) idEl.value = a.id;
    if (tipoEl) tipoEl.value = a.tipo;
    if (dataEl) dataEl.value = yyyyMmDd;
    if (descEl) descEl.value = a.descrizione || '';
    if (costoEl) costoEl.value = a.costo || '';
    this.showModal('editActivityModal');
  },

  confirmDeleteActivity(id) {
    if (!this.currentUser) { alert('Devi essere loggato per eliminare attività.'); return; }
    const a = (this.state.activities || []).find(x => x.id === id);
    if (!a) return;
    this.activityToDeleteId = id;
    const d = this.toJsDate(a.data);
    const ds = isNaN(d) ? '' : d.toLocaleDateString('it-IT');
    const infoEl = this.qs('#activityInfoToDelete');
    if (infoEl) infoEl.textContent = `${a.tipo} — ${ds}${a.descrizione ? ' — ' + a.descrizione : ''}`;
    this.showModal('confirmDeleteActivityModal');
  },
};

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  UI.init();
});

// Esporta per uso nelle pagine specifiche
window.UI = UI;
window.DATA = DATA;

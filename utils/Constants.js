/**
 * Costanti dell'applicazione
 */
export const APP_CONFIG = {
  NAME: 'Reparto Maori',
  SUBTITLE: 'Presenze',
  VERSION: '1.0.0'
};

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAoa8Rrlplr001PitiFrqBkrbEWL3TWrL4",
  authDomain: "presenziariomaori.firebaseapp.com",
  projectId: "presenziariomaori",
  storageBucket: "presenziariomaori.firebasestorage.app",
  messagingSenderId: "556210165397",
  appId: "1:556210165397:web:4f434e78fb97f02d116d9c"
};

export const COLLECTIONS = {
  SCOUTS: 'scouts',
  STAFF: 'staff',
  ACTIVITIES: 'activities',
  PRESENCES: 'presences',
  AUDIT_LOGS: 'auditLogs'
};

export const PRESENCE_STATUS = {
  PRESENTE: 'Presente',
  ASSENTE: 'Assente',
  NON_RILEVATO: 'NR'
};

export const PAYMENT_TYPES = {
  CONTANTI: 'Contanti',
  SATISPAY: 'Satispay',
  BONIFICO: 'Bonifico'
};

export const ACTIVITY_TYPES = {
  RIUNIONE: 'Riunione',
  ATTIVITA_LUNGA: 'Attività lunga',
  USCITA: 'Uscita',
  CAMPO: 'Campo'
};

export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
};

export const AUDIT_ENTITIES = {
  SCOUT: 'scout',
  STAFF: 'staff',
  ACTIVITY: 'activity',
  PRESENCE: 'presence'
};

export const UI_CLASSES = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  HIDDEN: 'hidden',
  VISIBLE: 'visible'
};

export const LOCAL_STORAGE_KEYS = {
  STATE: 'presenziario-state',
  USER_PREFERENCES: 'presenziario-preferences'
};

export const ERROR_MESSAGES = {
  LOGIN_REQUIRED: 'Devi essere loggato per eseguire questa operazione.',
  STAFF_REQUIRED: 'Devi selezionare un membro dello staff per eseguire questa operazione.',
  VALIDATION_ERROR: 'Dati non validi. Controlla i campi inseriti.',
  NETWORK_ERROR: 'Errore di connessione. Verifica la tua connessione internet.',
  UNKNOWN_ERROR: 'Si è verificato un errore imprevisto. Riprova più tardi.'
};

export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Dati salvati con successo.',
  DELETE_SUCCESS: 'Elemento eliminato con successo.',
  UPDATE_SUCCESS: 'Dati aggiornati con successo.'
};

export const TAB_NAMES = {
  PRESENCES: 'presences',
  DASHBOARD: 'dashboard',
  CALENDAR: 'calendar',
  SCOUTS: 'scouts',
  STAFF: 'staff',
  AUDIT_LOGS: 'auditLogs'
};

export const TAB_LABELS = {
  [TAB_NAMES.PRESENCES]: 'Presenze',
  [TAB_NAMES.DASHBOARD]: 'Dashboard',
  [TAB_NAMES.CALENDAR]: 'Calendario',
  [TAB_NAMES.SCOUTS]: 'Esploratori',
  [TAB_NAMES.STAFF]: 'Staff',
  [TAB_NAMES.AUDIT_LOGS]: 'Log Audit'
};

export const DEFAULT_VALUES = {
  COST: '0',
  PRESENCE_STATUS: PRESENCE_STATUS.NON_RILEVATO,
  PAYMENT_STATUS: false
};

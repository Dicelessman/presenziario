// Script di migrazione per convertire le date da stringhe a Date objects in Firestore
// Esegui questo script una sola volta per aggiornare i dati esistenti

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Configurazione Firebase (usa le stesse credenziali dell'app)
const firebaseConfig = {
  apiKey: "AIzaSyAoa8Rrlplr001PitiFrqBkrbEWL3TWrL4",
  authDomain: "presenziariomaori.firebaseapp.com",
  projectId: "presenziariomaori",
  storageBucket: "presenziariomaori.firebasestorage.app",
  messagingSenderId: "556210165397",
  appId: "1:556210165397:web:4f434e78fb97f02d116d9c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateDates() {
  console.log('🚀 Iniziando migrazione date...');
  
  try {
    // Migra le attività
    console.log('📅 Migrando date delle attività...');
    const activitiesSnapshot = await getDocs(collection(db, 'activities'));
    let activitiesUpdated = 0;
    
    for (const doc of activitiesSnapshot.docs) {
      const data = doc.data();
      if (typeof data.data === 'string') {
        console.log(`  - Convertendo: ${data.data} -> Date object`);
        const [d, m, y] = data.data.split('/');
        const newDate = new Date(`${y}-${m}-${d}`);
        await updateDoc(doc.ref, { data: newDate });
        activitiesUpdated++;
      }
    }
    
    console.log(`✅ Migrate ${activitiesUpdated} attività`);
    
    // Verifica finale
    console.log('🔍 Verifica finale...');
    const finalSnapshot = await getDocs(collection(db, 'activities'));
    let stringDates = 0;
    let dateObjects = 0;
    
    for (const doc of finalSnapshot.docs) {
      const data = doc.data();
      if (typeof data.data === 'string') {
        stringDates++;
        console.log(`  ⚠️  Ancora stringa: ${doc.id} -> ${data.data}`);
      } else if (data.data instanceof Date) {
        dateObjects++;
      }
    }
    
    console.log(`📊 Risultato finale:`);
    console.log(`   - Date objects: ${dateObjects}`);
    console.log(`   - Stringhe rimaste: ${stringDates}`);
    
    if (stringDates === 0) {
      console.log('🎉 Migrazione completata con successo!');
    } else {
      console.log('⚠️  Alcune date non sono state migrate. Controlla i log sopra.');
    }
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
  }
}

// Funzione per eseguire la migrazione
window.migrateDates = migrateDates;

// Auto-esecuzione se lo script è caricato direttamente
if (typeof window !== 'undefined') {
  console.log('📋 Script di migrazione caricato.');
  console.log('💡 Per eseguire la migrazione, chiama: migrateDates()');
}

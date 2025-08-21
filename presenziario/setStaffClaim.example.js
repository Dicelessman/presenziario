// Esempio da eseguire su un ambiente Node con Admin SDK già inizializzato.
// NON includere questo file nel client né nel repo pubblico.

/*
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});
*/

async function setStaffClaimForUid(uid) {
  if (!uid) throw new Error('UID mancante');
  await admin.auth().setCustomUserClaims(uid, { role: 'staff' });
  console.log(`Impostato role=staff per UID ${uid}`);
}

// Esegui: node setStaffClaim.example.js <UID>
if (require.main === module) {
  const uid = process.argv[2];
  setStaffClaimForUid(uid).catch(err => {
    console.error(err);
    process.exit(1);
  });
}



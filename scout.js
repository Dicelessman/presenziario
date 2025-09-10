// scout.js - pagina scheda personale esploratore

UI.renderCurrentPage = function() {
  this.renderScoutPage();
};

UI.renderScoutPage = async function() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) {
    this.qs('#scoutTitle').textContent = 'Scheda Esploratore — ID mancante';
    return;
  }
  this.qs('#scoutId').value = id;

  // Assicura stato caricato
  if (!this.state.scouts || this.state.scouts.length === 0) {
    this.state = await DATA.loadAll();
    this.rebuildPresenceIndex();
  }
  const s = (this.state.scouts || []).find(x => x.id === id);
  if (!s) {
    this.qs('#scoutTitle').textContent = 'Scheda Esploratore — non trovato';
    return;
  }
  this.qs('#scoutTitle').textContent = `Scheda — ${s.nome || ''} ${s.cognome || ''}`;

  // Riempie i campi se presenti
  const setVal = (sel, val) => { const el = this.qs(sel); if (el) el.value = val ?? ''; };
  setVal('#anag_nome', s.nome);
  setVal('#anag_cognome', s.cognome);
  setVal('#anag_dob', toYyyyMmDd(s.anag_dob));
  setVal('#anag_cf', s.anag_cf);
  setVal('#anag_indirizzo', s.anag_indirizzo);
  setVal('#anag_citta', s.anag_citta);
  setVal('#anag_email', s.anag_email);
  setVal('#anag_telefono', s.anag_telefono);

  setVal('#ct_g1_nome', s.ct_g1_nome);
  setVal('#ct_g1_tel', s.ct_g1_tel);
  setVal('#ct_g1_email', s.ct_g1_email);
  setVal('#ct_g2_nome', s.ct_g2_nome);
  setVal('#ct_g2_tel', s.ct_g2_tel);
  setVal('#ct_g2_email', s.ct_g2_email);

  setVal('#san_gruppo', s.san_gruppo);
  setVal('#san_intolleranze', s.san_intolleranze);
  setVal('#san_allergie', s.san_allergie);
  setVal('#san_farmaci', s.san_farmaci);
  setVal('#san_vaccinazioni', s.san_vaccinazioni);
  setVal('#san_cert', s.san_cert);
  setVal('#san_altro', s.san_altro);

  setVal('#pv_promessa', toYyyyMmDd(s.pv_promessa));
  const vcp = this.qs(`input[name="pv_vcp_cp"][value="${s.pv_vcp_cp}"]`);
  if (vcp) vcp.checked = true;
  setVal('#pv_giglio_data', toYyyyMmDd(s.pv_giglio_data));
  setVal('#pv_giglio_note', s.pv_giglio_note);

  setCheckDate('pv_io_11', s.pv_io_11);
  setCheckDate('pv_io_12', s.pv_io_12);
  setCheckDate('pv_io_13', s.pv_io_13);
  setCheckDate('pv_io_14', s.pv_io_14);
  setCheckDate('pv_re_11', s.pv_re_11);
  setCheckDate('pv_re_12', s.pv_re_12);
  setCheckDate('pv_re_13', s.pv_re_13);
  setCheckDate('pv_re_14', s.pv_re_14);
  setCheckDate('pv_im_11', s.pv_im_11);
  setCheckDate('pv_im_12', s.pv_im_12);
  setCheckDate('pv_im_13', s.pv_im_13);
  setCheckDate('pv_im_14', s.pv_im_14);
  setCheckDate('pv_io_21', s.pv_io_21);
  setCheckDate('pv_io_22', s.pv_io_22);
  setCheckDate('pv_io_23', s.pv_io_23);
  setCheckDate('pv_io_24', s.pv_io_24);
  setCheckDate('pv_re_21', s.pv_re_21);
  setCheckDate('pv_re_22', s.pv_re_22);
  setCheckDate('pv_re_23', s.pv_re_23);
  setCheckDate('pv_re_24', s.pv_re_24);
  setCheckDate('pv_im_21', s.pv_im_21);
  setCheckDate('pv_im_22', s.pv_im_22);
  setCheckDate('pv_im_23', s.pv_im_23);
  setCheckDate('pv_im_24', s.pv_im_24);
  setCheckDate('pv_io_31', s.pv_io_31);
  setCheckDate('pv_io_32', s.pv_io_32);
  setCheckDate('pv_io_33', s.pv_io_33);
  setCheckDate('pv_io_34', s.pv_io_34);
  setCheckDate('pv_re_31', s.pv_re_31);
  setCheckDate('pv_re_32', s.pv_re_32);
  setCheckDate('pv_re_33', s.pv_re_33);
  setCheckDate('pv_re_34', s.pv_re_34);
  setCheckDate('pv_im_31', s.pv_im_31);
  setCheckDate('pv_im_32', s.pv_im_32);
  setCheckDate('pv_im_33', s.pv_im_33);
  setCheckDate('pv_im_34', s.pv_im_34);
  setVal('#pv_note', s.pv_note);

  setVal('#sp_nome', s.sp_nome);
  setCheckDate('sp_p1', s.sp_p1);
  setCheckDate('sp_p2', s.sp_p2);
  setCheckDate('sp_p3', s.sp_p3);
  setCheckDate('sp_cr', s.sp_cr);
  setVal('#sp_note', s.sp_note);

  setPair('#ev_ce1', s.ev_ce1);
  setPair('#ev_ce2', s.ev_ce2);
  setPair('#ev_ce3', s.ev_ce3);
  setPair('#ev_ce4', s.ev_ce4);
  setPair('#ev_ccp', s.ev_ccp);
  setPair('#ev_tc1', s.ev_tc1);
  setPair('#ev_tc2', s.ev_tc2);
  setPair('#ev_tc3', s.ev_tc3);
  setPair('#ev_tc4', s.ev_tc4);
  setPair('#ev_jam', s.ev_jam);
  setVal('#ev_note', s.ev_note);

  setVal('#doc_quota1', toYyyyMmDd(s.doc_quota1));
  setVal('#doc_quota2', toYyyyMmDd(s.doc_quota2));
  setVal('#doc_quota3', toYyyyMmDd(s.doc_quota3));
  setVal('#doc_quota4', toYyyyMmDd(s.doc_quota4));
  setVal('#doc_iscr', toYyyyMmDd(s.doc_iscr));
  setVal('#doc_san', toYyyyMmDd(s.doc_san));
  setVal('#doc_priv', toYyyyMmDd(s.doc_priv));
  setVal('#doc_note', toYyyyMmDd(s.doc_note));

  const form = this.qs('#scoutForm');
  if (form && !form._bound) {
    form._bound = true;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentUser) { alert('Devi essere loggato per salvare.'); return; }
      const payload = collectForm();
      await DATA.updateScout(id, payload, this.currentUser);
      this.state = await DATA.loadAll();
      this.rebuildPresenceIndex();
      alert('Salvato');
    });
    this.qs('#btnAnnulla')?.addEventListener('click', () => history.back());
  }

  function setCheckDate(prefix, val) {
    const data = val?.data ? toYyyyMmDd(val.data) : toYyyyMmDd(val);
    const done = val?.done ?? (val && typeof val === 'object' ? false : !!val);
    const chk = UI.qs(`#${prefix}_chk`);
    const dt = UI.qs(`#${prefix}_dt`);
    if (chk) chk.checked = !!done;
    if (dt) dt.value = data || '';
  }

  function setPair(prefix, val) {
    const dt = UI.qs(`${prefix}_dt`);
    const tx = UI.qs(`${prefix}_tx`);
    if (dt) dt.value = toYyyyMmDd(val?.data || val) || '';
    if (tx) tx.value = val?.testo || '';
  }

  function toYyyyMmDd(x) {
    if (!x) return '';
    const d = UI.toJsDate(x);
    return isNaN(d) ? '' : d.toISOString().split('T')[0];
  }

  function collectForm() {
    const get = (sel) => UI.qs(sel)?.value?.trim() || '';
    const getNum = (sel) => UI.qs(sel)?.value || '';
    const getChk = (sel) => !!UI.qs(sel)?.checked;
    const pair = (p) => ({ data: get(`${p}_dt`) || null, testo: get(`${p}_tx`) || '' });
    const cd = (p) => ({ done: getChk(`#${p}_chk`), data: get(`#${p}_dt`) || null });
    return {
      nome: get('#anag_nome'),
      cognome: get('#anag_cognome'),
      anag_dob: get('#anag_dob') || null,
      anag_cf: get('#anag_cf'),
      anag_indirizzo: get('#anag_indirizzo'),
      anag_citta: get('#anag_citta'),
      anag_email: get('#anag_email'),
      anag_telefono: getNum('#anag_telefono') || '',
      ct_g1_nome: get('#ct_g1_nome'),
      ct_g1_tel: getNum('#ct_g1_tel') || '',
      ct_g1_email: get('#ct_g1_email'),
      ct_g2_nome: get('#ct_g2_nome'),
      ct_g2_tel: getNum('#ct_g2_tel') || '',
      ct_g2_email: get('#ct_g2_email'),
      san_gruppo: get('#san_gruppo'),
      san_intolleranze: get('#san_intolleranze'),
      san_allergie: get('#san_allergie'),
      san_farmaci: get('#san_farmaci'),
      san_vaccinazioni: get('#san_vaccinazioni'),
      san_cert: get('#san_cert'),
      san_altro: get('#san_altro'),
      pv_promessa: get('#pv_promessa') || null,
      pv_vcp_cp: UI.qs('input[name="pv_vcp_cp"]:checked')?.value || '',
      pv_giglio_data: get('#pv_giglio_data') || null,
      pv_giglio_note: get('#pv_giglio_note'),
      pv_io_11: cd('pv_io_11'), pv_io_12: cd('pv_io_12'), pv_io_13: cd('pv_io_13'), pv_io_14: cd('pv_io_14'),
      pv_re_11: cd('pv_re_11'), pv_re_12: cd('pv_re_12'), pv_re_13: cd('pv_re_13'), pv_re_14: cd('pv_re_14'),
      pv_im_11: cd('pv_im_11'), pv_im_12: cd('pv_im_12'), pv_im_13: cd('pv_im_13'), pv_im_14: cd('pv_im_14'),
      pv_io_21: cd('pv_io_21'), pv_io_22: cd('pv_io_22'), pv_io_23: cd('pv_io_23'), pv_io_24: cd('pv_io_24'),
      pv_re_21: cd('pv_re_21'), pv_re_22: cd('pv_re_22'), pv_re_23: cd('pv_re_23'), pv_re_24: cd('pv_re_24'),
      pv_im_21: cd('pv_im_21'), pv_im_22: cd('pv_im_22'), pv_im_23: cd('pv_im_23'), pv_im_24: cd('pv_im_24'),
      pv_io_31: cd('pv_io_31'), pv_io_32: cd('pv_io_32'), pv_io_33: cd('pv_io_33'), pv_io_34: cd('pv_io_34'),
      pv_re_31: cd('pv_re_31'), pv_re_32: cd('pv_re_32'), pv_re_33: cd('pv_re_33'), pv_re_34: cd('pv_re_34'),
      pv_im_31: cd('pv_im_31'), pv_im_32: cd('pv_im_32'), pv_im_33: cd('pv_im_33'), pv_im_34: cd('pv_im_34'),
      pv_note: get('#pv_note'),
      sp_nome: get('#sp_nome'),
      sp_p1: cd('sp_p1'), sp_p2: cd('sp_p2'), sp_p3: cd('sp_p3'), sp_cr: cd('sp_cr'),
      sp_note: get('#sp_note'),
      ev_ce1: pair('#ev_ce1'), ev_ce2: pair('#ev_ce2'), ev_ce3: pair('#ev_ce3'), ev_ce4: pair('#ev_ce4'),
      ev_ccp: pair('#ev_ccp'), ev_tc1: pair('#ev_tc1'), ev_tc2: pair('#ev_tc2'), ev_tc3: pair('#ev_tc3'), ev_tc4: pair('#ev_tc4'),
      ev_jam: pair('#ev_jam'), ev_note: get('#ev_note'),
      doc_quota1: get('#doc_quota1') || null, doc_quota2: get('#doc_quota2') || null,
      doc_quota3: get('#doc_quota3') || null, doc_quota4: get('#doc_quota4') || null,
      doc_iscr: get('#doc_iscr') || null, doc_san: get('#doc_san') || null,
      doc_priv: get('#doc_priv') || null, doc_note: get('#doc_note') || null,
    };
  }
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Scheda Esploratore caricata');
});



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
  setVal('#anag_dob', this.toYyyyMmDd(s.anag_dob));
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

  setVal('#pv_promessa', this.toYyyyMmDd(s.pv_promessa));
  const vcp = this.qs(`input[name="pv_vcp_cp"][value="${s.pv_vcp_cp}"]`);
  if (vcp) vcp.checked = true;
  setVal('#pv_giglio_data', this.toYyyyMmDd(s.pv_giglio_data));
  setVal('#pv_giglio_note', s.pv_giglio_note);

  // Traccia checkboxes e date
  this.setCheckDate('pv_traccia1', s.pv_traccia1);
  this.setCheckDate('pv_traccia2', s.pv_traccia2);
  this.setCheckDate('pv_traccia3', s.pv_traccia3);

  this.setCheckDate('pv_io_11', s.pv_io_11);
  this.setCheckDate('pv_io_12', s.pv_io_12);
  this.setCheckDate('pv_io_13', s.pv_io_13);
  this.setCheckDate('pv_io_14', s.pv_io_14);
  this.setCheckDate('pv_re_11', s.pv_re_11);
  this.setCheckDate('pv_re_12', s.pv_re_12);
  this.setCheckDate('pv_re_13', s.pv_re_13);
  this.setCheckDate('pv_re_14', s.pv_re_14);
  this.setCheckDate('pv_im_11', s.pv_im_11);
  this.setCheckDate('pv_im_12', s.pv_im_12);
  this.setCheckDate('pv_im_13', s.pv_im_13);
  this.setCheckDate('pv_im_14', s.pv_im_14);
  this.setCheckDate('pv_io_21', s.pv_io_21);
  this.setCheckDate('pv_io_22', s.pv_io_22);
  this.setCheckDate('pv_io_23', s.pv_io_23);
  this.setCheckDate('pv_io_24', s.pv_io_24);
  this.setCheckDate('pv_re_21', s.pv_re_21);
  this.setCheckDate('pv_re_22', s.pv_re_22);
  this.setCheckDate('pv_re_23', s.pv_re_23);
  this.setCheckDate('pv_re_24', s.pv_re_24);
  this.setCheckDate('pv_im_21', s.pv_im_21);
  this.setCheckDate('pv_im_22', s.pv_im_22);
  this.setCheckDate('pv_im_23', s.pv_im_23);
  this.setCheckDate('pv_im_24', s.pv_im_24);
  this.setCheckDate('pv_io_31', s.pv_io_31);
  this.setCheckDate('pv_io_32', s.pv_io_32);
  this.setCheckDate('pv_io_33', s.pv_io_33);
  this.setCheckDate('pv_io_34', s.pv_io_34);
  this.setCheckDate('pv_re_31', s.pv_re_31);
  this.setCheckDate('pv_re_32', s.pv_re_32);
  this.setCheckDate('pv_re_33', s.pv_re_33);
  this.setCheckDate('pv_re_34', s.pv_re_34);
  this.setCheckDate('pv_im_31', s.pv_im_31);
  this.setCheckDate('pv_im_32', s.pv_im_32);
  this.setCheckDate('pv_im_33', s.pv_im_33);
  this.setCheckDate('pv_im_34', s.pv_im_34);
  setVal('#pv_note', s.pv_note);

  // Carica specialità multiple
  this.loadSpecialita(s.specialita || []);

  this.setPair('#ev_ce1', s.ev_ce1);
  this.setPair('#ev_ce2', s.ev_ce2);
  this.setPair('#ev_ce3', s.ev_ce3);
  this.setPair('#ev_ce4', s.ev_ce4);
  this.setPair('#ev_ccp', s.ev_ccp);
  this.setPair('#ev_tc1', s.ev_tc1);
  this.setPair('#ev_tc2', s.ev_tc2);
  this.setPair('#ev_tc3', s.ev_tc3);
  this.setPair('#ev_tc4', s.ev_tc4);
  this.setPair('#ev_jam', s.ev_jam);
  setVal('#ev_note', s.ev_note);

  setVal('#doc_quota1', this.toYyyyMmDd(s.doc_quota1));
  setVal('#doc_quota2', this.toYyyyMmDd(s.doc_quota2));
  setVal('#doc_quota3', this.toYyyyMmDd(s.doc_quota3));
  setVal('#doc_quota4', this.toYyyyMmDd(s.doc_quota4));
  setVal('#doc_iscr', this.toYyyyMmDd(s.doc_iscr));
  setVal('#doc_san', this.toYyyyMmDd(s.doc_san));
  setVal('#doc_priv', this.toYyyyMmDd(s.doc_priv));
  setVal('#doc_note', this.toYyyyMmDd(s.doc_note));

  const form = this.qs('#scoutForm');
  if (form && !form._bound) {
    form._bound = true;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentUser) { alert('Devi essere loggato per salvare.'); return; }
      const payload = this.collectForm();
      await DATA.updateScout(id, payload, this.currentUser);
      this.state = await DATA.loadAll();
      this.rebuildPresenceIndex();
      alert('Salvato');
    });
    this.qs('#btnAnnulla')?.addEventListener('click', () => history.back());
    
    // Gestione specialità multiple
    this.qs('#addSpecialitaBtn')?.addEventListener('click', () => this.addSpecialita());
  }
};

UI.loadSpecialita = function(specialitaArray) {
  const container = this.qs('#specialitaContainer');
  if (!container) return;
  container.innerHTML = '';
  specialitaArray.forEach((sp, index) => this.addSpecialita(sp, index));
};

UI.addSpecialita = function(data = null, index = null) {
  const container = this.qs('#specialitaContainer');
  if (!container) return;
  
  const realIndex = index !== null ? index : container.children.length;
  const spId = `sp_${realIndex}`;
  
  const div = document.createElement('div');
  div.className = 'bg-white p-4 rounded-lg border border-gray-200';
  div.innerHTML = `
    <div class="flex justify-between items-center mb-3">
      <h4 class="font-medium text-gray-700">Specialità ${realIndex + 1}</h4>
      <button type="button" class="removeSpecialitaBtn text-red-600 hover:text-red-800" data-index="${realIndex}">🗑️</button>
    </div>
    <div class="grid md:grid-cols-2 gap-4">
      <div><label class="block text-sm">Nome Specialità</label><input id="${spId}_nome" class="input" value="${data?.nome || ''}" /></div>
      <div class="md:col-span-2 grid grid-cols-2 gap-2">
        <label><input type="checkbox" id="${spId}_p1_chk" ${data?.p1?.done ? 'checked' : ''} /> Prova 1</label><input id="${spId}_p1_dt" type="date" class="input" value="${data?.p1?.data ? this.toYyyyMmDd(data.p1.data) : ''}" />
        <label><input type="checkbox" id="${spId}_p2_chk" ${data?.p2?.done ? 'checked' : ''} /> Prova 2</label><input id="${spId}_p2_dt" type="date" class="input" value="${data?.p2?.data ? this.toYyyyMmDd(data.p2.data) : ''}" />
        <label><input type="checkbox" id="${spId}_p3_chk" ${data?.p3?.done ? 'checked' : ''} /> Prova 3</label><input id="${spId}_p3_dt" type="date" class="input" value="${data?.p3?.data ? this.toYyyyMmDd(data.p3.data) : ''}" />
        <label><input type="checkbox" id="${spId}_cr_chk" ${data?.cr?.done ? 'checked' : ''} /> Prova CR</label><input id="${spId}_cr_dt" type="date" class="input" value="${data?.cr?.data ? this.toYyyyMmDd(data.cr.data) : ''}" />
      </div>
      <div class="md:col-span-2"><label class="block text-sm">Note</label><textarea id="${spId}_note" class="textarea">${data?.note || ''}</textarea></div>
    </div>
  `;
  container.appendChild(div);
  
  // Event listener per rimuovere
  div.querySelector('.removeSpecialitaBtn')?.addEventListener('click', () => {
    div.remove();
    this.renumberSpecialita();
  });
};

UI.renumberSpecialita = function() {
  const container = this.qs('#specialitaContainer');
  if (!container) return;
  Array.from(container.children).forEach((div, index) => {
    div.querySelector('h4').textContent = `Specialità ${index + 1}`;
    const btn = div.querySelector('.removeSpecialitaBtn');
    if (btn) btn.dataset.index = index;
  });
};

UI.collectSpecialita = function() {
  const container = this.qs('#specialitaContainer');
  if (!container) return [];
  
  return Array.from(container.children).map(div => {
    const spId = div.querySelector('input[id$="_nome"]')?.id.replace('_nome', '') || '';
    const get = (suffix) => this.qs(`#${spId}${suffix}`)?.value?.trim() || '';
    const getChk = (suffix) => !!this.qs(`#${spId}${suffix}`)?.checked;
    const cd = (suffix) => ({ done: getChk(suffix), data: get(suffix) || null });
    
    return {
      nome: get('_nome'),
      p1: cd('_p1'),
      p2: cd('_p2'),
      p3: cd('_p3'),
      cr: cd('_cr'),
      note: get('_note')
    };
  });
};

UI.setCheckDate = function(prefix, val) {
  const data = val?.data ? this.toYyyyMmDd(val.data) : this.toYyyyMmDd(val);
  const done = val?.done ?? (val && typeof val === 'object' ? false : !!val);
  const chk = this.qs(`#${prefix}_chk`);
  const dt = this.qs(`#${prefix}_dt`);
  if (chk) chk.checked = !!done;
  if (dt) dt.value = data || '';
};

UI.setPair = function(prefix, val) {
  const dt = this.qs(`${prefix}_dt`);
  const tx = this.qs(`${prefix}_tx`);
  if (dt) dt.value = this.toYyyyMmDd(val?.data || val) || '';
  if (tx) tx.value = val?.testo || '';
};

UI.toYyyyMmDd = function(x) {
  if (!x) return '';
  const d = this.toJsDate(x);
  return isNaN(d) ? '' : d.toISOString().split('T')[0];
};

UI.collectForm = function() {
  const get = (sel) => this.qs(sel)?.value?.trim() || '';
  const getNum = (sel) => this.qs(sel)?.value || '';
  const getChk = (sel) => !!this.qs(sel)?.checked;
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
    pv_vcp_cp: this.qs('input[name="pv_vcp_cp"]:checked')?.value || '',
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
    specialita: this.collectSpecialita(),
    ev_ce1: pair('#ev_ce1'), ev_ce2: pair('#ev_ce2'), ev_ce3: pair('#ev_ce3'), ev_ce4: pair('#ev_ce4'),
    ev_ccp: pair('#ev_ccp'), ev_tc1: pair('#ev_tc1'), ev_tc2: pair('#ev_tc2'), ev_tc3: pair('#ev_tc3'), ev_tc4: pair('#ev_tc4'),
    ev_jam: pair('#ev_jam'), ev_note: get('#ev_note'),
    pv_traccia1: cd('pv_traccia1'), pv_traccia2: cd('pv_traccia2'), pv_traccia3: cd('pv_traccia3'),
    doc_quota1: get('#doc_quota1') || null, doc_quota2: get('#doc_quota2') || null,
    doc_quota3: get('#doc_quota3') || null, doc_quota4: get('#doc_quota4') || null,
    doc_iscr: get('#doc_iscr') || null, doc_san: get('#doc_san') || null,
    doc_priv: get('#doc_priv') || null, doc_note: get('#doc_note'),
  };
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Scheda Esploratore caricata');
});
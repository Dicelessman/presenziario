// attivita.js - pagina dettaglio attività

UI.renderCurrentPage = function() {
  this.renderActivityPage();
};

UI.renderActivityPage = async function() {
  const params = new URLSearchParams(location.search);
  const activityId = params.get('id');
  if (!activityId) {
    const t = this.qs('#activityTitle');
    if (t) t.textContent = 'Attività — ID mancante';
    return;
  }

  if (!this.state.activities || this.state.activities.length === 0) {
    this.state = await DATA.loadAll();
    this.rebuildPresenceIndex();
  }

  const activity = (this.state.activities || []).find(a => a.id === activityId);
  if (!activity) {
    const t = this.qs('#activityTitle');
    if (t) t.textContent = 'Attività — non trovata';
    return;
  }

  // Header
  const d = this.toJsDate(activity.data);
  const ds = isNaN(d) ? '' : d.toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' });
  const titleEl = this.qs('#activityTitle');
  const metaEl = this.qs('#activityMeta');
  if (titleEl) titleEl.textContent = `${activity.tipo || 'Attività'}${activity.descrizione ? ' — ' + activity.descrizione : ''}`;
  if (metaEl) metaEl.textContent = `${ds}${activity.costo ? ` — Costo: €${activity.costo}` : ''}`;

  // Prepara indici
  const presenze = this.getDedupedPresences().filter(p => p.attivitaId === activityId);

  // Utility: format DOB
  const fmtDob = (s) => {
    const raw = s?.anag_dob;
    if (!raw) return '';
    const date = this.toJsDate(raw);
    if (isNaN(date)) return '';
    return date.toLocaleDateString('it-IT');
  };

  // Separa presenti/assenti
  const presenti = [];
  const assenti = [];
  const pagamenti = [];

  (this.state.scouts || []).forEach(s => {
    const p = presenze.find(x => x.esploratoreId === s.id);
    const nome = `${s.nome || ''} ${s.cognome || ''}`.trim();
    const dob = fmtDob(s);
    if (p && p.stato === 'Presente') {
      presenti.push({ nome, dob });
    } else if (p && p.stato === 'Assente') {
      assenti.push({ nome, dob });
    }
    if (p && p.pagato) {
      pagamenti.push({ nome, metodo: p.tipoPagamento || 'Pagato' });
    }
  });

  // Render liste e contatori
  const mkLi = (t) => `<li>${t}</li>`;
  const presentiList = this.qs('#presentiList');
  const assentiList = this.qs('#assentiList');
  const pagamentiList = this.qs('#pagamentiList');
  const presentiCount = this.qs('#presentiCount');
  const assentiCount = this.qs('#assentiCount');
  const pagamentiCount = this.qs('#pagamentiCount');

  if (presentiList) presentiList.innerHTML = presenti
    .sort((a,b)=>a.nome.localeCompare(b.nome))
    .map(x => mkLi(`${x.nome}${x.dob ? ' — ' + x.dob : ''}`)).join('');
  if (presentiCount) presentiCount.textContent = `${presenti.length} elementi`;

  if (assentiList) assentiList.innerHTML = assenti
    .sort((a,b)=>a.nome.localeCompare(b.nome))
    .map(x => mkLi(`${x.nome}${x.dob ? ' — ' + x.dob : ''}`)).join('');
  if (assentiCount) assentiCount.textContent = `${assenti.length} elementi`;

  if (pagamentiList) pagamentiList.innerHTML = pagamenti
    .sort((a,b)=>a.nome.localeCompare(b.nome))
    .map(x => mkLi(`${x.nome} — ${x.metodo}`)).join('');
  if (pagamentiCount) pagamentiCount.textContent = `${pagamenti.length} pagamenti`;

  // Bottoni copia
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copiato negli appunti');
    } catch (e) {
      console.error('Clipboard error:', e);
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Copiato negli appunti');
    }
  };

  const copyPresentiBtn = this.qs('#copyPresentiBtn');
  const copyAssentiBtn = this.qs('#copyAssentiBtn');
  const copyPagamentiBtn = this.qs('#copyPagamentiBtn');

  const joinLines = (arr, mapFn) => arr
    .sort((a,b)=>a.nome.localeCompare(b.nome))
    .map(mapFn)
    .join('\n');

  if (copyPresentiBtn && !copyPresentiBtn._bound) {
    copyPresentiBtn._bound = true;
    copyPresentiBtn.addEventListener('click', () => {
      const txt = joinLines(presenti, x => `${x.nome}${x.dob ? ' — ' + x.dob : ''}`);
      copy(txt);
    });
  }
  if (copyAssentiBtn && !copyAssentiBtn._bound) {
    copyAssentiBtn._bound = true;
    copyAssentiBtn.addEventListener('click', () => {
      const txt = joinLines(assenti, x => `${x.nome}${x.dob ? ' — ' + x.dob : ''}`);
      copy(txt);
    });
  }
  if (copyPagamentiBtn && !copyPagamentiBtn._bound) {
    copyPagamentiBtn._bound = true;
    copyPagamentiBtn.addEventListener('click', () => {
      const txt = joinLines(pagamenti, x => `${x.nome} — ${x.metodo}`);
      copy(txt);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Pagina Attività caricata');
});

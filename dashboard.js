// dashboard.js - Logica specifica per la pagina Dashboard

// Sovrascrive la funzione per il rendering della pagina corrente
UI.renderCurrentPage = function() {
  this.renderDashboardCharts();
  this.renderPaymentsPerActivity();
};

UI._charts = UI._charts || { scout: null, activity: null };

UI._destroyCharts = function() {
  try { if (this._charts.scout) { this._charts.scout.destroy(); this._charts.scout = null; } } catch {}
  try { if (this._charts.activity) { this._charts.activity.destroy(); this._charts.activity = null; } } catch {}
};

UI.renderDashboardCharts = function() {
  const scouts = this.state.scouts || [];
  const activities = this.state.activities || [];
  const presences = this.state.presences || [];

  const ctxScout = document.getElementById('scoutPresenceChart');
  const ctxActivity = document.getElementById('activityPresenceChart');
  if (!ctxScout || !ctxActivity) return;

  this._destroyCharts();

  // Dati per grafico Presenza per Esploratore (percentuale presenze sul totale attività)
  const dedup = presences;
  const scoutLabels = scouts.map(s => `${s.nome} ${s.cognome}`);
  const scoutPerc = scouts.map(s => {
    const presentCount = dedup.filter(p => p.esploratoreId === s.id && p.stato === 'Presente').length;
    return activities.length ? (presentCount / activities.length) * 100 : 0;
  });

  // Dati per grafico Presenze per Attività (conteggio presenti) ordinati per data
  const toDate = (v) => (v && v.toDate) ? v.toDate() : new Date(v);
  const sortedActivities = [...activities].sort((a, b) => toDate(a.data) - toDate(b.data));
  const actLabels = sortedActivities.map(a => {
    const d = toDate(a.data);
    const ds = isNaN(d) ? '' : d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
    return `${a.tipo}: ${a.descrizione || ''}\n${ds}`;
  });
  const actData = sortedActivities.map(a => dedup.filter(p => p.attivitaId === a.id && p.stato === 'Presente').length);

  // Datalabels
  const ChartDataLabels = window.ChartDataLabels;
  if (window.Chart && ChartDataLabels) {
    window.Chart.register(ChartDataLabels);
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 8, right: 12, bottom: 8, left: 12 } },
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#fff',
        formatter: v => v > 0 ? (typeof v === 'number' && v <= 100 ? v.toFixed(1) + '%' : v) : '',
        anchor: 'end', align: 'end', offset: -5, font: { weight: 'bold' }
      }
    },
    elements: { bar: { borderRadius: 4, maxBarThickness: 28 } }
  };

  // Grafico Scout
  this._charts.scout = new window.Chart(ctxScout.getContext('2d'), {
    type: 'bar',
    data: {
      labels: scoutLabels,
      datasets: [{ label: 'Presenza %', data: scoutPerc, backgroundColor: '#16a34a' }]
    },
    options: {
      ...commonOptions,
      indexAxis: 'y',
      scales: {
        x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
        y: { ticks: { autoSkip: false, maxTicksLimit: 20 } }
      }
    }
  });

  // Grafico Attività
  this._charts.activity = new window.Chart(ctxActivity.getContext('2d'), {
    type: 'bar',
    data: {
      labels: actLabels,
      datasets: [{ label: 'Presenze', data: actData, backgroundColor: '#16a34a' }]
    },
    options: {
      ...commonOptions,
      indexAxis: 'y',
      scales: {
        x: { beginAtZero: true, max: Math.max(1, scouts.length) },
        y: { ticks: { autoSkip: false, maxTicksLimit: 20 } }
      },
      plugins: {
        ...commonOptions.plugins,
        datalabels: {
          ...commonOptions.plugins.datalabels,
          formatter: v => v > 0 ? `${v} / ${scouts.length}` : ''
        }
      }
    }
  });
};


UI.renderPaymentsPerActivity = function() {
  const container = this.qs('#paymentsList');
  if (!container) return;
  const scouts = this.state.scouts || [];
  const activities = (this.state.activities || []).slice();
  const presences = this.getDedupedPresences();

  const toDate = (v) => (v && v.toDate) ? v.toDate() : new Date(v);
  activities.sort((a, b) => toDate(a.data) - toDate(b.data));

  const paidActivities = activities.filter(a => parseFloat(a.costo || '0') > 0);
  if (paidActivities.length === 0) {
    container.innerHTML = '<p class="text-gray-500">Nessuna attività con costo.</p>';
    return;
  }

  const rows = paidActivities.map(a => {
    const costo = parseFloat(a.costo || '0') || 0;
    const payers = scouts.map(s => {
      const p = presences.find(x => x.esploratoreId === s.id && x.attivitaId === a.id);
      const stato = p?.stato || 'NR';
      const eligibleForPayment = (stato !== 'Assente');
      return { scout: s, paid: !!p?.pagato, method: p?.tipoPagamento || null, stato, eligibleForPayment };
    });
    const whoPaid = payers.filter(x => x.paid);
    // Escludi gli assenti dall'incasso atteso e dalla lista dei non paganti
    const eligible = payers.filter(x => x.eligibleForPayment);
    const expected = costo * eligible.length;
    const whoNotPaid = eligible.filter(x => !x.paid);
    const collected = whoPaid.length * costo;
    const d = toDate(a.data);
    const ds = isNaN(d) ? '' : d.toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'2-digit' });

    const listPaid = whoPaid.map(x => `
      <li class="flex justify-between">
        <span>${x.scout.nome} ${x.scout.cognome}</span>
        <span class="text-sm text-gray-600">${x.method || ''}</span>
      </li>`).join('');
    const listNotPaid = whoNotPaid.map(x => `<li>${x.scout.nome} ${x.scout.cognome}</li>`).join('');

    return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="font-semibold text-gray-800">${a.tipo}${a.descrizione ? ' — ' + a.descrizione : ''}</p>
            <p class="text-sm text-gray-600">${ds} • Costo: € ${costo.toFixed(2)}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">Incasso atteso</p>
            <p class="text-lg font-semibold">€ ${(expected).toFixed(2)}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">Totale incassato</p>
            <p class="text-lg font-semibold">€ ${(collected).toFixed(2)}</p>
          </div>
        </div>
        <div class="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <h4 class="font-medium text-gray-700 mb-2">Hanno pagato (${whoPaid.length})</h4>
            <ul class="list-disc list-inside space-y-1">
              ${listPaid || '<li class="text-gray-500">Nessuno</li>'}
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-gray-700 mb-2">Non hanno pagato (${whoNotPaid.length})</h4>
            <ul class="list-disc list-inside space-y-1">
              ${listNotPaid || '<li class="text-gray-500">Nessuno</li>'}
            </ul>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = rows;
};




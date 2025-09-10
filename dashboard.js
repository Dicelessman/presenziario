// dashboard.js - Logica specifica per la pagina Dashboard

// Sovrascrive la funzione per il rendering della pagina corrente
UI.renderCurrentPage = function() {
  this.renderDashboardCharts();
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
  const dedup = presences; // presenze già non-normalizzate lato Firestore
  const scoutLabels = scouts.map(s => `${s.nome} ${s.cognome}`);
  const scoutPerc = scouts.map(s => {
    const presentCount = dedup.filter(p => p.esploratoreId === s.id && p.stato === 'Presente').length;
    return activities.length ? (presentCount / activities.length) * 100 : 0;
  });

  // Dati per grafico Presenze per Attività (conteggio presenti)
  const actLabels = activities.map(a => {
    const d = a.data && a.data.toDate ? a.data.toDate() : new Date(a.data);
    const ds = isNaN(d) ? '' : d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
    return `${a.tipo}: ${a.descrizione || ''}\n${ds}`;
  });
  const actData = activities.map(a => dedup.filter(p => p.attivitaId === a.id && p.stato === 'Presente').length);

  // Empty states: se non ci sono dati, mostra grafici vuoti coerenti
  const ChartDataLabels = window.ChartDataLabels;
  if (window.Chart && ChartDataLabels) {
    window.Chart.register(ChartDataLabels);
  }

  // Grafico Scout
  this._charts.scout = new window.Chart(ctxScout.getContext('2d'), {
    type: 'bar',
    data: {
      labels: scoutLabels,
      datasets: [{
        label: 'Presenza %',
        data: scoutPerc,
        backgroundColor: '#16a34a'
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          color: '#fff',
          formatter: v => v > 0 ? v.toFixed(1) + '%' : '',
          anchor: 'end', align: 'end', offset: -5, font: { weight: 'bold' }
        }
      }
    }
  });

  // Grafico Attività
  this._charts.activity = new window.Chart(ctxActivity.getContext('2d'), {
    type: 'bar',
    data: {
      labels: actLabels,
      datasets: [{
        label: 'Presenze',
        data: actData,
        backgroundColor: '#16a34a'
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero: true, max: Math.max(1, scouts.length) + 1 }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          color: '#fff',
          formatter: v => v > 0 ? `${v} / ${scouts.length}` : '',
          anchor: 'end', align: 'end', offset: -5, font: { weight: 'bold' }
        }
      }
    }
  });
};




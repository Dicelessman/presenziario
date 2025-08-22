/**
 * Utility per la gestione delle date
 */
export class DateUtils {
  /**
   * Converte un valore in oggetto Date
   */
  static toJsDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    if (typeof value === 'number') return new Date(value);
    return new Date(value);
  }

  /**
   * Formatta una data per la visualizzazione
   */
  static formatDisplayDate(value) {
    const d = DateUtils.toJsDate(value);
    if (isNaN(d)) return '';
    
    const giorni = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    const giorno = giorni[d.getDay()];
    const data = d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
    
    return `${giorno} ${data}`;
  }

  /**
   * Formatta una data per input HTML
   */
  static formatForInput(value) {
    const d = DateUtils.toJsDate(value);
    if (isNaN(d)) return '';
    return d.toISOString().split('T')[0];
  }

  /**
   * Verifica se una data è oggi
   */
  static isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Verifica se una data è nel passato
   */
  static isPast(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  /**
   * Verifica se una data è nel futuro
   */
  static isFuture(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }

  /**
   * Ottiene il nome del giorno della settimana
   */
  static getDayName(date) {
    const giorni = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    return giorni[date.getDay()];
  }

  /**
   * Ottiene il nome del mese
   */
  static getMonthName(date) {
    const mesi = [
      'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
      'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
    ];
    return mesi[date.getMonth()];
  }

  /**
   * Formatta un timestamp per i log
   */
  static formatTimestamp(timestamp) {
    if (!timestamp) return 'Data non disponibile';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('it-IT');
  }

  /**
   * Calcola la differenza in giorni tra due date
   */
  static daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // ore * minuti * secondi * millisecondi
    const diffTime = Math.abs(date2 - date1);
    return Math.round(diffTime / oneDay);
  }

  /**
   * Ottiene la data di inizio settimana (lunedì)
   */
  static getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Aggiusta per lunedì
    return new Date(d.setDate(diff));
  }

  /**
   * Ottiene la data di fine settimana (domenica)
   */
  static getWeekEnd(date) {
    const weekStart = DateUtils.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  }
}

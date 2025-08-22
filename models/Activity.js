/**
 * Modello Activity - Gestisce i dati e la logica di business per le attività
 */
export class Activity {
  constructor(data = {}) {
    this.id = data.id || '';
    this.tipo = data.tipo || '';
    this.data = data.data ? new Date(data.data) : new Date();
    this.descrizione = data.descrizione || '';
    this.costo = data.costo || '0';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Tipi di attività disponibili
   */
  static get TIPI() {
    return {
      RIUNIONE: 'Riunione',
      ATTIVITA_LUNGA: 'Attività lunga',
      USCITA: 'Uscita',
      CAMPO: 'Campo'
    };
  }

  /**
   * Valida i dati dell'attività
   */
  validate() {
    const errors = [];
    
    if (!this.tipo || this.tipo.trim().length === 0) {
      errors.push('Il tipo di attività è obbligatorio');
    }
    
    if (!Object.values(Activity.TIPI).includes(this.tipo)) {
      errors.push('Il tipo di attività non è valido');
    }
    
    if (!this.data || isNaN(this.data.getTime())) {
      errors.push('La data è obbligatoria e deve essere valida');
    }
    
    if (!this.descrizione || this.descrizione.trim().length === 0) {
      errors.push('La descrizione è obbligatoria');
    }
    
    if (this.descrizione && this.descrizione.trim().length < 3) {
      errors.push('La descrizione deve essere di almeno 3 caratteri');
    }
    
    if (this.costo && isNaN(parseFloat(this.costo))) {
      errors.push('Il costo deve essere un numero valido');
    }
    
    if (this.costo && parseFloat(this.costo) < 0) {
      errors.push('Il costo non può essere negativo');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Verifica se l'attività è nel passato
   */
  get isPast() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.data < today;
  }

  /**
   * Verifica se l'attività è oggi
   */
  get isToday() {
    const today = new Date();
    return this.data.toDateString() === today.toDateString();
  }

  /**
   * Verifica se l'attività è nel futuro
   */
  get isFuture() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.data > today;
  }

  /**
   * Verifica se l'attività ha un costo
   */
  get hasCost() {
    return parseFloat(this.costo) > 0;
  }

  /**
   * Ottiene il costo come numero
   */
  get costValue() {
    return parseFloat(this.costo) || 0;
  }

  /**
   * Formatta la data per la visualizzazione
   */
  get formattedDate() {
    const giorni = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    const giorno = giorni[this.data.getDay()];
    const data = this.data.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
    
    return `${giorno} ${data}`;
  }

  /**
   * Crea un nuovo Activity da dati Firestore
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new Activity({
      id: doc.id,
      tipo: data.tipo,
      data: data.data?.toDate() || new Date(),
      descrizione: data.descrizione,
      costo: data.costo || '0',
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    });
  }

  /**
   * Converte il modello in oggetto per Firestore
   */
  toFirestore() {
    return {
      tipo: this.tipo.trim(),
      data: this.data,
      descrizione: this.descrizione.trim(),
      costo: this.costo.toString(),
      createdAt: this.createdAt,
      updatedAt: new Date()
    };
  }

  /**
   * Crea una nuova Activity da dati di input
   */
  static create(inputData) {
    const activity = new Activity(inputData);
    const validation = activity.validate();
    
    if (!validation.isValid) {
      throw new Error(`Dati attività non validi: ${validation.errors.join(', ')}`);
    }
    
    return activity;
  }

  /**
   * Aggiorna i dati dell'attività
   */
  update(newData) {
    const oldData = { ...this };
    
    if (newData.tipo !== undefined) this.tipo = newData.tipo;
    if (newData.data !== undefined) this.data = new Date(newData.data);
    if (newData.descrizione !== undefined) this.descrizione = newData.descrizione;
    if (newData.costo !== undefined) this.costo = newData.costo;
    
    this.updatedAt = new Date();
    
    const validation = this.validate();
    if (!validation.isValid) {
      // Ripristina i dati originali
      Object.assign(this, oldData);
      throw new Error(`Dati attività non validi: ${validation.errors.join(', ')}`);
    }
    
    return this;
  }

  /**
   * Clona l'attività
   */
  clone() {
    return new Activity({
      id: this.id,
      tipo: this.tipo,
      data: this.data,
      descrizione: this.descrizione,
      costo: this.costo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    });
  }

  /**
   * Confronta con un'altra attività
   */
  equals(other) {
    if (!other || !(other instanceof Activity)) return false;
    return this.id === other.id;
  }

  /**
   * Rappresentazione stringa dell'attività
   */
  toString() {
    return `Activity(${this.id}: ${this.tipo} - ${this.formattedDate})`;
  }
}

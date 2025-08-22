/**
 * Modello Presence - Gestisce i dati e la logica di business per le presenze
 */
export class Presence {
  constructor(data = {}) {
    this.id = data.id || '';
    this.esploratoreId = data.esploratoreId || '';
    this.attivitaId = data.attivitaId || '';
    this.stato = data.stato || 'NR';
    this.pagato = data.pagato || false;
    this.tipoPagamento = data.tipoPagamento || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Stati di presenza disponibili
   */
  static get STATI() {
    return {
      PRESENTE: 'Presente',
      ASSENTE: 'Assente',
      NON_RILEVATO: 'NR'
    };
  }

  /**
   * Tipi di pagamento disponibili
   */
  static get TIPI_PAGAMENTO() {
    return {
      CONTANTI: 'Contanti',
      SATISPAY: 'Satispay',
      BONIFICO: 'Bonifico'
    };
  }

  /**
   * Genera l'ID univoco per la presenza
   */
  static generateId(esploratoreId, attivitaId) {
    return `${esploratoreId}_${attivitaId}`;
  }

  /**
   * Valida i dati della presenza
   */
  validate() {
    const errors = [];
    
    if (!this.esploratoreId || this.esploratoreId.trim().length === 0) {
      errors.push('L\'ID dell\'esploratore è obbligatorio');
    }
    
    if (!this.attivitaId || this.attivitaId.trim().length === 0) {
      errors.push('L\'ID dell\'attività è obbligatorio');
    }
    
    if (!Object.values(Presence.STATI).includes(this.stato)) {
      errors.push('Lo stato di presenza non è valido');
    }
    
    if (this.pagato && !this.tipoPagamento) {
      errors.push('Il tipo di pagamento è obbligatorio se la presenza è pagata');
    }
    
    if (this.tipoPagamento && !Object.values(Presence.TIPI_PAGAMENTO).includes(this.tipoPagamento)) {
      errors.push('Il tipo di pagamento non è valido');
    }
    
    if (!this.pagato && this.tipoPagamento) {
      errors.push('Il tipo di pagamento non può essere impostato se la presenza non è pagata');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Verifica se la presenza è presente
   */
  get isPresent() {
    return this.stato === Presence.STATI.PRESENTE;
  }

  /**
   * Verifica se la presenza è assente
   */
  get isAbsent() {
    return this.stato === Presence.STATI.ASSENTE;
  }

  /**
   * Verifica se la presenza non è rilevata
   */
  get isNotRecorded() {
    return this.stato === Presence.STATI.NON_RILEVATO;
  }

  /**
   * Verifica se la presenza è pagata
   */
  get isPaid() {
    return this.pagato && this.tipoPagamento;
  }

  /**
   * Ottiene il testo dello stato per la visualizzazione
   */
  get statoText() {
    const stati = {
      [Presence.STATI.PRESENTE]: 'Presente',
      [Presence.STATI.ASSENTE]: 'Assente',
      [Presence.STATI.NON_RILEVATO]: 'Non Rilevato'
    };
    return stati[this.stato] || this.stato;
  }

  /**
   * Ottiene il testo del pagamento per la visualizzazione
   */
  get pagamentoText() {
    if (!this.pagato) return 'Non Pagato';
    return this.tipoPagamento || 'Pagato';
  }

  /**
   * Crea un nuovo Presence da dati Firestore
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new Presence({
      id: doc.id,
      esploratoreId: data.esploratoreId,
      attivitaId: data.attivitaId,
      stato: data.stato || 'NR',
      pagato: data.pagato || false,
      tipoPagamento: data.tipoPagamento || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    });
  }

  /**
   * Converte il modello in oggetto per Firestore
   */
  toFirestore() {
    return {
      esploratoreId: this.esploratoreId,
      attivitaId: this.attivitaId,
      stato: this.stato,
      pagato: this.pagato,
      tipoPagamento: this.tipoPagamento,
      createdAt: this.createdAt,
      updatedAt: new Date()
    };
  }

  /**
   * Crea una nuova Presence da dati di input
   */
  static create(inputData) {
    const presence = new Presence(inputData);
    const validation = presence.validate();
    
    if (!validation.isValid) {
      throw new Error(`Dati presenza non validi: ${validation.errors.join(', ')}`);
    }
    
    return presence;
  }

  /**
   * Aggiorna i dati della presenza
   */
  update(newData) {
    const oldData = { ...this };
    
    if (newData.stato !== undefined) this.stato = newData.stato;
    if (newData.pagato !== undefined) this.pagato = newData.pagato;
    if (newData.tipoPagamento !== undefined) this.tipoPagamento = newData.tipoPagamento;
    
    this.updatedAt = new Date();
    
    const validation = this.validate();
    if (!validation.isValid) {
      // Ripristina i dati originali
      Object.assign(this, oldData);
      throw new Error(`Dati presenza non validi: ${validation.errors.join(', ')}`);
    }
    
    return this;
  }

  /**
   * Aggiorna lo stato di presenza
   */
  setStato(stato) {
    if (!Object.values(Presence.STATI).includes(stato)) {
      throw new Error(`Stato non valido: ${stato}`);
    }
    
    this.stato = stato;
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Aggiorna il pagamento
   */
  setPagamento(pagato, tipoPagamento = null) {
    this.pagato = pagato;
    this.tipoPagamento = pagato ? tipoPagamento : null;
    this.updatedAt = new Date();
    
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Dati pagamento non validi: ${validation.errors.join(', ')}`);
    }
    
    return this;
  }

  /**
   * Clona la presenza
   */
  clone() {
    return new Presence({
      id: this.id,
      esploratoreId: this.esploratoreId,
      attivitaId: this.attivitaId,
      stato: this.stato,
      pagato: this.pagato,
      tipoPagamento: this.tipoPagamento,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    });
  }

  /**
   * Confronta con un'altra presenza
   */
  equals(other) {
    if (!other || !(other instanceof Presence)) return false;
    return this.id === other.id;
  }

  /**
   * Rappresentazione stringa della presenza
   */
  toString() {
    return `Presence(${this.id}: ${this.stato} - ${this.pagato ? 'Pagato' : 'Non Pagato'})`;
  }
}

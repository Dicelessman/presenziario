/**
 * Modello Scout - Gestisce i dati e la logica di business per gli esploratori
 */
export class Scout {
  constructor(data = {}) {
    this.id = data.id || '';
    this.nome = data.nome || '';
    this.cognome = data.cognome || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Nome completo dell'esploratore
   */
  get fullName() {
    return `${this.nome} ${this.cognome}`.trim();
  }

  /**
   * Nome completo per ordinamento alfabetico
   */
  get sortName() {
    return `${this.cognome} ${this.nome}`.toLowerCase();
  }

  /**
   * Valida i dati dell'esploratore
   */
  validate() {
    const errors = [];
    
    if (!this.nome || this.nome.trim().length === 0) {
      errors.push('Il nome è obbligatorio');
    }
    
    if (!this.cognome || this.cognome.trim().length === 0) {
      errors.push('Il cognome è obbligatorio');
    }
    
    if (this.nome && this.nome.trim().length < 2) {
      errors.push('Il nome deve essere di almeno 2 caratteri');
    }
    
    if (this.cognome && this.cognome.trim().length < 2) {
      errors.push('Il cognome deve essere di almeno 2 caratteri');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Crea un nuovo Scout da dati Firestore
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new Scout({
      id: doc.id,
      nome: data.nome,
      cognome: data.cognome,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    });
  }

  /**
   * Converte il modello in oggetto per Firestore
   */
  toFirestore() {
    return {
      nome: this.nome.trim(),
      cognome: this.cognome.trim(),
      createdAt: this.createdAt,
      updatedAt: new Date()
    };
  }

  /**
   * Crea un nuovo Scout da dati di input
   */
  static create(inputData) {
    const scout = new Scout(inputData);
    const validation = scout.validate();
    
    if (!validation.isValid) {
      throw new Error(`Dati scout non validi: ${validation.errors.join(', ')}`);
    }
    
    return scout;
  }

  /**
   * Aggiorna i dati dell'esploratore
   */
  update(newData) {
    const oldData = { ...this };
    
    if (newData.nome !== undefined) this.nome = newData.nome;
    if (newData.cognome !== undefined) this.cognome = newData.cognome;
    
    this.updatedAt = new Date();
    
    const validation = this.validate();
    if (!validation.isValid) {
      // Ripristina i dati originali
      Object.assign(this, oldData);
      throw new Error(`Dati scout non validi: ${validation.errors.join(', ')}`);
    }
    
    return this;
  }

  /**
   * Clona l'esploratore
   */
  clone() {
    return new Scout({
      id: this.id,
      nome: this.nome,
      cognome: this.cognome,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    });
  }

  /**
   * Confronta con un altro esploratore
   */
  equals(other) {
    if (!other || !(other instanceof Scout)) return false;
    return this.id === other.id;
  }

  /**
   * Rappresentazione stringa dell'esploratore
   */
  toString() {
    return `Scout(${this.id}: ${this.fullName})`;
  }
}

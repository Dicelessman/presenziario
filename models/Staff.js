/**
 * Modello Staff - Gestisce i dati e la logica di business per i membri dello staff
 */
export class Staff {
  constructor(data = {}) {
    this.id = data.id || '';
    this.nome = data.nome || '';
    this.cognome = data.cognome || '';
    this.email = data.email || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Nome completo del membro staff
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
   * Valida i dati del membro staff
   */
  validate() {
    const errors = [];
    
    if (!this.nome || this.nome.trim().length === 0) {
      errors.push('Il nome è obbligatorio');
    }
    
    if (!this.cognome || this.cognome.trim().length === 0) {
      errors.push('Il cognome è obbligatorio');
    }
    
    if (!this.email || this.email.trim().length === 0) {
      errors.push('L\'email è obbligatoria');
    }
    
    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('L\'email non è in formato valido');
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
   * Valida formato email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Crea un nuovo Staff da dati Firestore
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new Staff({
      id: doc.id,
      nome: data.nome,
      cognome: data.cognome,
      email: data.email,
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
      email: this.email.trim().toLowerCase(),
      createdAt: this.createdAt,
      updatedAt: new Date()
    };
  }

  /**
   * Crea un nuovo Staff da dati di input
   */
  static create(inputData) {
    const staff = new Staff(inputData);
    const validation = staff.validate();
    
    if (!validation.isValid) {
      throw new Error(`Dati staff non validi: ${validation.errors.join(', ')}`);
    }
    
    return staff;
  }

  /**
   * Aggiorna i dati del membro staff
   */
  update(newData) {
    const oldData = { ...this };
    
    if (newData.nome !== undefined) this.nome = newData.nome;
    if (newData.cognome !== undefined) this.cognome = newData.cognome;
    if (newData.email !== undefined) this.email = newData.email;
    
    this.updatedAt = new Date();
    
    const validation = this.validate();
    if (!validation.isValid) {
      // Ripristina i dati originali
      Object.assign(this, oldData);
      throw new Error(`Dati staff non validi: ${validation.errors.join(', ')}`);
    }
    
    return this;
  }

  /**
   * Verifica se l'email corrisponde a questo membro staff
   */
  matchesEmail(email) {
    return this.email.toLowerCase() === email.toLowerCase();
  }

  /**
   * Clona il membro staff
   */
  clone() {
    return new Staff({
      id: this.id,
      nome: this.nome,
      cognome: this.cognome,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    });
  }

  /**
   * Confronta con un altro membro staff
   */
  equals(other) {
    if (!other || !(other instanceof Staff)) return false;
    return this.id === other.id;
  }

  /**
   * Rappresentazione stringa del membro staff
   */
  toString() {
    return `Staff(${this.id}: ${this.fullName} - ${this.email})`;
  }
}

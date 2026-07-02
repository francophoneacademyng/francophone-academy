/**
 * AcademicProgram.js
 * Modele de domaine pour un programme academique.
 */

export class AcademicProgram {
  constructor(data = {}) {
    this.id = data.id || null;
    this.code = data.code || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.language = data.language || 'fr';
    this.status = data.status || 'active';
    this.levelIds = data.levelIds || [];
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new AcademicProgram({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }
}

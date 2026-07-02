/**
 * AcademicModule.js
 * Modele de domaine pour un module academique.
 */

export class AcademicModule {
  constructor(data = {}) {
    this.id = data.id || null;
    this.programId = data.programId || '';
    this.levelId = data.levelId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.order = data.order || 0;
    this.objectives = data.objectives || [];
    this.unitIds = data.unitIds || [];
    this.durationHours = data.durationHours || 0;
    this.status = data.status || 'draft';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new AcademicModule({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }
}

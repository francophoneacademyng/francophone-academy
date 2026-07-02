/**
 * AcademicUnit.js
 * Modele de domaine pour une unite academique.
 */

export class AcademicUnit {
  constructor(data = {}) {
    this.id = data.id || null;
    this.programId = data.programId || '';
    this.levelId = data.levelId || '';
    this.moduleId = data.moduleId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.order = data.order || 0;
    this.learningOutcomes = data.learningOutcomes || [];
    this.lessonIds = data.lessonIds || [];
    this.estimatedHours = data.estimatedHours || 0;
    this.status = data.status || 'draft';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new AcademicUnit({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }
}

/**
 * AcademicLiveClass.js
 * Modele de domaine pour une classe en direct academique.
 */

export class AcademicLiveClass {
  constructor(data = {}) {
    this.id = data.id || null;
    this.programId = data.programId || '';
    this.levelId = data.levelId || '';
    this.moduleId = data.moduleId || '';
    this.unitId = data.unitId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.format = data.format || 'group';
    this.durationMinutes = data.durationMinutes || 60;
    this.frequency = data.frequency || 'monthly';
    this.recommendedFor = data.recommendedFor || [];
    this.objectives = data.objectives || [];
    this.attendanceRequired = data.attendanceRequired || false;
    this.status = data.status || 'draft';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new AcademicLiveClass({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }
}

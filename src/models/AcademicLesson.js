/**
 * AcademicLesson.js
 * Modele de domaine pour une lecon academique.
 */

export class AcademicLesson {
  constructor(data = {}) {
    this.id = data.id || null;
    this.programId = data.programId || '';
    this.levelId = data.levelId || '';
    this.moduleId = data.moduleId || '';
    this.unitId = data.unitId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.order = data.order || 0;
    this.type = data.type || 'guided';
    this.durationMinutes = data.durationMinutes || 0;
    this.objectives = data.objectives || [];
    this.exerciseIds = data.exerciseIds || [];
    this.quizId = data.quizId || '';
    this.assignmentId = data.assignmentId || '';
    this.liveClassId = data.liveClassId || '';
    this.status = data.status || 'draft';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new AcademicLesson({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }
}

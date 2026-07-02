/**
 * AcademicExercise.js
 * Modele de domaine pour un exercice academique.
 */

export class AcademicExercise {
  constructor(data = {}) {
    this.id = data.id || null;
    this.programId = data.programId || '';
    this.levelId = data.levelId || '';
    this.moduleId = data.moduleId || '';
    this.unitId = data.unitId || '';
    this.lessonId = data.lessonId || '';
    this.title = data.title || '';
    this.instructions = data.instructions || '';
    this.exerciseType = data.exerciseType || 'practice';
    this.skills = data.skills || [];
    this.difficulty = data.difficulty || 1;
    this.estimatedMinutes = data.estimatedMinutes || 0;
    this.maxScore = data.maxScore || 100;
    this.status = data.status || 'draft';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new AcademicExercise({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }
}

/**
 * AcademicQuiz.js
 * Modele de domaine pour un quiz academique.
 */

export class AcademicQuiz {
  constructor(data = {}) {
    this.id = data.id || null;
    this.programId = data.programId || '';
    this.levelId = data.levelId || '';
    this.moduleId = data.moduleId || '';
    this.unitId = data.unitId || '';
    this.lessonId = data.lessonId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.questionCount = data.questionCount || 0;
    this.timeLimitMinutes = data.timeLimitMinutes || 0;
    this.passingScore = data.passingScore || 70;
    this.skills = data.skills || [];
    this.status = data.status || 'draft';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new AcademicQuiz({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }
}

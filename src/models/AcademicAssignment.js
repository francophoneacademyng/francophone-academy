/**
 * AcademicAssignment.js
 * Modele de domaine pour un devoir academique.
 */

export class AcademicAssignment {
  constructor(data = {}) {
    this.id = data.id || null;
    this.programId = data.programId || '';
    this.levelId = data.levelId || '';
    this.moduleId = data.moduleId || '';
    this.unitId = data.unitId || '';
    this.lessonId = data.lessonId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.instructions = data.instructions || '';
    this.submissionType = data.submissionType || 'text';
    this.maxScore = data.maxScore || 100;
    this.rubric = data.rubric || [];
    this.dueInDays = data.dueInDays || 7;
    this.status = data.status || 'draft';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new AcademicAssignment({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }
}

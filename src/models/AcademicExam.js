/**
 * AcademicExam.js
 * Modele de domaine pour un examen academique.
 */

export class AcademicExam {
  constructor(data = {}) {
    this.id = data.id || null;
    this.programId = data.programId || '';
    this.levelId = data.levelId || '';
    this.title = data.title || '';
    this.examType = data.examType || 'final';
    this.durationMinutes = data.durationMinutes || 120;
    this.components = data.components || [];
    this.passingScore = data.passingScore || 70;
    this.weighting = data.weighting || {
      quiz: 30,
      assignment: 30,
      oral: 20,
      writtenExam: 20
    };
    this.prerequisites = data.prerequisites || [];
    this.status = data.status || 'draft';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new AcademicExam({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }
}

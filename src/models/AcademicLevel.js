/**
 * AcademicLevel.js
 * Modele de domaine pour un niveau academique.
 */

export class AcademicLevel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.programId = data.programId || '';
    this.code = data.code || '';
    this.title = data.title || '';
    this.order = data.order || 0;
    this.objectives = data.objectives || [];
    this.duration = data.duration || {
      weeks: 0,
      guidedHours: 0,
      selfStudyHours: 0
    };
    this.monthlyStructure = data.monthlyStructure || [];
    this.learningOutcomes = data.learningOutcomes || [];
    this.requiredSkills = data.requiredSkills || [];
    this.recommendedLiveClasses = data.recommendedLiveClasses || [];
    this.certificateRequirements = data.certificateRequirements || {
      minAttendanceRate: 0,
      minQuizScore: 0,
      minAssignmentScore: 0,
      examRequired: true,
      completionRate: 100
    };
    this.status = data.status || 'active';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new AcademicLevel({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }
}

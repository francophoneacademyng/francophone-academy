/**
 * AcademicCertificate.js
 * Modele de domaine pour un certificat academique.
 */

export class AcademicCertificate {
  constructor(data = {}) {
    this.id = data.id || null;
    this.programId = data.programId || '';
    this.levelId = data.levelId || '';
    this.title = data.title || '';
    this.templateVersion = data.templateVersion || 'v1';
    this.requirements = data.requirements || {
      completionRate: 100,
      minQuizScore: 70,
      minAssignmentScore: 70,
      examPassed: true,
      minAttendanceRate: 80
    };
    this.validityMonths = data.validityMonths || 0;
    this.issuedBy = data.issuedBy || 'Francophone Academy';
    this.status = data.status || 'draft';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new AcademicCertificate({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }
}

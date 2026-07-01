/**
 * LiveClass.js
 * Modèle pour les cours en direct (Live Classes)
 */

export class LiveClass {
  constructor(
    id = null,
    lessonId = null,
    teacherId = null,
    courseId = null,
    level = 'A1',
    title = '',
    description = '',
    meetingProvider = 'zoom', // zoom | google_meet | teams
    meetingUrl = '',
    meetingId = '',
    meetingPassword = '',
    startDate = null,
    endDate = null,
    duration = 60, // minutes
    status = 'scheduled', // scheduled | in_progress | completed | cancelled
    recordingUrl = null,
    documents = [],
    attendance = [],
    maxParticipants = 100,
    createdBy = null,
    createdAt = null,
    updatedAt = null
  ) {
    this.id = id;
    this.lessonId = lessonId;
    this.teacherId = teacherId;
    this.courseId = courseId;
    this.level = level;
    this.title = title;
    this.description = description;
    this.meetingProvider = meetingProvider;
    this.meetingUrl = meetingUrl;
    this.meetingId = meetingId;
    this.meetingPassword = meetingPassword;
    this.startDate = startDate;
    this.endDate = endDate;
    this.duration = duration;
    this.status = status;
    this.recordingUrl = recordingUrl;
    this.documents = documents;
    this.attendance = attendance;
    this.maxParticipants = maxParticipants;
    this.createdBy = createdBy;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  /**
   * Crée une instance depuis les données Firestore.
   */
  static fromFirestore(id, data) {
    return new LiveClass(
      id,
      data.lessonId || null,
      data.teacherId || null,
      data.courseId || null,
      data.level || 'A1',
      data.title || '',
      data.description || '',
      data.meetingProvider || 'zoom',
      data.meetingUrl || '',
      data.meetingId || '',
      data.meetingPassword || '',
      data.startDate || null,
      data.endDate || null,
      data.duration || 60,
      data.status || 'scheduled',
      data.recordingUrl || null,
      data.documents || [],
      data.attendance || [],
      data.maxParticipants || 100,
      data.createdBy || null,
      data.createdAt || new Date().toISOString(),
      data.updatedAt || new Date().toISOString()
    );
  }

  /**
   * Convertit l'instance en objet Firestore.
   */
  toFirestore() {
    return {
      lessonId: this.lessonId,
      teacherId: this.teacherId,
      courseId: this.courseId,
      level: this.level,
      title: this.title,
      description: this.description,
      meetingProvider: this.meetingProvider,
      meetingUrl: this.meetingUrl,
      meetingId: this.meetingId,
      meetingPassword: this.meetingPassword,
      startDate: this.startDate,
      endDate: this.endDate,
      duration: this.duration,
      status: this.status,
      recordingUrl: this.recordingUrl,
      documents: this.documents,
      attendance: this.attendance,
      maxParticipants: this.maxParticipants,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Valide les données obligatoires.
   */
  validate() {
    if (!this.title || this.title.trim() === '') return 'Le titre est obligatoire.';
    if (!this.teacherId) return 'Le professeur est obligatoire.';
    if (!this.courseId) return 'Le cours est obligatoire.';
    if (!this.startDate) return 'La date de début est obligatoire.';
    if (!this.meetingUrl) return 'L\'URL de la réunion est obligatoire.';
    if (this.duration <= 0 || this.duration > 480) return 'La durée doit être entre 1 et 480 minutes.';
    return null;
  }

  /**
   * Vérifie si le cours est en cours.
   */
  isLive() {
    const now = new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate || this.startDate);
    return now >= start && now <= end && this.status === 'in_progress';
  }

  /**
   * Vérifie si le cours a commencé.
   */
  hasStarted() {
    const now = new Date();
    const start = new Date(this.startDate);
    return now >= start;
  }

  /**
   * Retourne les participants présents.
   */
  getAttendanceCount() {
    return this.attendance ? this.attendance.filter(a => a.joined_at).length : 0;
  }

  /**
   * Vérifie si un étudiant a participé.
   */
  hasStudentAttended(studentId) {
    return this.attendance && this.attendance.some(a => a.studentId === studentId && a.joined_at);
  }
}

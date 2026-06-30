/**
 * Enrollment.js
 * Modele de domaine pour une inscription a un cours.
 */

export class Enrollment {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || '';
    this.courseId = data.courseId || '';
    this.courseTitle = data.courseTitle || '';
    this.status = data.status || 'active'; // active | completed | paused
    this.progress = data.progress || 0; // 0-100
    this.completedLessons = data.completedLessons || [];
    this.currentModuleId = data.currentModuleId || '';
    this.currentLessonId = data.currentLessonId || '';
    this.startedAt = data.startedAt || null;
    this.updatedAt = data.updatedAt || null;
    this.completedAt = data.completedAt || null;
    this.lastAccessedAt = data.lastAccessedAt || null;
    this.totalStudyTime = data.totalStudyTime || 0; // minutes
  }

  static fromFirestore(id, docData) {
    return new Enrollment({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }

  static create(userId, course) {
    const now = new Date().toISOString();
    return new Enrollment({
      userId,
      courseId: course.id,
      courseTitle: course.title,
      status: 'active',
      progress: 0,
      completedLessons: [],
      startedAt: now,
      updatedAt: now,
      lastAccessedAt: now
    });
  }

  /**
   * Marque une lecon comme terminee et recalcule la progression.
   * @param {string} lessonId
   * @param {number} totalLessons
   */
  completeLesson(lessonId, totalLessons) {
    if (!this.completedLessons.includes(lessonId)) {
      this.completedLessons.push(lessonId);
    }
    if (totalLessons > 0) {
      this.progress = Math.min(
        Math.round((this.completedLessons.length / totalLessons) * 100),
        100
      );
    }
    if (this.progress >= 100) {
      this.status = 'completed';
      this.completedAt = new Date().toISOString();
    }
    this.updatedAt = new Date().toISOString();
  }

  isCompleted() {
    return this.status === 'completed';
  }
}

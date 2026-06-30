/**
 * ChatSession.js
 * Modele de domaine pour une session de conversation avec l'IA Tutor.
 */

export class ChatSession {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || '';
    this.title = data.title || 'Nouvelle conversation';
    this.courseId = data.courseId || '';
    this.courseTitle = data.courseTitle || '';
    this.moduleId = data.moduleId || '';
    this.moduleTitle = data.moduleTitle || '';
    this.lessonId = data.lessonId || '';
    this.lessonTitle = data.lessonTitle || '';
    this.cefrLevel = data.cefrLevel || 'A1';
    this.messageCount = data.messageCount || 0;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
    this.lastMessageAt = data.lastMessageAt || null;
    this.isActive = data.isActive !== false;
  }

  static fromFirestore(id, docData) {
    return new ChatSession({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }

  static create(userId, context = {}) {
    const now = new Date().toISOString();
    const title = context.lessonTitle
      ? `Tutor: ${context.lessonTitle}`
      : context.courseTitle
        ? `Tutor: ${context.courseTitle}`
        : 'Nouvelle conversation';
    return new ChatSession({
      userId,
      title,
      courseId: context.courseId || '',
      courseTitle: context.courseTitle || '',
      moduleId: context.moduleId || '',
      moduleTitle: context.moduleTitle || '',
      lessonId: context.lessonId || '',
      lessonTitle: context.lessonTitle || '',
      cefrLevel: context.cefrLevel || 'A1',
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now
    });
  }
}

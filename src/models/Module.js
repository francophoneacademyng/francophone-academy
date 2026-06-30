/**
 * Module.js
 * Modele de domaine pour un module (chapitre) d'un cours.
 */

export class Module {
  constructor(data = {}) {
    this.id = data.id || null;
    this.courseId = data.courseId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.order = data.order || 0;
    this.lessons = data.lessons || [];
    this.lessonCount = data.lessonCount || 0;
    this.duration = data.duration || 0;
    this.status = data.status || 'published';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new Module({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }
}

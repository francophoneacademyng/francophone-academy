/**
 * Course.js
 * Modele de domaine pour un cours.
 */

import { CEFR_LEVELS } from '../config/firebase.js';

/**
 * @class Course
 * Represente un cours dans le catalogue.
 */
export class Course {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.description = data.description || '';
    this.shortDescription = data.shortDescription || '';
    this.imageUrl = data.imageUrl || '';
    this.category = data.category || 'general'; // general | professional | delf | dalf | tcf | tef
    this.level = data.level || CEFR_LEVELS.A1;
    this.duration = data.duration || 0; // en minutes
    this.price = data.price || 0;
    this.currency = data.currency || 'EUR';
    this.modules = data.modules || [];
    this.moduleCount = data.moduleCount || 0;
    this.lessonCount = data.lessonCount || 0;
    this.quizCount = data.quizCount || 0;
    this.instructorId = data.instructorId || '';
    this.instructorName = data.instructorName || '';
    this.tags = data.tags || [];
    this.objectives = data.objectives || [];
    this.prerequisites = data.prerequisites || [];
    this.status = data.status || 'published'; // draft | published | archived
    this.language = data.language || 'fr';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
    this.publishedAt = data.publishedAt || null;
  }

  static fromFirestore(id, docData) {
    return new Course({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }

  getCategoryLabel() {
    const labels = {
      general: 'Francais General',
      professional: 'Francais Professionnel',
      delf: 'Preparation DELF',
      dalf: 'Preparation DALF',
      tcf: 'Preparation TCF',
      tef: 'Preparation TEF'
    };
    return labels[this.category] || this.category;
  }

  getFormattedDuration() {
    if (this.duration < 60) return `${this.duration} min`;
    const hours = Math.floor(this.duration / 60);
    const mins = this.duration % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
}

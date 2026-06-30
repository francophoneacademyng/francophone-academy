/**
 * Lesson.js
 * Modele de domaine pour une lecon.
 */

export class Lesson {
  constructor(data = {}) {
    this.id = data.id || null;
    this.courseId = data.courseId || '';
    this.moduleId = data.moduleId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.order = data.order || 0;
    this.type = data.type || 'theory'; // theory | exercise | video | audio | quiz | culture
    this.duration = data.duration || 0; // minutes
    this.content = data.content || []; // blocs de contenu
    this.vocabulary = data.vocabulary || [];
    this.grammar = data.grammar || [];
    this.resources = data.resources || [];
    this.objectives = data.objectives || [];
    this.hasQuiz = data.hasQuiz || false;
    this.quizId = data.quizId || '';
    this.status = data.status || 'published';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(id, docData) {
    return new Lesson({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }

  getTypeLabel() {
    const labels = {
      theory: 'Theorie',
      exercise: 'Exercice',
      video: 'Video',
      audio: 'Audio',
      quiz: 'Quiz',
      culture: 'Culture'
    };
    return labels[this.type] || this.type;
  }
}

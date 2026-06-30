/**
 * TutorMemory.js
 * Modele de domaine pour la memoire pedagogique de l'IA Tutor.
 * Stocke les erreurs recurrentes, le vocabulaire appris, les notions.
 */

export class TutorMemory {
  constructor(data = {}) {
    this.userId = data.userId || null;
    this.cefrLevel = data.cefrLevel || 'A1';
    this.totalConversations = data.totalConversations || 0;
    this.totalMessages = data.totalMessages || 0;
    this.totalStudyTime = data.totalStudyTime || 0; // minutes
    this.exercisesGenerated = data.exercisesGenerated || 0;
    this.quizzesGenerated = data.quizzesGenerated || 0;
    this.correctionsMade = data.correctionsMade || 0;
    this.recurringErrors = data.recurringErrors || []; // [{error, count, category, lastSeen}]
    this.learnedVocabulary = data.learnedVocabulary || []; // [{word, translation, context, learnedAt}]
    this.masteredTopics = data.masteredTopics || []; // [{topic, level, masteredAt}]
    this.topicsToReview = data.topicsToReview || []; // [{topic, reason, priority}]
    this.strengths = data.strengths || []; // ['vocabulary', 'grammar', ...]
    this.weaknesses = data.weaknesses || []; // ['pronunciation', 'conjugation', ...]
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(userId, docData) {
    return new TutorMemory({ ...docData, userId });
  }

  toFirestore() {
    const data = { ...this };
    delete data.userId;
    return data;
  }

  static createDefault(userId, cefrLevel = 'A1') {
    const now = new Date().toISOString();
    return new TutorMemory({
      userId,
      cefrLevel,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Enregistre une erreur recurrente.
   */
  recordError(error, category = 'grammar') {
    const existing = this.recurringErrors.find(e => e.error.toLowerCase() === error.toLowerCase());
    if (existing) {
      existing.count++;
      existing.lastSeen = new Date().toISOString();
    } else {
      this.recurringErrors.push({
        error,
        category,
        count: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      });
    }
    // Trier par nombre d'occurrences
    this.recurringErrors.sort((a, b) => b.count - a.count);
    // Garder les 20 plus frequentes
    this.recurringErrors = this.recurringErrors.slice(0, 20);
  }

  /**
   * Ajoute un mot au vocabulaire appris.
   */
  addVocabulary(word, translation, context = '') {
    if (!this.learnedVocabulary.some(v => v.word.toLowerCase() === word.toLowerCase())) {
      this.learnedVocabulary.push({
        word,
        translation,
        context,
        learnedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Marque un sujet comme maitrise.
   */
  markTopicAsMastered(topic, level = 'A1') {
    if (!this.masteredTopics.some(t => t.topic === topic)) {
      this.masteredTopics.push({
        topic,
        level,
        masteredAt: new Date().toISOString()
      });
    }
    // Retirer des topics a revoir
    this.topicsToReview = this.topicsToReview.filter(t => t.topic !== topic);
  }

  /**
   * Ajoute un sujet a revoir.
   */
  addTopicToReview(topic, reason, priority = 'medium') {
    if (!this.topicsToReview.some(t => t.topic === topic)) {
      this.topicsToReview.push({ topic, reason, priority, addedAt: new Date().toISOString() });
    }
  }

  /**
   * Ajoute du temps d'etude.
   */
  addStudyTime(minutes) {
    this.totalStudyTime += minutes;
  }

  /**
   * Retourne les statistiques pour le dashboard.
   */
  getStats() {
    return {
      totalConversations: this.totalConversations,
      totalMessages: this.totalMessages,
      totalStudyTime: this.totalStudyTime,
      exercisesGenerated: this.exercisesGenerated,
      quizzesGenerated: this.quizzesGenerated,
      correctionsMade: this.correctionsMade,
      vocabularyCount: this.learnedVocabulary.length,
      masteredTopicsCount: this.masteredTopics.length,
      recurringErrorsCount: this.recurringErrors.length
    };
  }
}

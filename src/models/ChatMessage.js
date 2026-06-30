/**
 * ChatMessage.js
 * Modele de domaine pour un message dans une conversation IA.
 */

export class ChatMessage {
  constructor(data = {}) {
    this.id = data.id || null;
    this.sessionId = data.sessionId || '';
    this.userId = data.userId || '';
    this.role = data.role || 'user'; // 'user' | 'assistant' | 'system'
    this.content = data.content || '';
    this.type = data.type || 'text'; // 'text' | 'exercise' | 'quiz' | 'correction' | 'translation'
    this.metadata = data.metadata || {}; // pour les exercices, corrections, etc.
    this.timestamp = data.timestamp || null;
  }

  static fromFirestore(id, docData) {
    return new ChatMessage({ ...docData, id });
  }

  toFirestore() {
    const data = { ...this };
    delete data.id;
    return data;
  }

  static createUserMessage(sessionId, userId, content, metadata = {}) {
    return new ChatMessage({
      sessionId,
      userId,
      role: 'user',
      content,
      type: metadata.type || 'text',
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  static createAssistantMessage(sessionId, userId, content, type = 'text', metadata = {}) {
    return new ChatMessage({
      sessionId,
      userId,
      role: 'assistant',
      content,
      type,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  isExercise() {
    return this.type === 'exercise';
  }

  isCorrection() {
    return this.type === 'correction';
  }

  isQuiz() {
    return this.type === 'quiz';
  }
}

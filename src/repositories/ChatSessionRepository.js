/**
 * ChatSessionRepository.js
 * Acces aux collections chat_sessions/ et chat_messages/ dans Firestore.
 */

import { BaseRepository } from './BaseRepository.js';
import { db } from '../config/firebase.js';
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class ChatSessionRepository extends BaseRepository {
  constructor() {
    super('chat_sessions');
    this.messagesRef = collection(db, 'chat_messages');
  }

  /** Liste les sessions d'un utilisateur, les plus recentes en premier. */
  async findByUser(userId, maxResults = 20) {
    return this.query(
      where('userId', '==', userId),
      orderBy('lastMessageAt', 'desc'),
      limit(maxResults)
    );
  }

  /** Trouve les sessions actives d'un utilisateur pour un cours/lecon donne. */
  async findByContext(userId, courseId, lessonId = '') {
    const constraints = [
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      where('isActive', '==', true)
    ];
    if (lessonId) constraints.push(where('lessonId', '==', lessonId));
    constraints.push(orderBy('lastMessageAt', 'desc'), limit(1));
    const results = await this.query(...constraints);
    return results[0] || null;
  }

  /** Sauvegarde un message dans chat_messages/. */
  async saveMessage(messageData) {
    return addDoc(this.messagesRef, messageData);
  }

  /** Charge les messages d'une session. */
  async getMessages(sessionId, maxResults = 50) {
    const q = query(
      this.messagesRef,
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc'),
      limit(maxResults)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  /** Met a jour le compteur de messages et le lastMessageAt d'une session. */
  async updateSessionActivity(sessionId, messageCount) {
    const ref = doc(db, 'chat_sessions', sessionId);
    await updateDoc(ref, {
      messageCount,
      lastMessageAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}

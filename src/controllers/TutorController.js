/**
 * TutorController.js
 * Controller pour l'IA Tutor integre au parcours pedagogique.
 */

import { aiService } from '../services/AIService.js';
import { AuthController } from './AuthController.js';

export class TutorController {
  constructor() {
    this.view = null;
    this._userId = null;
    this._sessionId = null;
    this._context = {};
  }

  setView(view) {
    this.view = view;
  }

  _getUserId() {
    if (!this._userId) {
      const user = AuthController.getCurrentUser();
      this._userId = user?.uid || null;
    }
    return this._userId;
  }

  /**
   * Initialise le tutor avec un contexte pedagogique (cours, module, lecon).
   */
  async init(context = {}) {
    const userId = this._getUserId();
    if (!userId) {
      this.view.renderError('Veuillez vous connecter pour utiliser le tuteur IA.');
      return;
    }

    this._context = {
      cefrLevel: context.cefrLevel || 'A1',
      courseId: context.courseId || '',
      courseTitle: context.courseTitle || '',
      moduleId: context.moduleId || '',
      moduleTitle: context.moduleTitle || '',
      lessonId: context.lessonId || '',
      lessonTitle: context.lessonTitle || ''
    };

    this.view.renderLoading('Demarrage du tuteur IA...');

    const result = await aiService.getOrCreateTutorSession(userId, this._context);

    if (result.error) {
      this.view.renderError(result.error);
      return;
    }

    this._sessionId = result.session?.id;
    this.view.renderChat(result.session, result.messages || []);
  }

  /**
   * Envoie un message au tutor.
   */
  async onSendMessage(content) {
    if (!content.trim() || !this._sessionId) return;

    this.view.addUserMessage(content);
    this.view.showTypingIndicator();

    const result = await aiService.sendTutorMessage(
      this._getUserId(),
      this._sessionId,
      content,
      this._context
    );

    this.view.hideTypingIndicator();

    if (result.error) {
      this.view.showToast(result.error, 'error');
      return;
    }

    // Normaliser la reponse : CF retourne result.response, local retourne result.message
    const msgContent = result.message?.content || result.response || result.message || '';
    const msgObj = typeof result.message === 'object' && result.message
      ? result.message
      : { content: msgContent, role: 'assistant', timestamp: new Date().toISOString() };

    this.view.addAssistantMessage(msgObj);
  }

  /**
   * Genere un exercice.
   */
  async onGenerateExercise(type = 'grammar') {
    const userId = this._getUserId();
    if (!userId) return;

    this.view.showTypingIndicator();
    const exercise = await aiService.generateTutorExercise(
      userId,
      type,
      this._context.cefrLevel,
      this._context.lessonTitle || ''
    );
    this.view.hideTypingIndicator();

    this.view.addAssistantMessage({
      content: `?? **${exercise.title}**\n${exercise.instructions}\n\n${exercise.questions.map((q, i) => `${i + 1}. ${q.text}`).join('\n')}\n\nEnvoyez-moi vos reponses pour correction !`,
      type: 'exercise',
      metadata: { exercise }
    });
  }

  /**
   * Genere un mini-quiz.
   */
  async onGenerateQuiz() {
    const userId = this._getUserId();
    if (!userId) return;

    this.view.showTypingIndicator();
    const quiz = await aiService.generateTutorMiniQuiz(
      userId,
      this._context.cefrLevel,
      this._context.lessonTitle || ''
    );
    this.view.hideTypingIndicator();

    let content = `?? **${quiz.title}**\n${quiz.instructions}\n\n`;
    quiz.questions.forEach((q, i) => {
      content += `${i + 1}. ${q.text}\n`;
      if (q.options) {
        q.options.forEach((opt, j) => {
          content += `   ${String.fromCharCode(65 + j)}) ${opt}\n`;
        });
      }
      content += '\n';
    });
    content += 'Bonne chance ! ??';

    this.view.addAssistantMessage({ content, type: 'quiz', metadata: { quiz } });
  }

  /**
   * Demande une correction.
   */
  async onRequestCorrection(phrase) {
    await this.onSendMessage(`Corrige ma phrase : "${phrase}"`);
  }

  /**
   * Demande une traduction.
   */
  async onRequestTranslation(text, targetLang = 'francais') {
    await this.onSendMessage(`Traduis "${text}" en ${targetLang}`);
  }

  /**
   * Demande une explication grammaticale.
   */
  async onRequestGrammar(topic) {
    await this.onSendMessage(`Explique la grammaire : ${topic}`);
  }

  /**
   * Demande de l'aide sur la lecon courante.
   */
  async onRequestLessonHelp() {
    if (this._context.lessonTitle) {
      await this.onSendMessage(`J'ai besoin d'aide sur la lecon "${this._context.lessonTitle}". Peux-tu m'expliquer les points importants ?`);
    } else {
      this.view.showToast('Aucune lecon en cours. Ouvrez une lecon depuis le catalogue.', 'info');
    }
  }

  /**
   * Nouvelle session.
   */
  async onNewSession() {
    this._sessionId = null;
    await this.init(this._context);
  }

  /**
   * Charge une session existante.
   */
  async onLoadSession(sessionId) {
    this._sessionId = sessionId;
    const messages = await aiService.getTutorSessionMessages(sessionId);
    this.view.renderMessages(messages);
  }

  /**
   * Charge les stats memoire pour le dashboard.
   */
  async loadTutorStats() {
    const userId = this._getUserId();
    if (!userId) return null;
    return aiService.getTutorMemoryStats(userId);
  }

  /**
   * Charge les sessions recentes pour le dashboard.
   */
  async loadRecentSessions() {
    const userId = this._getUserId();
    if (!userId) return [];
    return aiService.getTutorSessions(userId);
  }
}

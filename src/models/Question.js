/**
 * Question.js
 * Modele de domaine pour une question de quiz.
 * Represente la structure de la collection Firestore : questions/{questionId}
 */

import { QUESTION_TYPES } from './Quiz.js';
import { CEFR_LEVELS } from '../config/firebase.js';

/**
 * @class Question
 * Modele de domaine pour une question.
 */
export class Question {
  constructor(data = {}) {
    this.id = data.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.text = data.text || '';
    this.type = data.type || QUESTION_TYPES.MULTIPLE_CHOICE;
    this.context = data.context || ''; // texte/audio/contexte
    this.level = data.level || CEFR_LEVELS.A1;
    this.category = data.category || 'general'; // grammar, vocabulary, comprehension, culture
    this.skill = data.skill || ''; // competence specifique
    this.difficulty = data.difficulty || 1; // 1-5
    this.timeEstimate = data.timeEstimate || 60; // secondes
    this.points = data.points || 1;
    this.explanation = data.explanation || ''; // explication de la reponse
    this.resources = data.resources || []; // liens, references

    // Reponses selon le type
    this.options = data.options || []; // QCM : [{text, isCorrect}]
    this.correctAnswer = data.correctAnswer ?? null; // Vrai/Faux, court, fill_blank
    this.correctOrder = data.correctOrder || []; // Ordering
    this.pairs = data.pairs || []; // Matching : [{left, right}]
    this.acceptedAnswers = data.acceptedAnswers || []; // reponses acceptees pour short_answer
    this.keywords = data.keywords || []; // mots-cles pour open_ended

    this.createdBy = data.createdBy || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Cree une nouvelle question.
   * @param {Object} data
   * @returns {Question}
   */
  static create(data) {
    return new Question({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Cree depuis un document Firestore.
   * @param {string} id
   * @param {Object} docData
   * @returns {Question}
   */
  static fromFirestore(id, docData) {
    return new Question({ ...docData, id });
  }

  /**
   * Convertit en objet plain pour Firestore.
   * @returns {Object}
   */
  toFirestore() {
    const data = {
      text: this.text,
      type: this.type,
      context: this.context,
      level: this.level,
      category: this.category,
      skill: this.skill,
      difficulty: this.difficulty,
      timeEstimate: this.timeEstimate,
      points: this.points,
      explanation: this.explanation,
      resources: this.resources,
      options: this.options,
      correctAnswer: this.correctAnswer,
      correctOrder: this.correctOrder,
      pairs: this.pairs,
      acceptedAnswers: this.acceptedAnswers,
      keywords: this.keywords,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    // Nettoyer les champs non pertinents selon le type
    if (this.type !== QUESTION_TYPES.MULTIPLE_CHOICE) delete data.options;
    if (this.type !== QUESTION_TYPES.ORDERING) delete data.correctOrder;
    if (this.type !== QUESTION_TYPES.MATCHING) delete data.pairs;
    if (![QUESTION_TYPES.SHORT_ANSWER, QUESTION_TYPES.FILL_IN_BLANK].includes(this.type)) {
      delete data.acceptedAnswers;
    }
    if (this.type !== QUESTION_TYPES.OPEN_ENDED) delete data.keywords;
    return data;
  }

  /**
   * Corrige une reponse utilisateur.
   * @param {any} userAnswer
   * @returns {{correct: boolean, score: number, feedback: string}}
   */
  grade(userAnswer) {
    let correct = false;
    let score = 0;

    switch (this.type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        correct = this.options[userAnswer]?.isCorrect === true;
        break;

      case QUESTION_TYPES.TRUE_FALSE:
        correct = userAnswer === this.correctAnswer;
        break;

      case QUESTION_TYPES.SHORT_ANSWER:
      case QUESTION_TYPES.FILL_IN_BLANK:
        if (typeof userAnswer === 'string') {
          const normalized = userAnswer.toLowerCase().trim();
          correct = this.acceptedAnswers.some(
            ans => ans.toLowerCase().trim() === normalized
          );
        }
        break;

      case QUESTION_TYPES.ORDERING:
        if (Array.isArray(userAnswer) && Array.isArray(this.correctOrder)) {
          correct = JSON.stringify(userAnswer) === JSON.stringify(this.correctOrder);
        }
        break;

      case QUESTION_TYPES.MATCHING:
        // Evaluation par paires
        if (Array.isArray(userAnswer)) {
          const correctPairs = this.pairs.filter(p => {
            const userPair = userAnswer.find(u => u.left === p.left);
            return userPair && userPair.right === p.right;
          });
          score = Math.round((correctPairs.length / this.pairs.length) * this.points);
          correct = score === this.points;
        }
        break;

      case QUESTION_TYPES.OPEN_ENDED:
        // Evalue par IA — toujours marque comme necessitant revue
        correct = false;
        score = 0;
        break;

      default:
        correct = false;
    }

    if (this.type !== QUESTION_TYPES.MATCHING) {
      score = correct ? this.points : 0;
    }

    return {
      correct,
      score,
      feedback: this.explanation || '',
      maxScore: this.points
    };
  }

  /**
   * Verifie si une reponse est valide (non vide).
   * @param {any} answer
   * @returns {boolean}
   */
  static isValidAnswer(answer) {
    if (answer === undefined || answer === null) return false;
    if (typeof answer === 'string' && answer.trim() === '') return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    return true;
  }
}

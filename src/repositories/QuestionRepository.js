/**
 * QuestionRepository.js
 * Acces a la collection questions/ dans Firestore.
 */

import { BaseRepository } from './BaseRepository.js';
import { where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class QuestionRepository extends BaseRepository {
  constructor() {
    super('questions');
  }

  /**
   * Charge plusieurs questions par leurs IDs.
   * @param {Array<string>} questionIds
   * @returns {Promise<Array<Object>>}
   */
  async findMany(questionIds) {
    if (!questionIds?.length) return [];
    // Firestore ne supporte pas IN avec plus de 10 elements
    const chunks = [];
    for (let i = 0; i < questionIds.length; i += 10) {
      chunks.push(questionIds.slice(i, i + 10));
    }
    const results = await Promise.all(
      chunks.map(chunk => this.query(where('__name__', 'in', chunk)))
    );
    return results.flat();
  }

  /**
   * Trouve les questions d'une banque pour un niveau et categorie.
   * @param {string} level
   * @param {string} category
   * @param {number} maxResults
   * @returns {Promise<Array<Object>>}
   */
  async findByLevelAndCategory(level, category, maxResults = 50) {
    return this.query(
      where('level', '==', level),
      where('category', '==', category),
      orderBy('difficulty', 'asc'),
      limit(maxResults)
    );
  }

  /**
   * Trouve les questions par competence.
   * @param {string} skill
   * @param {string} level
   * @param {number} maxResults
   * @returns {Promise<Array<Object>>}
   */
  async findBySkill(skill, level, maxResults = 50) {
    const constraints = [where('skill', '==', skill), orderBy('difficulty', 'asc')];
    if (level) constraints.unshift(where('level', '==', level));
    constraints.push(limit(maxResults));
    return this.query(...constraints);
  }

  /**
   * Trouve les questions par type.
   * @param {string} type — multiple_choice, true_false, etc.
   * @param {string} level
   * @param {number} maxResults
   * @returns {Promise<Array<Object>>}
   */
  async findByType(type, level, maxResults = 50) {
    const constraints = [where('type', '==', type), orderBy('difficulty', 'asc')];
    if (level) constraints.unshift(where('level', '==', level));
    constraints.push(limit(maxResults));
    return this.query(...constraints);
  }

  /**
   * Trouve les questions creees par un enseignant.
   * @param {string} instructorId
   * @returns {Promise<Array<Object>>}
   */
  async findByInstructor(instructorId) {
    return this.query(where('createdBy', '==', instructorId));
  }

  /**
   * Genere un quiz aleatoire a partir de la banque de questions.
   * @param {string} level
   * @param {string} category
   * @param {number} count
   * @returns {Promise<Array<Object>>}
   */
  async getRandomQuestions(level, category, count = 10) {
    const questions = await this.findByLevelAndCategory(level, category, 100);
    // Melanger et prendre le nombre demande
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}

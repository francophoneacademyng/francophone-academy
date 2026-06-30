/**
 * UserRepository.js
 * Acces a la collection Firestore : users/{uid}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * @class UserRepository
 * Repository pour les utilisateurs.
 */
export class UserRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.USERS);
  }

  /**
   * Trouve un utilisateur par son UID.
   * @param {string} uid
   * @returns {Promise<Object|null>}
   */
  async findByUid(uid) {
    return this.findById(uid);
  }

  /**
   * Cree le profil utilisateur apres inscription.
   * @param {string} uid
   * @param {Object} userData
   */
  async createUserProfile(uid, userData) {
    return this.create(uid, {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Met a jour le profil utilisateur.
   * @param {string} uid
   * @param {Object} updates
   */
  async updateProfile(uid, updates) {
    return this.update(uid, updates);
  }

  /**
   * Met a jour la derniere connexion.
   * @param {string} uid
   */
  async updateLastLogin(uid) {
    return this.update(uid, { lastLoginAt: new Date().toISOString() });
  }

  /**
   * Trouve un utilisateur par email.
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return this.findBy('email', email);
  }

  /**
   * Liste les utilisateurs par role.
   * @param {string} role
   * @param {number} maxResults
   * @returns {Promise<Array<Object>>}
   */
  async findByRole(role, maxResults = 50) {
    return this.query(where('role', '==', role), orderBy('createdAt', 'desc'), limit(maxResults));
  }

  /**
   * Met a jour le niveau CECRL.
   * @param {string} uid
   * @param {string} level
   */
  async updateLevel(uid, level) {
    return this.update(uid, { level });
  }

  /**
   * Met a jour l'abonnement.
   * @param {string} uid
   * @param {string} plan
   */
  async updateSubscription(uid, plan) {
    return this.update(uid, { subscription: plan });
  }
}

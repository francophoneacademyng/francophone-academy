/**
 * User.js
 * Modele de domaine pour un utilisateur.
 * Represente la structure du document Firestore : users/{uid}
 */

import { CEFR_LEVELS, ROLES, SUBSCRIPTION_PLANS } from '../config/firebase.js';

/**
 * @class User
 * Modele utilisateur de Francophone Academy.
 */
export class User {
  constructor(data = {}) {
    this.uid = data.uid || null;
    this.email = data.email || '';
    this.displayName = data.displayName || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.phone = data.phone || '';
    this.country = data.country || '';
    this.photoURL = data.photoURL || '';
    this.role = data.role || ROLES.STUDENT;
    this.level = data.level || CEFR_LEVELS.A1;
    this.subscription = data.subscription || SUBSCRIPTION_PLANS.FREE;
    this.emailVerified = data.emailVerified || false;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
    this.lastLoginAt = data.lastLoginAt || null;
    this.isActive = data.isActive !== false;
    this.preferences = data.preferences || {
      language: 'fr',
      theme: 'light',
      notifications: true
    };
  }

  /**
   * Cree un User depuis les donnees Firebase Auth + formulaire.
   * @param {Object} firebaseUser — User Firebase Auth
   * @param {Object} formData — Donnees du formulaire d'inscription
   * @returns {User}
   */
  static fromFirebase(firebaseUser, formData = {}) {
    const now = new Date().toISOString();
    return new User({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      phone: formData.phone || '',
      country: formData.country || '',
      photoURL: firebaseUser.photoURL || '',
      role: ROLES.STUDENT,
      level: formData.level || CEFR_LEVELS.A1,
      subscription: SUBSCRIPTION_PLANS.FREE,
      emailVerified: firebaseUser.emailVerified || false,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    });
  }

  /**
   * Cree un User depuis un document Firestore.
   * @param {string} uid
   * @param {Object} docData
   * @returns {User}
   */
  static fromFirestore(uid, docData) {
    return new User({ ...docData, uid });
  }

  /**
   * Convertit en objet plain pour Firestore.
   * @returns {Object}
   */
  toFirestore() {
    const data = { ...this };
    delete data.uid; // Le uid est la cle du document
    return data;
  }

  /**
   * Verifie si l'utilisateur a un role admin.
   * @returns {boolean}
   */
  isAdmin() {
    return this.role === ROLES.ADMIN || this.role === ROLES.SUPERADMIN;
  }

  /**
   * Verifie si l'utilisateur est un enseignant.
   * @returns {boolean}
   */
  isTeacher() {
    return this.role === ROLES.TEACHER || this.isAdmin();
  }

  /**
   * Retourne le nom complet.
   * @returns {string}
   */
  getFullName() {
    return `${this.firstName} ${this.lastName}`.trim() || this.displayName || this.email;
  }
}

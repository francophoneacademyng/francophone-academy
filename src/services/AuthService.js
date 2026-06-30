/**
 * AuthService.js
 * Service d'authentification avec Firebase Auth.
 * Gere : inscription, connexion, Google, deconnexion, mot de passe oublie.
 *
 * Architecture : Controller -> AuthService -> Firebase Auth + UserRepository
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { auth, googleProvider } from '../config/firebase.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { StudentProgressRepository } from '../repositories/StudentProgressRepository.js';
import { User } from '../models/User.js';
import { translateFirebaseError } from '../utils/firebaseErrors.js';

/**
 * @class AuthService
 * Service d'authentification.
 */
export class AuthService {
  constructor() {
    this.userRepo = new UserRepository();
    this.progressRepo = new StudentProgressRepository();
  }

  // ============================================
  // INSCRIPTION
  // ============================================

  /**
   * Inscrit un nouvel utilisateur avec email/mot de passe.
   * Cree automatiquement le profil Firestore et la progression.
   * @param {Object} data — Donnees du formulaire
   * @returns {Promise<{user: Object, error: null}|{user: null, error: string}>}
   */
  async register(data) {
    try {
      // 1. Creer le compte Firebase Auth
      const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = credential.user;

      // 2. Mettre a jour le profil Firebase
      const displayName = `${data.firstName} ${data.lastName}`.trim();
      await updateProfile(firebaseUser, { displayName });

      // 3. Creer le document utilisateur dans Firestore
      const user = User.fromFirebase(firebaseUser, data);
      await this.userRepo.createUserProfile(firebaseUser.uid, user.toFirestore());

      // 4. Creer la progression initiale
      await this.progressRepo.createInitial(firebaseUser.uid, { level: data.level || 'A1' });

      // 5. Envoyer l'email de verification
      await sendEmailVerification(firebaseUser);

      return { user: { uid: firebaseUser.uid, email: firebaseUser.email, displayName }, error: null };

    } catch (err) {
      console.error('[AuthService.register]', err.code, err.message);
      return { user: null, error: translateFirebaseError(err) };
    }
  }

  // ============================================
  // CONNEXION
  // ============================================

  /**
   * Connecte un utilisateur avec email/mot de passe.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user: Object, error: null}|{user: null, error: string}>}
   */
  async login(email, password) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      // Mettre a jour la derniere connexion dans Firestore
      await this.userRepo.updateLastLogin(firebaseUser.uid);

      return {
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified
        },
        error: null
      };

    } catch (err) {
      console.error('[AuthService.login]', err.code, err.message);
      return { user: null, error: translateFirebaseError(err) };
    }
  }

  // ============================================
  // GOOGLE AUTH
  // ============================================

  /**
   * Connecte un utilisateur via Google.
   * Cree le profil Firestore si c'est la premiere connexion.
   * @returns {Promise<{user: Object, error: null, isNewUser: boolean}|{user: null, error: string}>}
   */
  async loginWithGoogle() {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = credential.user;
      const isNewUser = credential.additionalUserInfo?.isNewUser || false;

      if (isNewUser) {
        // Creer le profil et la progression pour un nouvel utilisateur Google
        const user = User.fromFirebase(firebaseUser, {
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || ''
        });
        await this.userRepo.createUserProfile(firebaseUser.uid, user.toFirestore());
        await this.progressRepo.createInitial(firebaseUser.uid);
      } else {
        await this.userRepo.updateLastLogin(firebaseUser.uid);
      }

      return {
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        },
        error: null,
        isNewUser
      };

    } catch (err) {
      console.error('[AuthService.loginWithGoogle]', err.code, err.message);
      return { user: null, error: translateFirebaseError(err) };
    }
  }

  // ============================================
  // MOT DE PASSE OUBLIE
  // ============================================

  /**
   * Envoie un email de reinitialisation de mot de passe.
   * @param {string} email
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, error: null };
    } catch (err) {
      console.error('[AuthService.resetPassword]', err.code, err.message);
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  // ============================================
  // DECONNEXION
  // ============================================

  /**
   * Deconnecte l'utilisateur.
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async logout() {
    try {
      await signOut(auth);
      return { success: true, error: null };
    } catch (err) {
      console.error('[AuthService.logout]', err);
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  // ============================================
  // SESSION
  // ============================================

  /**
   * Ecoute les changements d'etat d'authentification.
   * @param {Function} callback — (user|null) => void
   * @returns {Function} Fonction de desinscription
   */
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Retourne l'utilisateur Firebase actuel.
   * @returns {Object|null}
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  // ============================================
  // PROFIL FIRESTORE
  // ============================================

  /**
   * Charge le profil utilisateur depuis Firestore.
   * @param {string} uid
   * @returns {Promise<Object|null>}
   */
  async getUserProfile(uid) {
    try {
      return await this.userRepo.findByUid(uid);
    } catch (err) {
      console.error('[AuthService.getUserProfile]', err);
      return null;
    }
  }

  /**
   * Met a jour le profil utilisateur dans Firestore.
   * @param {string} uid
   * @param {Object} updates
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async updateUserProfile(uid, updates) {
    try {
      await this.userRepo.updateProfile(uid, updates);
      return { success: true, error: null };
    } catch (err) {
      console.error('[AuthService.updateUserProfile]', err);
      return { success: false, error: translateFirebaseError(err) };
    }
  }
}

/** Instance singleton */
export const authService = new AuthService();

/**
 * BaseRepository.js
 * Classe de base pour tous les repositories Firestore.
 * Fournit les operations CRUD standard.
 */

import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db } from '../config/firebase.js';

/**
 * @class BaseRepository
 * Repository de base avec operations CRUD Firestore.
 */
export class BaseRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collectionRef = collection(db, collectionName);
  }

  /**
   * Retourne la reference d'un document.
   * @param {string} id
   * @returns {DocumentReference}
   */
  _docRef(id) {
    return doc(db, this.collectionName, id);
  }

  /**
   * Trouve un document par ID.
   * @param {string} id
   * @returns {Promise<Object|null>} Les donnees ou null.
   */
  async findById(id) {
    const snap = await getDoc(this._docRef(id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  /**
   * Cree ou remplace un document.
   * @param {string} id
   * @param {Object} data
   */
  async create(id, data) {
    await setDoc(this._docRef(id), data);
    return { id, ...data };
  }

  /**
   * Met a jour un document (merge).
   * @param {string} id
   * @param {Object} data
   */
  async update(id, data) {
    await updateDoc(this._docRef(id), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Supprime un document.
   * @param {string} id
   */
  async delete(id) {
    await deleteDoc(this._docRef(id));
  }

  /**
   * Verifie si un document existe.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    const snap = await getDoc(this._docRef(id));
    return snap.exists();
  }

  /**
   * Requete avec filtres.
   * @param {Array<QueryConstraint>} constraints
   * @returns {Promise<Array<Object>>}
   */
  async query(...constraints) {
    const q = query(this.collectionRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  /**
   * Trouve un document par champ.
   * @param {string} field
   * @param {any} value
   * @returns {Promise<Object|null>}
   */
  async findBy(field, value) {
    const results = await this.query(where(field, '==', value), limit(1));
    return results[0] || null;
  }

  /**
   * Liste tous les documents (pagines).
   * @param {Object} options
   * @returns {Promise<Array<Object>>}
   */
  async findAll(options = {}) {
    const constraints = [];
    if (options.orderBy) constraints.push(orderBy(options.orderBy, options.direction || 'desc'));
    if (options.limit) constraints.push(limit(options.limit));
    return this.query(...constraints);
  }
}

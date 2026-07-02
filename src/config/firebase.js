/**
 * firebase.js
 * Configuration et initialisation de Firebase.
 * Point unique d'acces a Firebase Auth et Firestore.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// CONFIGURATION — REMPLACER PAR VOS CREDENTIALS
// ============================================
// Ces valeurs proviennent de la console Firebase :
// Project Settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWeM62BTVeTgECtB7UMnQr-TplMfe8fhg",
  authDomain: "francophone-academy.firebaseapp.com",
  projectId: "francophone-academy",
  storageBucket: "francophone-academy.firebasestorage.app",
  messagingSenderId: "337611388891",
  appId: "1:337611388891:web:0ca5461da253c27c9d59fe"
};

// ============================================
// INITIALISATION
// ============================================

const app = initializeApp(firebaseConfig);
export const firebaseApp = app;

/** Instance Firebase Auth */
export const auth = getAuth(app);

/** Instance Firestore */
export const db = getFirestore(app);

/** Provider Google Auth */
export const googleProvider = new GoogleAuthProvider();

// ============================================
// EMULATEURS (development uniquement)
// ============================================
// Decommenter pour utiliser les emulateurs locaux :
// connectAuthEmulator(auth, 'http://localhost:9099');
// connectFirestoreEmulator(db, 'localhost', 8080);

// ============================================
// COLLECTIONS FIRESTORE
// ============================================
export const COLLECTIONS = {
  USERS: 'users',
  STUDENT_PROGRESS: 'student_progress',
  COURSES: 'courses',
  LESSONS: 'lessons',
  MODULES: 'modules',
  ACADEMIC_PROGRAMS: 'academic_programs',
  ACADEMIC_LEVELS: 'academic_levels',
  ACADEMIC_MODULES: 'academic_modules',
  ACADEMIC_UNITS: 'academic_units',
  ACADEMIC_LESSONS: 'academic_lessons',
  ACADEMIC_EXERCISES: 'academic_exercises',
  ACADEMIC_QUIZZES: 'academic_quizzes',
  ACADEMIC_ASSIGNMENTS: 'academic_assignments',
  ACADEMIC_LIVE_CLASSES: 'academic_live_classes',
  ACADEMIC_EXAMS: 'academic_exams',
  ACADEMIC_CERTIFICATES: 'academic_certificates',
  ENROLLMENTS: 'enrollments',
  QUIZZES: 'quizzes',
  QUESTIONS: 'questions',
  QUIZ_ATTEMPTS: 'quiz_attempts',
  QUIZ_RESULTS: 'quiz_results',
  STUDENT_SCORES: 'student_scores',
  CHAT_SESSIONS: 'chat_sessions',
  CHAT_MESSAGES: 'chat_messages',
  TUTOR_MEMORY: 'tutor_memory',
  NOTIFICATIONS: 'notifications',
  SUBSCRIPTIONS: 'subscriptions',
  PAYMENTS: 'payments',
  TRANSACTIONS: 'transactions',
  INVOICES: 'invoices',
  CERTIFICATES: 'certificates',
  ACTIVITIES: 'activities'
};

// ============================================
// ROLES UTILISATEUR
// ============================================
export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin'
};

// ============================================
// NIVEAUX CECRL
// ============================================
export const CEFR_LEVELS = {
  A1: 'A1',
  A2: 'A2',
  B1: 'B1',
  B2: 'B2',
  C1: 'C1',
  C2: 'C2'
};

// ============================================
// ABONNEMENTS
// ============================================
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  STANDARD: 'standard',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise'
};

export const PLAN_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'XOF',
    duration: 'monthly',
    maxCourses: 1,
    aiTutorMinutes: 30,
    quizzesPerMonth: 5,
    features: ['1 cours gratuit', '30 min IA Tutor/mois', '5 quiz/mois', 'Progression de base']
  },
  standard: {
    name: 'Standard',
    price: 5000,
    currency: 'XOF',
    duration: 'monthly',
    maxCourses: 3,
    aiTutorMinutes: 120,
    quizzesPerMonth: 20,
    features: ['3 cours', '2h IA Tutor/mois', '20 quiz/mois', 'Feedback IA complet', 'Certificats']
  },
  professional: {
    name: 'Professional',
    price: 10000,
    currency: 'XOF',
    duration: 'monthly',
    maxCourses: 10,
    aiTutorMinutes: 600,
    quizzesPerMonth: 999,
    features: ['10 cours', '10h IA Tutor/mois', 'Quiz illimites', 'Feedback IA + remédiation', 'Certificats premium', 'Support prioritaire']
  },
  enterprise: {
    name: 'Enterprise',
    price: 25000,
    currency: 'XOF',
    duration: 'monthly',
    maxCourses: 999,
    aiTutorMinutes: 9999,
    quizzesPerMonth: 999,
    features: ['Cours illimités', 'IA Tutor illimité', 'Quiz illimités', 'Examens DELF/DALF/TCF', 'Coaching personnalisé', 'Support dédié']
  }
};

// ============================================
// PAYSTACK CONFIG
// ============================================
export const PAYSTACK_CONFIG = {
  PUBLIC_KEY: 'pk_test_paystack_public_key', // REMPLACER par votre clé publique Paystack
  CURRENCY: 'XOF',
  CHANNELS: ['card', 'mobile_money'],
  CALLBACK_URL: window.location.origin + '/pages/payment/payment-success.html'
};

export { app };

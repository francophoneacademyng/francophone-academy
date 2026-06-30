/**
 * firebaseAdmin.js
 * Initialisation de Firebase Admin SDK.
 * Point unique d'acces aux services backend (Firestore, Auth).
 */

const admin = require('firebase-admin');

// Initialise l'application Admin avec les credentials par defaut
// (configure via GOOGLE_APPLICATION_CREDENTIALS ou environnement GCP)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// ============================================
// COLLECTIONS
// ============================================
const COLLECTIONS = {
  USERS: 'users',
  STUDENT_PROGRESS: 'student_progress',
  COURSES: 'courses',
  MODULES: 'modules',
  LESSONS: 'lessons',
  ENROLLMENTS: 'enrollments',
  QUIZZES: 'quizzes',
  QUESTIONS: 'questions',
  QUIZ_ATTEMPTS: 'quiz_attempts',
  QUIZ_RESULTS: 'quiz_results',
  STUDENT_SCORES: 'student_scores',
  CHAT_SESSIONS: 'chat_sessions',
  CHAT_MESSAGES: 'chat_messages',
  TUTOR_MEMORY: 'tutor_memory',
  SUBSCRIPTIONS: 'subscriptions',
  PAYMENTS: 'payments',
  TRANSACTIONS: 'transactions',
  INVOICES: 'invoices',
  CERTIFICATES: 'certificates',
  CERTIFICATE_TEMPLATES: 'certificate_templates',
  CERTIFICATE_VERIFICATIONS: 'certificate_verifications',
  ACTIVITIES: 'activities',
  LOGS: 'logs'
};

// ============================================
// ROLES
// ============================================
const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin'
};

// ============================================
// CEFR
// ============================================
const CEFR_LEVELS = {
  A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2', C1: 'C1', C2: 'C2'
};

// ============================================
// SECRETS (via Firebase Secrets ou env vars)
// ============================================
const SECRETS = {
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'francophone-academy-jwt-secret-change-in-production'
};

module.exports = { admin, db, auth, COLLECTIONS, ROLES, CEFR_LEVELS, SECRETS };

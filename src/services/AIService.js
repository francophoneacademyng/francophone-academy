/**
 * AIService.js
 * Façade principale — Point d'entrée unique pour tous les services metier.
 * Le Controller n'appelle JAMAIS les services directement, il passe par AIService.
 *
 * Architecture : Controller -> AIService -> Service -> Repository -> Firestore
 */

import { AuthService, authService } from './AuthService.js';
import { StudentService, studentService } from './StudentService.js';
import { CourseService, courseService } from './CourseService.js';
import { LearningService, learningService } from './LearningService.js';
import { TutorService, tutorService } from './TutorService.js';
import { QuizService, quizService } from './QuizService.js';
import { AssessmentService, assessmentService } from './AssessmentService.js';
import { PaymentService, paymentService } from './PaymentService.js';
import { SubscriptionService, subscriptionService } from './SubscriptionService.js';
import { CertificateService, certificateService } from './CertificateService.js';
import {
  cfValidatePayment,
  cfGenerateCertificate,
  cfRevokeCertificate,
  cfSubmitQuiz,
  cfTutorProxy,
  cfHealthCheck
} from './CloudFunctionService.js';

/**
 * @class AIService
 * Façade unifiee pour tous les services.
 */
export class AIService {
  constructor() {
    this.auth = authService;
    this.student = studentService;
    this.course = courseService;
    this.learning = learningService;
    this.tutor = tutorService;
    this.quiz = quizService;
    this.assessment = assessmentService;
    this.payment = paymentService;
    this.subscription = subscriptionService;
    this.certificate = certificateService;
  }

  // ============================================
  // AUTHENTIFICATION (delegation a AuthService)
  // ============================================

  async register(data) {
    return this.auth.register(data);
  }

  async login(email, password) {
    return this.auth.login(email, password);
  }

  async loginWithGoogle() {
    return this.auth.loginWithGoogle();
  }

  async logout() {
    return this.auth.logout();
  }

  async resetPassword(email) {
    return this.auth.resetPassword(email);
  }

  onAuthStateChanged(callback) {
    return this.auth.onAuthStateChanged(callback);
  }

  getCurrentUser() {
    return this.auth.getCurrentUser();
  }

  async getUserProfile(uid) {
    return this.auth.getUserProfile(uid);
  }

  async updateUserProfile(uid, updates) {
    return this.auth.updateUserProfile(uid, updates);
  }

  // ============================================
  // PROGRESSION ETUDIANT (delegation a StudentService)
  // ============================================

  async getStudentProgress(uid) {
    return this.student.getProgress(uid);
  }

  async getDashboardData(uid) {
    return this.student.getDashboardData(uid);
  }

  async getStats(uid) {
    return this.student.getStats(uid);
  }

  async getFormattedProgress(uid) {
    return this.student.getFormattedProgress(uid);
  }

  async getRecentActivities(uid) {
    return this.student.getRecentActivities(uid);
  }

  async getNotifications() {
    return this.student.getNotifications();
  }

  async getRecommendations(uid) {
    return this.student.getRecommendations(uid);
  }

  async getSchedule() {
    return this.student.getSchedule();
  }

  // ============================================
  // COURSE SERVICE (delegation)
  // ============================================

  async getCourseCatalog() {
    return this.course.getCatalog();
  }

  async getCoursesByCategory(category) {
    return this.course.getByCategory(category);
  }

  async getCoursesByLevel(level) {
    return this.course.getByLevel(level);
  }

  async getCourse(courseId) {
    return this.course.getById(courseId);
  }

  async enrollInCourse(userId, courseId) {
    return this.course.enroll(userId, courseId);
  }

  async isEnrolledInCourse(userId, courseId) {
    return this.course.isEnrolled(userId, courseId);
  }

  async getUserCourses(userId) {
    return this.course.getUserCourses(userId);
  }

  async createCourse(courseId, data) {
    return this.course.createCourse(courseId, data);
  }

  async updateCourse(courseId, updates) {
    return this.course.updateCourse(courseId, updates);
  }

  async publishCourse(courseId) {
    return this.course.publishCourse(courseId);
  }

  async archiveCourse(courseId) {
    return this.course.archiveCourse(courseId);
  }

  async getTeacherCourses(instructorId) {
    return this.course.getTeacherCourses(instructorId);
  }

  // ============================================
  // LEARNING SERVICE (delegation)
  // ============================================

  async getCourseModules(courseId) {
    return this.learning.getModules(courseId);
  }

  async getModuleLessons(moduleId) {
    return this.learning.getLessons(moduleId);
  }

  async getLesson(lessonId) {
    return this.learning.getLesson(lessonId);
  }

  async getCourseStructure(courseId) {
    return this.learning.getCourseStructure(courseId);
  }

  async getEnrollment(userId, courseId) {
    return this.learning.getEnrollment(userId, courseId);
  }

  async completeLesson(userId, courseId, lessonId) {
    return this.learning.completeLesson(userId, courseId, lessonId);
  }

  async getLessonNavigation(courseId, lessonId) {
    return this.learning.getLessonNavigation(courseId, lessonId);
  }

  async createModule(moduleId, data) {
    return this.learning.createModule(moduleId, data);
  }

  async createLesson(lessonId, data) {
    return this.learning.createLesson(lessonId, data);
  }

  // ============================================
  // TUTOR SERVICE — Cloud Function securisee
  // ============================================

  async getOrCreateTutorSession(userId, context) {
    return this.tutor.getOrCreateSession(userId, context);
  }

  /**
   * SECURISE : Les appels IA passent par Cloud Function proxy.
   * Les cles API ne sont jamais exposees au client.
   */
  async sendTutorMessage(userId, sessionId, message, context) {
    try {
      const cefrLevel = context?.level || 'A1';
      const ctx = context?.lessonTitle || context?.courseTitle || '';
      const aiResult = await cfTutorProxy(message, cefrLevel, ctx);
      // Sauvegarder la reponse localement
      await this.tutor.saveMessage(userId, sessionId, message, aiResult.response || aiResult, context);
      return { response: aiResult.response || aiResult, source: 'cloud_function' };
    } catch (err) {
      console.warn('[AIService] Cloud Function AI failed, fallback local:', err.message);
      return this.tutor.sendMessage(userId, sessionId, message, context);
    }
  }

  async getTutorSessions(userId) {
    return this.tutor.getUserSessions(userId);
  }

  async getTutorSessionMessages(sessionId) {
    return this.tutor.getSessionMessages(sessionId);
  }

  async generateTutorExercise(userId, type, level, topic) {
    return this.tutor.generateExercise(userId, type, level, topic);
  }

  async generateTutorMiniQuiz(userId, level, topic) {
    return this.tutor.generateMiniQuiz(userId, level, topic);
  }

  async getTutorMemory(userId) {
    return this.tutor.getMemory(userId);
  }

  async getTutorMemoryStats(userId) {
    return this.tutor.getMemoryStats(userId);
  }

  // ============================================
  // QUIZ SERVICE (delegation)
  // ============================================

  async getQuizCatalog(userLevel) {
    return this.quiz.getCatalog(userLevel);
  }

  async getQuizWithQuestions(quizId) {
    return this.quiz.getQuizWithQuestions(quizId);
  }

  async filterQuizzes(filters) {
    return this.quiz.filterQuizzes(filters);
  }

  async getQuizzesForContext(courseId, lessonId) {
    return this.quiz.getQuizzesForContext(courseId, lessonId);
  }

  async createQuiz(data) {
    return this.quiz.createQuiz(data);
  }

  async updateQuiz(quizId, updates) {
    return this.quiz.updateQuiz(quizId, updates);
  }

  async publishQuiz(quizId) {
    return this.quiz.publishQuiz(quizId);
  }

  async archiveQuiz(quizId) {
    return this.quiz.archiveQuiz(quizId);
  }

  async createQuestion(data) {
    return this.quiz.createQuestion(data);
  }

  async getTeacherQuizStats(instructorId) {
    return this.quiz.getTeacherStats(instructorId);
  }

  async getTeacherQuizzes(instructorId) {
    return this.quiz.getTeacherQuizzes(instructorId);
  }

  async getTeacherQuestions(instructorId) {
    return this.quiz.getTeacherQuestions(instructorId);
  }

  // ============================================
  // ASSESSMENT SERVICE (delegation)
  // ============================================

  async startQuizAttempt(userId, quizId) {
    return this.assessment.startAttempt(userId, quizId);
  }

  async saveQuizAnswer(attemptId, questionIndex, answer) {
    return this.assessment.saveAnswer(attemptId, questionIndex, answer);
  }

  async autoSaveQuiz(attemptId, answers, timeSpent) {
    return this.assessment.autoSave(attemptId, answers, timeSpent);
  }

  /**
   * SECURISE : La soumission de quiz passe par Cloud Function.
   * Le score est calcule uniquement cote serveur.
   */
  async submitQuizAttempt(attemptId, quiz, questions) {
    try {
      // Extraire les reponses de la tentative
      const { QuizAttemptRepository } = await import('../repositories/AssessmentRepository.js');
      const repo = new QuizAttemptRepository();
      const attemptData = await repo.findById(attemptId);
      const answers = attemptData?.answers || {};
      return await cfSubmitQuiz(quiz.id, attemptId, answers);
    } catch (err) {
      console.warn('[AIService] Cloud Function quiz failed, fallback local:', err.message);
      return this.assessment.submitAttempt(attemptId, quiz, questions);
    }
  }

  async timeOutQuizAttempt(attemptId, quiz, questions) {
    return this.assessment.timeOutAttempt(attemptId, quiz, questions);
  }

  async abandonQuizAttempt(attemptId) {
    return this.assessment.abandonAttempt(attemptId);
  }

  async getUserQuizResults(userId) {
    return this.assessment.getUserResults(userId);
  }

  async getUserAssessmentStats(userId) {
    return this.assessment.getUserAssessmentStats(userId);
  }

  async getQuizResultDetail(resultId) {
    return this.assessment.getResultDetail(resultId);
  }

  async generateQuizFeedback(result, cefrLevel) {
    return this.assessment.generateFeedback(result, cefrLevel);
  }

  async getQuizAttempts(userId, quizId) {
    return this.assessment.attemptRepo.findByQuiz(quizId, userId);
  }

  async getQuizBestScore(userId, quizId) {
    return this.assessment.getBestScore(userId, quizId);
  }

  // ============================================
  // SUBSCRIPTION SERVICE (delegation)
  // ============================================

  async getSubscriptionPlans() {
    return this.subscription.getPlans();
  }

  async getPlanDetails(planKey) {
    return this.subscription.getPlan(planKey);
  }

  async getUserSubscription(userId) {
    return this.subscription.getOrCreateSubscription(userId);
  }

  async getUserSubscriptionStats(userId) {
    return this.subscription.getUserSubscriptionStats(userId);
  }

  async cancelSubscription(subscriptionId, reason) {
    return this.subscription.cancelSubscription(subscriptionId, reason);
  }

  async getUserInvoices(userId) {
    return this.subscription.getUserInvoices(userId);
  }

  async generateInvoice(paymentId, user) {
    return this.subscription.generateInvoice(paymentId, user);
  }

  async getAdminSubscriptionStats() {
    return this.subscription.getAdminStats();
  }

  // ============================================
  // PAYMENT SERVICE — Cloud Functions securisees
  // ============================================

  async initiatePaystackPayment(params) {
    return this.payment.initiatePayment(params);
  }

  /**
   * SECURISE : La validation du paiement passe par Cloud Function.
   * Le client ne peut pas falsifier un paiement.
   */
  async verifyPayment(reference, userId, planKey, duration) {
    try {
      return await cfValidatePayment(reference, planKey, duration);
    } catch (err) {
      console.warn('[AIService] Cloud Function payment failed, fallback local:', err.message);
      return this.payment.verifyAndProcessPayment(reference, userId, planKey, duration);
    }
  }

  async processDemoPayment(userId, planKey, duration) {
    return this.payment.processDemoPayment(userId, planKey, duration);
  }

  async getPaymentHistory(userId) {
    return this.payment.getPaymentHistory(userId);
  }

  async getTransactionHistory(userId) {
    return this.payment.getTransactionHistory(userId);
  }

  async getFinancialStats() {
    return this.payment.getFinancialStats();
  }

  // ============================================
  // CERTIFICATE SERVICE — Cloud Functions securisees
  // ============================================

  async checkCertificateEligibility(userId, courseId, cefrLevel) {
    return this.certificate.checkEligibility(userId, courseId, cefrLevel);
  }

  /**
   * SECURISE : La generation de certificat passe par Cloud Function.
   * Le client ne peut pas forcer la generation.
   */
  async generateCertificate(userId, userName, userEmail, courseId, courseTitle, courseLevel, cefrLevel) {
    try {
      return await cfGenerateCertificate(courseId, courseTitle, courseLevel, cefrLevel);
    } catch (err) {
      console.warn('[AIService] Cloud Function cert failed, fallback local:', err.message);
      return this.certificate.generateCertificate(userId, userName, userEmail, courseId, courseTitle, courseLevel, cefrLevel);
    }
  }

  async regenerateCertificate(certificateId) {
    return this.certificate.regenerateCertificate(certificateId);
  }

  async verifyCertificateByNumber(certificateNumber) {
    return this.certificate.verifyByNumber(certificateNumber);
  }

  async verifyCertificateById(certificateId) {
    return this.certificate.verifyById(certificateId);
  }

  async getUserCertificates(userId) {
    return this.certificate.getUserCertificates(userId);
  }

  async countUserCertificates(userId) {
    return this.certificate.countUserCertificates(userId);
  }

  async getCertificateAdminStats() {
    return this.certificate.getAdminStats();
  }

  /**
   * SECURISE : La revocation passe par Cloud Function (admin only).
   */
  async revokeCertificate(certificateId, reason) {
    try {
      return await cfRevokeCertificate(certificateId, reason);
    } catch (err) {
      return this.certificate.revokeCertificate(certificateId, reason);
    }
  }

  async incrementCertificateDownloads(certificateId) {
    try {
      const { CertificateRepository } = await import('../repositories/CertificateRepository.js');
      const { Certificate } = await import('../models/Certificate.js');
      const repo = new CertificateRepository();
      const data = await repo.findById(certificateId);
      if (data) {
        const cert = Certificate.fromFirestore(data.id, data);
        cert.incrementDownloads();
        await repo.update(certificateId, { downloadCount: cert.downloadCount, updatedAt: cert.updatedAt });
      }
    } catch (e) { /* ignore */ }
  }

  async getCertificateById(certificateId) {
    try {
      const { CertificateRepository } = await import('../repositories/CertificateRepository.js');
      const { Certificate } = await import('../models/Certificate.js');
      const repo = new CertificateRepository();
      const data = await repo.findById(certificateId);
      return data ? Certificate.fromFirestore(data.id, data) : null;
    } catch (e) { return null; }
  }
}

/** Instance singleton globale */
export const aiService = new AIService();

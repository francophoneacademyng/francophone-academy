/**
 * QuizService.js
 * Service de gestion des quiz et questions.
 * CRUD quiz, banque de questions, filtrage CECRL.
 *
 * Controller -> QuizService -> QuizRepository + QuestionRepository
 */

import { QuizRepository } from '../repositories/QuizRepository.js';
import { QuestionRepository } from '../repositories/QuestionRepository.js';
import { Quiz, EXAM_TYPES } from '../models/Quiz.js';
import { Question } from '../models/Question.js';
import { translateFirebaseError } from '../utils/firebaseErrors.js';
import { CEFR_LEVELS } from '../config/firebase.js';

// ============================================
// DONNEES PAR DEFAUT — Banque de questions
// ============================================

const DEFAULT_QUESTIONS = {
  A1: [
    {
      text: "Comment dit-on 'bonjour' en francais ?",
      type: "multiple_choice",
      level: "A1",
      category: "vocabulary",
      skill: "vocabulary-greetings",
      difficulty: 1,
      points: 1,
      options: [
        { text: "Bonjour", isCorrect: true },
        { text: "Au revoir", isCorrect: false },
        { text: "Merci", isCorrect: false },
        { text: "S'il vous plait", isCorrect: false }
      ],
      explanation: "'Bonjour' est la salutation standard en francais.",
      timeEstimate: 30
    },
    {
      text: "Le verbe 'etre' a la 1ere personne du singulier (je) est :",
      type: "multiple_choice",
      level: "A1",
      category: "grammar",
      skill: "grammar-conjugation",
      difficulty: 1,
      points: 1,
      options: [
        { text: "suis", isCorrect: true },
        { text: "es", isCorrect: false },
        { text: "est", isCorrect: false },
        { text: "sommes", isCorrect: false }
      ],
      explanation: "'Je suis' est la conjugaison correcte du verbe 'etre'.",
      timeEstimate: 30
    },
    {
      text: "Completez : 'J'___ un livre.' (avoir)",
      type: "fill_in_blank",
      level: "A1",
      category: "grammar",
      skill: "grammar-conjugation",
      difficulty: 1,
      points: 1,
      acceptedAnswers: ["ai", "j'ai"],
      explanation: "'J'ai' est la conjugaison de 'avoir' a la premiere personne.",
      timeEstimate: 45
    },
    {
      text: "'Un chien' est :",
      type: "true_false",
      level: "A1",
      category: "vocabulary",
      skill: "vocabulary-animals",
      difficulty: 1,
      points: 1,
      correctAnswer: true,
      explanation: "'Un chien' est bien le mot francais pour 'a dog'.",
      timeEstimate: 20
    },
    {
      text: "Quel est l'article correct ? '___ table'",
      type: "multiple_choice",
      level: "A1",
      category: "grammar",
      skill: "grammar-articles",
      difficulty: 2,
      points: 1,
      options: [
        { text: "Le", isCorrect: false },
        { text: "La", isCorrect: true },
        { text: "Les", isCorrect: false },
        { text: "Un", isCorrect: false }
      ],
      explanation: "'Table' est feminin en francais, donc on utilise 'la'.",
      timeEstimate: 30
    },
    {
      text: "Traduisez : 'The cat'",
      type: "short_answer",
      level: "A1",
      category: "vocabulary",
      skill: "vocabulary-animals",
      difficulty: 1,
      points: 1,
      acceptedAnswers: ["le chat", "Le chat"],
      explanation: "'Le chat' = 'The cat'.",
      timeEstimate: 30
    },
    {
      text: "Classez les nombres par ordre croissant :",
      type: "ordering",
      level: "A1",
      category: "vocabulary",
      skill: "vocabulary-numbers",
      difficulty: 2,
      points: 1,
      correctOrder: ["un", "deux", "trois", "quatre"],
      explanation: "En francais : un (1), deux (2), trois (3), quatre (4).",
      timeEstimate: 45
    },
    {
      text: "Associez les couleurs :",
      type: "matching",
      level: "A1",
      category: "vocabulary",
      skill: "vocabulary-colors",
      difficulty: 1,
      points: 1,
      pairs: [
        { left: "Rouge", right: "Red" },
        { left: "Bleu", right: "Blue" },
        { left: "Vert", right: "Green" },
        { left: "Jaune", right: "Yellow" }
      ],
      explanation: "Rouge=Red, Bleu=Blue, Vert=Green, Jaune=Yellow.",
      timeEstimate: 60
    }
  ],
  A2: [
    {
      text: "Le passe compose de 'manger' avec 'nous' est :",
      type: "multiple_choice",
      level: "A2",
      category: "grammar",
      skill: "grammar-passe-compose",
      difficulty: 2,
      points: 1,
      options: [
        { text: "avons mange", isCorrect: true },
        { text: "sommes mange", isCorrect: false },
        { text: "avons mangé", isCorrect: false },
        { text: "ont mange", isCorrect: false }
      ],
      explanation: "'Nous avons mange' — verbe auxiliaire 'avoir' + participe passe 'mange'.",
      timeEstimate: 45
    },
    {
      text: "Completez : 'Hier, je ___ au cinema.' (aller)",
      type: "fill_in_blank",
      level: "A2",
      category: "grammar",
      skill: "grammar-passe-compose",
      difficulty: 2,
      points: 1,
      acceptedAnswers: ["suis allé", "suis allee", "suis alle"],
      explanation: "'Je suis alle' — 'aller' utilise l'auxiliaire 'etre'.",
      timeEstimate: 45
    },
    {
      text: "'Poser un lapin' signifie :",
      type: "multiple_choice",
      level: "A2",
      category: "vocabulary",
      skill: "vocabulary-idioms",
      difficulty: 3,
      points: 1,
      options: [
        { text: "Ne pas venir a un rendez-vous", isCorrect: true },
        { text: "Offrir un animal", isCorrect: false },
        { text: "Poser une question bete", isCorrect: false },
        { text: "Faire du sport", isCorrect: false }
      ],
      explanation: "'Poser un lapin' = ne pas se presenter a un rendez-vous.",
      timeEstimate: 45
    },
    {
      text: "L'imparfait decrit une action :",
      type: "true_false",
      level: "A2",
      category: "grammar",
      skill: "grammar-imparfait",
      difficulty: 2,
      points: 1,
      correctAnswer: true,
      context: "L'imparfait est utilise pour decrire une action en cours dans le passe ou une habitude.",
      explanation: "Vrai — l'imparfait decrit des actions habituelles ou en cours dans le passe.",
      timeEstimate: 30
    },
    {
      text: "Quelle est la difference entre 'savoir' et 'connaitre' ?",
      type: "short_answer",
      level: "A2",
      category: "vocabulary",
      skill: "vocabulary-verbs",
      difficulty: 3,
      points: 2,
      acceptedAnswers: ["savoir = connaissance intellectuelle, connaitre = familiarite", "savoir c'est savoir faire quelque chose, connaitre c'est etre familiar avec"],
      explanation: "'Savoir' = connaissance intellectuelle/factual. 'Connaitre' = familiarite avec une personne ou un lieu.",
      timeEstimate: 60
    }
  ],
  B1: [
    {
      text: "Le subjonctif s'utilise apres :",
      type: "multiple_choice",
      level: "B1",
      category: "grammar",
      skill: "grammar-subjonctif",
      difficulty: 3,
      points: 1,
      options: [
        { text: "Je pense que", isCorrect: false },
        { text: "Il faut que", isCorrect: true },
        { text: "Je sais que", isCorrect: false },
        { text: "Il est evident que", isCorrect: false }
      ],
      explanation: "Le subjonctif suit 'il faut que', exprimant une necessite ou un souhait.",
      timeEstimate: 45
    },
    {
      text: "Completez : 'Il faut que nous ___ la verite.' (savoir)",
      type: "fill_in_blank",
      level: "B1",
      category: "grammar",
      skill: "grammar-subjonctif",
      difficulty: 3,
      points: 1,
      acceptedAnswers: ["sachions"],
      explanation: "'Sachions' — subjonctif present de 'savoir' (nous).",
      timeEstimate: 45
    },
    {
      text: "Expliquez l'utilisation du conditionnel dans : 'Je voudrais un cafe.'",
      type: "open_ended",
      level: "B1",
      category: "grammar",
      skill: "grammar-conditionnel",
      difficulty: 3,
      points: 2,
      keywords: ["politesse", "souhait", "hypothese", "demande"],
      explanation: "Le conditionnel exprime ici la politesse dans une demande.",
      timeEstimate: 90
    },
    {
      text: "Associez les expressions avec leur signification :",
      type: "matching",
      level: "B1",
      category: "vocabulary",
      skill: "vocabulary-idioms",
      difficulty: 3,
      points: 1,
      pairs: [
        { left: "Avoir le cafard", right: "Etre triste" },
        { left: "Couter les yeux de la tete", right: "Tres cher" },
        { left: "Poser un lapin", right: "Ne pas venir" },
        { left: "Tomber dans les pommes", right: "S'evanouir" }
      ],
      explanation: "Ce sont des expressions idiomatiques courantes en francais.",
      timeEstimate: 60
    }
  ],
  B2: [
    {
      text: "Transformez en discours indirect : 'Je viendrai demain', a-t-il dit.",
      type: "fill_in_blank",
      level: "B2",
      category: "grammar",
      skill: "grammar-discours-indirect",
      difficulty: 4,
      points: 1,
      acceptedAnswers: ["Il a dit qu'il viendrait le lendemain", "il a dit qu'il viendrait le lendemain"],
      explanation: "Futur → conditionnel, 'demain' → 'le lendemain' en discours indirect.",
      timeEstimate: 60
    },
    {
      text: "Quelle figure de style utilise Victor Hugo dans : 'La nuit etoilee' ?",
      type: "multiple_choice",
      level: "B2",
      category: "vocabulary",
      skill: "vocabulary-figures-style",
      difficulty: 4,
      points: 1,
      options: [
        { text: "Metaphore", isCorrect: true },
        { text: "Synecdoque", isCorrect: false },
        { text: "Hyperbole", isCorrect: false },
        { text: "Antithese", isCorrect: false }
      ],
      explanation: "'La nuit etoilee' est une metaphore — substitution imagee.",
      timeEstimate: 45
    },
    {
      text: "Analysez la difference entre 'pourtant', 'cependant' et 'toutefois'.",
      type: "open_ended",
      level: "B2",
      category: "vocabulary",
      skill: "vocabulary-connecteurs",
      difficulty: 4,
      points: 2,
      keywords: ["opposition", "nuance", "registre", "soutenu", "contraste"],
      explanation: "Trois connecteurs d'opposition avec des nuances de registre.",
      timeEstimate: 90
    },
    {
      text: "'Avoir lieu' signifie :",
      type: "multiple_choice",
      level: "B2",
      category: "vocabulary",
      skill: "vocabulary-expressions",
      difficulty: 4,
      points: 1,
      options: [
        { text: "Etre debout", isCorrect: false },
        { text: "Se produire", isCorrect: true },
        { text: "Avoir un endroit", isCorrect: false },
        { text: "Partir", isCorrect: false }
      ],
      explanation: "'Avoir lieu' = se produire, se derouler (evenement).",
      timeEstimate: 30
    }
  ],
  C1: [
    {
      text: "Reformulez avec le gerondif : 'Pendant que je lisais, j'ai compris.'",
      type: "fill_in_blank",
      level: "C1",
      category: "grammar",
      skill: "grammar-gerondif",
      difficulty: 5,
      points: 1,
      acceptedAnswers: ["En lisant, j'ai compris", "En lisant j'ai compris"],
      explanation: "Le gerondif exprime la simultaneite : 'En + participe present'.",
      timeEstimate: 60
    },
    {
      text: "Analysez la construction de 'Il n'y a pas que de cela' sous l'angle de la ne expletive.",
      type: "open_ended",
      level: "C1",
      category: "grammar",
      skill: "grammar-ne-expletive",
      difficulty: 5,
      points: 2,
      keywords: ["ne expletive", "pleonastique", "registre soutenu", "euphonie", "negation"],
      explanation: "La ne expletive est un ne pleonastique sans valeur negative, typique du registre soutenu.",
      timeEstimate: 120
    },
    {
      text: "Classez ces mots du plus familier au plus soutenu :",
      type: "ordering",
      level: "C1",
      category: "vocabulary",
      skill: "vocabulary-registres",
      difficulty: 5,
      points: 1,
      correctOrder: ["bosser", "travailler", "oeuvrer"],
      explanation: "Familier : 'bosser' | Courant : 'travailler' | Soutenu : 'oeuvrer'.",
      timeEstimate: 45
    }
  ],
  C2: [
    {
      text: "Redigez une analyse stylistique de la phrase : 'Le vent s'etait leve.'",
      type: "open_ended",
      level: "C2",
      category: "vocabulary",
      skill: "vocabulary-stylistique",
      difficulty: 5,
      points: 3,
      keywords: ["plussquamperfait", "passivite", "agent", "atmosphere", "individuation"],
      explanation: "Le plussquamperfait et le pronom reflechi creent une atmosphere d'ineluctabilite.",
      timeEstimate: 180
    },
    {
      text: "Analysez l'emploi du subjonctif dans : 'Je crains qu'il ne pleuve.'",
      type: "open_ended",
      level: "C2",
      category: "grammar",
      skill: "grammar-subjonctif-avance",
      difficulty: 5,
      points: 2,
      keywords: ["ne expletive", "crainte", "emotion", "subjonctif", "pleonasme"],
      explanation: "Apres 'craindre', le subjonctif avec ne expletive exprime une crainte.",
      timeEstimate: 120
    }
  ]
};

// Quizzes par defaut
const DEFAULT_QUIZZES = [
  { title: "Quiz A1 — Salutations et presentations", level: "A1", category: "general", duration: 10, examType: EXAM_TYPES.PRACTICE, skills: ["vocabulary-greetings", "grammar-conjugation", "vocabulary-numbers"] },
  { title: "Quiz A1 — Articles et noms", level: "A1", category: "grammar", duration: 10, examType: EXAM_TYPES.PRACTICE, skills: ["grammar-articles", "vocabulary-animals", "vocabulary-colors"] },
  { title: "Quiz A2 — Le passe compose", level: "A2", category: "grammar", duration: 15, examType: EXAM_TYPES.PRACTICE, skills: ["grammar-passe-compose", "vocabulary-idioms", "grammar-imparfait"] },
  { title: "Quiz A2 — Vocabulaire quotidien", level: "A2", category: "vocabulary", duration: 15, examType: EXAM_TYPES.PRACTICE, skills: ["vocabulary-verbs", "vocabulary-idioms"] },
  { title: "Quiz B1 — Le subjonctif", level: "B1", category: "grammar", duration: 15, examType: EXAM_TYPES.PRACTICE, skills: ["grammar-subjonctif", "grammar-conditionnel", "vocabulary-idioms"] },
  { title: "Quiz B1 — Expressions idiomatiques", level: "B1", category: "vocabulary", duration: 15, examType: EXAM_TYPES.PRACTICE, skills: ["vocabulary-idioms", "vocabulary-connecteurs"] },
  { title: "Quiz B2 — Discours rapporte et figures de style", level: "B2", category: "grammar", duration: 20, examType: EXAM_TYPES.PRACTICE, skills: ["grammar-discours-indirect", "vocabulary-figures-style", "vocabulary-expressions"] },
  { title: "Quiz C1 — Constructions complexes", level: "C1", category: "grammar", duration: 20, examType: EXAM_TYPES.PRACTICE, skills: ["grammar-gerondif", "grammar-ne-expletive", "vocabulary-registres"] },
  { title: "Quiz C2 — Analyse litteraire", level: "C2", category: "vocabulary", duration: 25, examType: EXAM_TYPES.PRACTICE, skills: ["vocabulary-stylistique", "grammar-subjonctif-avance"] },
  { title: "DELF A1 — Simulation complete", level: "A1", category: "general", duration: 30, examType: EXAM_TYPES.DELF, passingScore: 50, skills: ["vocabulary-greetings", "grammar-conjugation", "grammar-articles", "vocabulary-numbers"] },
  { title: "DELF A2 — Simulation complete", level: "A2", category: "general", duration: 30, examType: EXAM_TYPES.DELF, passingScore: 50, skills: ["grammar-passe-compose", "vocabulary-idioms", "vocabulary-verbs"] },
  { title: "TCF — Test de positionnement", level: "B1", category: "general", duration: 45, examType: EXAM_TYPES.TCF, passingScore: 60, skills: ["grammar-subjonctif", "vocabulary-idioms", "grammar-conditionnel", "vocabulary-connecteurs"] }
];

// ============================================
// QUIZ SERVICE
// ============================================

export class QuizService {
  constructor() {
    this.quizRepo = new QuizRepository();
    this.questionRepo = new QuestionRepository();
    this._seeded = false;
  }

  // ============================================
  // INITIALISATION — Donnees par defaut
  // ============================================

  /**
   * Initialise la banque de questions si Firestore est vide.
   */
  async seedDefaults() {
    if (this._seeded) return;
    try {
      const existing = await this.quizRepo.findPublished();
      if (existing.length > 0) {
        this._seeded = true;
        return;
      }

      // Creer les questions par niveau
      const allQuestions = [];
      Object.entries(DEFAULT_QUESTIONS).forEach(([level, questions]) => {
        questions.forEach(q => {
          allQuestions.push({ ...q, level });
        });
      });

      // Sauvegarder les questions
      const savedQuestions = [];
      for (const qData of allQuestions) {
        const question = Question.create(qData);
        await this.questionRepo.create(question.id, question.toFirestore());
        savedQuestions.push(question);
      }

      // Creer les quizzes avec references aux questions
      for (const qzData of DEFAULT_QUIZZES) {
        const levelQuestions = savedQuestions.filter(q => q.level === qzData.level);
        const quiz = Quiz.create({
          ...qzData,
          questionIds: levelQuestions.map(q => q.id),
          questionCount: levelQuestions.length
        });
        await this.quizRepo.create(quiz.id, quiz.toFirestore());
      }

      this._seeded = true;
    } catch (err) {
      console.error('[QuizService.seedDefaults]', err);
    }
  }

  // ============================================
  // QUIZZES
  // ============================================

  /**
   * Liste les quizzes disponibles pour un utilisateur.
   * @param {string} userLevel
   * @returns {Promise<Array<Object>>}
   */
  async getCatalog(userLevel = 'A1') {
    await this.seedDefaults();
    try {
      const allQuizzes = await this.quizRepo.findPublished();
      const levels = Object.values(CEFR_LEVELS);
      const userIdx = levels.indexOf(userLevel);

      // Filtrer par niveau (quiz du niveau courant ou inferieur)
      return allQuizzes.filter(q => {
        const quizIdx = levels.indexOf(q.level);
        return quizIdx <= userIdx + 1; // Niveau courant + 1 niveau au-dessus
      }).sort((a, b) => {
        const idxA = levels.indexOf(a.level);
        const idxB = levels.indexOf(b.level);
        return idxA - idxB;
      });
    } catch (err) {
      console.error('[QuizService.getCatalog]', err);
      return [];
    }
  }

  /**
   * Charge un quiz avec ses questions.
   * @param {string} quizId
   * @returns {Promise<{quiz: Quiz|null, questions: Array<Question>, error: string|null}>}
   */
  async getQuizWithQuestions(quizId) {
    await this.seedDefaults();
    try {
      const quizData = await this.quizRepo.findById(quizId);
      if (!quizData) return { quiz: null, questions: [], error: 'Quiz introuvable' };

      const quiz = Quiz.fromFirestore(quizId, quizData);

      // Charger les questions
      let questions = [];
      if (quiz.questionIds?.length > 0) {
        const qData = await this.questionRepo.findMany(quiz.questionIds);
        questions = qData.map(d => Question.fromFirestore(d.id, d));
      }

      return { quiz, questions, error: null };
    } catch (err) {
      console.error('[QuizService.getQuizWithQuestions]', err);
      return { quiz: null, questions: [], error: translateFirebaseError(err) };
    }
  }

  /**
   * Filtre les quizzes par categorie et niveau.
   */
  async filterQuizzes(filters = {}) {
    await this.seedDefaults();
    try {
      let quizzes = [];
      if (filters.level && filters.category) {
        quizzes = await this.quizRepo.query(
          where('level', '==', filters.level),
          where('category', '==', filters.category),
          where('isPublished', '==', true)
        );
      } else if (filters.level) {
        quizzes = await this.quizRepo.findByLevel(filters.level);
      } else if (filters.category) {
        quizzes = await this.quizRepo.findByCategory(filters.category);
      } else {
        quizzes = await this.quizRepo.findPublished();
      }
      return quizzes;
    } catch (err) {
      return [];
    }
  }

  /**
   * Trouve les quizzes pour un cours/lecon.
   */
  async getQuizzesForContext(courseId, lessonId) {
    await this.seedDefaults();
    try {
      if (lessonId) {
        return await this.quizRepo.findByLesson(lessonId);
      }
      if (courseId) {
        return await this.quizRepo.findByCourse(courseId);
      }
      return [];
    } catch (err) {
      return [];
    }
  }

  // ============================================
  // CRUD TEACHER
  // ============================================

  /**
   * Cree un nouveau quiz (enseignant).
   */
  async createQuiz(data) {
    try {
      const quiz = Quiz.create(data);
      await this.quizRepo.create(quiz.id, quiz.toFirestore());
      return { quiz, error: null };
    } catch (err) {
      return { quiz: null, error: translateFirebaseError(err) };
    }
  }

  /**
   * Met a jour un quiz.
   */
  async updateQuiz(quizId, updates) {
    try {
      await this.quizRepo.update(quizId, { ...updates, updatedAt: new Date().toISOString() });
      return { error: null };
    } catch (err) {
      return { error: translateFirebaseError(err) };
    }
  }

  /**
   * Publie un quiz.
   */
  async publishQuiz(quizId) {
    return this.updateQuiz(quizId, { isPublished: true });
  }

  /**
   * Archive un quiz.
   */
  async archiveQuiz(quizId) {
    return this.updateQuiz(quizId, { isArchived: true, isPublished: false });
  }

  /**
   * Cree une question dans la banque.
   */
  async createQuestion(data) {
    try {
      const question = Question.create(data);
      await this.questionRepo.create(question.id, question.toFirestore());
      return { question, error: null };
    } catch (err) {
      return { question: null, error: translateFirebaseError(err) };
    }
  }

  /**
   * Liste les questions d'un enseignant.
   */
  async getTeacherQuestions(instructorId) {
    try {
      return await this.questionRepo.findByInstructor(instructorId);
    } catch (err) {
      return [];
    }
  }

  /**
   * Liste les quizzes d'un enseignant.
   */
  async getTeacherQuizzes(instructorId) {
    try {
      return await this.quizRepo.findByInstructor(instructorId);
    } catch (err) {
      return [];
    }
  }

  /**
   * Stats pour le teacher dashboard.
   */
  async getTeacherStats(instructorId) {
    try {
      const [quizzes, questions] = await Promise.all([
        this.getTeacherQuizzes(instructorId),
        this.getTeacherQuestions(instructorId)
      ]);

      const publishedCount = quizzes.filter(q => q.isPublished).length;
      const archivedCount = quizzes.filter(q => q.isArchived).length;

      return {
        totalQuizzes: quizzes.length,
        published: publishedCount,
        drafts: quizzes.length - publishedCount - archivedCount,
        archived: archivedCount,
        totalQuestions: questions.length,
        byLevel: quizzes.reduce((acc, q) => {
          acc[q.level] = (acc[q.level] || 0) + 1;
          return acc;
        }, {})
      };
    } catch (err) {
      return { totalQuizzes: 0, published: 0, drafts: 0, archived: 0, totalQuestions: 0, byLevel: {} };
    }
  }
}

/** Instance singleton */
export const quizService = new QuizService();

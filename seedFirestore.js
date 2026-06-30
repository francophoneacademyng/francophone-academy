#!/usr/bin/env node
/**
 * seedFirestore.js
 * Script d'initialisation idempotent de Firestore pour Francophone Academy.
 *
 * Ce script crée :
 *   - 8 cours CECRL (A1, A2, B1, B2, C1, C2 + 2 examens)
 *   - ~24 modules (3 par cours)
 *   - ~72 lecons (3 par module)
 *   - 6 quiz avec questions types
 *   - 1 compte admin par defaut
 *
 * Usage :
 *   export GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/serviceAccountKey.json
 *   node seedFirestore.js
 *
 * Idempotent : relancer le script ne cree pas de doublons.
 */

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION — Firebase Admin SDK via clé de service
// ============================================

const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Constantes du domaine (dupliquees pour eviter la dependance ES modules)
const CEFR_LEVELS = { A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2', C1: 'C1', C2: 'C2' };
const ROLES = { STUDENT: 'student', TEACHER: 'teacher', ADMIN: 'admin', SUPERADMIN: 'superadmin' };
const SUBSCRIPTION_PLANS = { FREE: 'free', STANDARD: 'standard', PREMIUM: 'premium', ENTERPRISE: 'enterprise' };

const COLLECTIONS = {
  COURSES: 'courses',
  MODULES: 'modules',
  LESSONS: 'lessons',
  QUIZZES: 'quizzes',
  QUESTIONS: 'questions',
  USERS: 'users',
  ENROLLMENTS: 'enrollments',
  STUDENT_PROGRESS: 'student_progress',
  SUBSCRIPTIONS: 'subscriptions',
  CERTIFICATES: 'certificates',
  CERTIFICATE_TEMPLATES: 'certificate_templates',
  CHAT_SESSIONS: 'chat_sessions',
  TUTOR_MEMORY: 'tutor_memory',
  PAYMENTS: 'payments',
  TRANSACTIONS: 'transactions',
  INVOICES: 'invoices',
  NOTIFICATIONS: 'notifications'
};

const now = () => admin.firestore.FieldValue.serverTimestamp();
const ts = () => new Date().toISOString();

// ============================================
// UTILITAIRES IDEMPOTENCE
// ============================================

/**
 * Verifie si un document existe deja (par ID explicite ou par champ unique).
 */
async function exists(collection, docId) {
  const snap = await db.collection(collection).doc(docId).get();
  return snap.exists;
}

/**
 * Cherche un document par un champ (pour l'idempotence sur les slugs).
 */
async function findByField(collection, field, value) {
  const snap = await db.collection(collection).where(field, '==', value).limit(1).get();
  return snap.empty ? null : { id: snap.docs[0].id, data: snap.docs[0].data() };
}

/**
 * Cree un document s'il n'existe pas deja.
 */
async function createIfNotExists(collection, docId, data) {
  if (await exists(collection, docId)) {
    console.log(`  [SKIP] ${collection}/${docId} existe deja`);
    return { id: docId, existed: true };
  }
  await db.collection(collection).doc(docId).set(data);
  console.log(`  [CREATE] ${collection}/${docId}`);
  return { id: docId, existed: false };
}

// ============================================
// DONNEES : 8 COURS CECRL
// ============================================

const COURSES_DATA = [
  {
    id: 'course_a1_beginner',
    title: 'Francais Debutant A1',
    shortDescription: 'Apprenez les bases du francais : presentations, nombres, expressions quotidiennes.',
    description: 'Ce cours complet de niveau A1 vous guide depuis les premieres salutations jusqu\'aux conversations simples de la vie quotidienne. Vous apprendrez a vous presenter, poser des questions, et comprendre les consignes de base.',
    level: CEFR_LEVELS.A1,
    category: 'general',
    duration: 720,
    price: 0,
    currency: 'EUR',
    tags: ['debutant', 'grammaire', 'vocabulaire', 'conversation'],
    objectives: [
      'Se presenter et presenter quelqu\'un',
      'Comprendre et utiliser des expressions familieres',
      'Poser et repondre a des questions simples',
      'Interagir de facon simple si l\'interlocuteur parle lentement'
    ],
    prerequisites: ['Aucun — ce cours est concu pour les debutants complets'],
    instructorName: 'Prof. Marie Dubois',
    status: 'published',
    language: 'fr',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800'
  },
  {
    id: 'course_a2_elementary',
    title: 'Francais Elementaire A2',
    shortDescription: 'Developpez vos competences : shopping, voyages, passe, futur.',
    description: 'Passez au niveau superieur avec ce cours A2 qui couvre les situations de la vie quotidienne : faire du shopping, decrire vos voyages, parler de vos experiences passees et de vos projets futurs.',
    level: CEFR_LEVELS.A2,
    category: 'general',
    duration: 780,
    price: 0,
    currency: 'EUR',
    tags: ['elementaire', 'grammaire', 'voyages', 'shopping'],
    objectives: [
      'Comprendre des phrases isolees et expressions courantes',
      'Decrire son entourage, ses activites quotidiennes',
      'Raconter un voyage ou une experience',
      'Exprimer des projets futurs simples'
    ],
    prerequisites: ['Niveau A1 ou connaissances equivalentes'],
    instructorName: 'Prof. Thomas Martin',
    status: 'published',
    language: 'fr',
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800'
  },
  {
    id: 'course_b1_intermediate',
    title: 'Francais Intermediaire B1',
    shortDescription: 'Devenez autonome : opinions, descriptions, communication au travail.',
    description: 'Avec le niveau B1, vous serez capable de faire face a la plupart des situations rencontrees en voyage, de produire un discours simple et coherent, et de decrire vos reves, espoirs et ambitions.',
    level: CEFR_LEVELS.B1,
    category: 'general',
    duration: 900,
    price: 0,
    currency: 'EUR',
    tags: ['intermediaire', 'autonomie', 'expression', 'travail'],
    objectives: [
      'Comprendre les points essentiels d\'un message clair',
      'Evoluer dans la plupart des situations de voyage',
      'Produire un discours simple et coherent',
      'Raconter un evenement, decrire des espoirs et reves'
    ],
    prerequisites: ['Niveau A2 ou connaissances equivalentes'],
    instructorName: 'Prof. Sophie Laurent',
    status: 'published',
    language: 'fr',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800'
  },
  {
    id: 'course_b2_upper_intermediate',
    title: 'Francais Avance B2',
    shortDescription: 'Maitrisez le francais : debats, articles techniques, interactions spontanees.',
    description: 'Le niveau B2 vous permet de comprendre un discours complexe, de communiquer avec un degre de spontaneite et d\'aisance, et de vous exprimer de maniere claire et detaillee sur une grande gamme de sujets.',
    level: CEFR_LEVELS.B2,
    category: 'general',
    duration: 960,
    price: 0,
    currency: 'EUR',
    tags: ['avance', 'debat', 'technique', 'autonomie'],
    objectives: [
      'Comprendre des textes complexes concrets ou abstraits',
      'Communiquer avec spontaneite et aisance',
      'S\'exprimer clairement sur de nombreux sujets',
      'Emettre des opinions et defendre des idees'
    ],
    prerequisites: ['Niveau B1 ou connaissances equivalentes'],
    instructorName: 'Prof. Alexandre Bernard',
    status: 'published',
    language: 'fr',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800'
  },
  {
    id: 'course_c1_advanced',
    title: 'Francais Maitrise C1',
    shortDescription: 'Expression fluide : articles longs, implications implicites, usage social.',
    description: 'Au niveau C1, vous comprenez une grande gamme de textes longs et exigeants. Vous vous exprimez de facon fluide et spontanee sans trop chercher vos mots, et vous utilisez le francais de maniere efficace dans un contexte social ou professionnel.',
    level: CEFR_LEVELS.C1,
    category: 'general',
    duration: 1020,
    price: 0,
    currency: 'EUR',
    tags: ['maitrise', 'expression-fluide', 'litterature', 'professionnel'],
    objectives: [
      'Comprendre des textes longs et exigeants',
      'S\'exprimer spontanement sans trop chercher ses mots',
      'Utiliser le francais efficacement dans un contexte social/professionnel',
      'Exprimer des idees avec precision et nuancer son opinion'
    ],
    prerequisites: ['Niveau B2 ou connaissances equivalentes'],
    instructorName: 'Prof. Claire Rousseau',
    status: 'published',
    language: 'fr',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800'
  },
  {
    id: 'course_c2_mastery',
    title: 'Francais Expert C2',
    shortDescription: 'Excellence : restructuration spontanee, nuances, precision absolue.',
    description: 'Le niveau C2 represente la maitrise complete. Vous comprenez sans effort pratiquement tout ce que vous lisez ou entendez, vous pouvez restituer faits et arguments en les reliant coherentement, et vous vous exprimez avec precision et fluidite.',
    level: CEFR_LEVELS.C2,
    category: 'general',
    duration: 1080,
    price: 0,
    currency: 'EUR',
    tags: ['expert', 'maitrise-totale', 'litterature-avancee', 'recherche'],
    objectives: [
      'Comprendre sans effort tout type de discours',
      'Restituer faits et arguments de sources ecrites et orales',
      'S\'exprimer spontanement avec precision',
      'Distinguer les nuances de sens meme en situation complexe'
    ],
    prerequisites: ['Niveau C1 ou connaissances equivalentes'],
    instructorName: 'Prof. Philippe Moreau',
    status: 'published',
    language: 'fr',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800'
  },
  {
    id: 'course_delf_prep',
    title: 'Preparation DELF B1/B2',
    shortDescription: 'Entrainement cible pour reussir le DELF avec des exercices types et des simulations.',
    description: 'Cette preparation intensive au DELF (Diplome d\'Etudes en Langue Francaise) couvre les 4 epreuves : comprehension orale, comprehension ecrite, production orale et production ecrite. Inclut des examens blancs complets.',
    level: CEFR_LEVELS.B1,
    category: 'delf',
    duration: 600,
    price: 2900,
    currency: 'XOF',
    tags: ['delf', 'certification', 'examen', 'preparation'],
    objectives: [
      'Maitriser le format des 4 epreuves DELF',
      'Developper des strategies de gestion du temps',
      'S\'entrainer avec des sujets reels d\'examens blancs',
      'Obtenir une certification officielle du CECRL'
    ],
    prerequisites: ['Niveau B1 minimum recommande'],
    instructorName: 'Examinateur Agnes Petit',
    status: 'published',
    language: 'fr',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800'
  },
  {
    id: 'course_professional',
    title: 'Francais Professionnel',
    shortDescription: 'Francais des affaires : emails, presentations, negociations, reseaux.',
    description: 'Ce cours specialise vous prepare a utiliser le francais dans un contexte professionnel. Vous apprendrez a rediger des emails, faire des presentations, participer a des reunions et negocier en francais.',
    level: CEFR_LEVELS.B2,
    category: 'professional',
    duration: 540,
    price: 3500,
    currency: 'XOF',
    tags: ['professionnel', 'affaires', 'b2b', 'corporate'],
    objectives: [
      'Rediger des emails professionnels en francais',
      'Faire une presentation orale convaincante',
      'Participer activement aux reunions',
      'Negocier et argumenter dans un contexte d\'affaires'
    ],
    prerequisites: ['Niveau B1 minimum recommande'],
    instructorName: 'Consultant Jean-Louis Fournier',
    status: 'published',
    language: 'fr',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800'
  }
];

// ============================================
// DONNEES : MODULES
// ============================================

function makeModules(courseId) {
  const templates = {
    course_a1_beginner: [
      { id: `${courseId}_mod1`, title: 'Module 1 : Salutations et Presentations', description: 'Apprenez a vous saluer, vous presenter et presenter les autres dans des situations courantes.', order: 1 },
      { id: `${courseId}_mod2`, title: 'Module 2 : La Vie Quotidienne', description: 'Decouvrez le vocabulaire de la vie quotidienne : famille, maison, nourriture, et horaires.', order: 2 },
      { id: `${courseId}_mod3`, title: 'Module 3 : Sortir et Voyager', description: 'Apprenez a vous orienter, demander votre chemin, et communiquer dans les transports.', order: 3 }
    ],
    course_a2_elementary: [
      { id: `${courseId}_mod1`, title: 'Module 1 : Le Passe et les Experiences', description: 'Maitrisez le passe compose et l\'imparfait pour raconter vos experiences.', order: 1 },
      { id: `${courseId}_mod2`, title: 'Module 2 : Voyages et Loisirs', description: 'Vocabulaire du voyage, des transports, et des activites de loisirs.', order: 2 },
      { id: `${courseId}_mod3`, title: 'Module 3 : Projets et Futur', description: 'Exprimez vos projets, vos souhaits, et apprenez a utiliser le futur simple.', order: 3 }
    ],
    course_b1_intermediate: [
      { id: `${courseId}_mod1`, title: 'Module 1 : Expression de l\'Opinion', description: 'Apprenez a donner votre avis, argumenter, et debattre sur des sujets varies.', order: 1 },
      { id: `${courseId}_mod2`, title: 'Module 2 : Le Monde du Travail', description: 'Vocabulaire professionnel, entretiens d\'embauche, et communication en entreprise.', order: 2 },
      { id: `${courseId}_mod3`, title: 'Module 3 : Culture et Societe', description: 'Decouvrez la culture francophone a travers ses traditions, medias, et actualites.', order: 3 }
    ],
    course_b2_upper_intermediate: [
      { id: `${courseId}_mod1`, title: 'Module 1 : Analyse et Argumentation', description: 'Techniques d\'analyse critique, structuration d\'arguments, et expression nuancee.', order: 1 },
      { id: `${courseId}_mod2`, title: 'Module 2 : Francais Technique', description: 'Registres techniques, scientifiques, et journalistiques du francais.', order: 2 },
      { id: `${courseId}_mod3`, title: 'Module 3 : Debats et Discours', description: 'Preparation et tenue de debats, presentation de discours structures.', order: 3 }
    ],
    course_c1_advanced: [
      { id: `${courseId}_mod1`, title: 'Module 1 : Expression Complexe', description: 'Subtilites grammaticales, registres de langue, et style rhetorique.', order: 1 },
      { id: `${courseId}_mod2`, title: 'Module 2 : Litterature et Pensee', description: 'Analyse de textes litteraires et philosophiques francophones.', order: 2 },
      { id: `${courseId}_mod3`, title: 'Module 3 : Usage Professionnel Avance', description: 'Negociation complexe, mediation, et communication interculturelle.', order: 3 }
    ],
    course_c2_mastery: [
      { id: `${courseId}_mod1`, title: 'Module 1 : Discours et Restitution', description: 'Restitution precise de discours complexes, reformulation parfaite.', order: 1 },
      { id: `${courseId}_mod2`, title: 'Module 2 : Ecriture de Haut Niveau', description: 'Ecriture academique, editoriaux, et creation litteraire avancee.', order: 2 },
      { id: `${courseId}_mod3`, title: 'Module 3 : Maitrise Totale', description: 'Perfectionnement des nuances, idiomes rares, et adaptation a tout contexte.', order: 3 }
    ],
    course_delf_prep: [
      { id: `${courseId}_mod1`, title: 'Module 1 : Comprehension Ecrite', description: 'Strategies de lecture, exercices de comprehension, et gestion du temps.', order: 1 },
      { id: `${courseId}_mod2`, title: 'Module 2 : Comprehension et Production Orales', description: 'Ecoute d\'enregistrements, expression orale, et simulations d\'entretien.', order: 2 },
      { id: `${courseId}_mod3`, title: 'Module 3 : Production Ecrite + Examens Blancs', description: 'Redaction d\'essais, examens blancs complets, et corrections detaillees.', order: 3 }
    ],
    course_professional: [
      { id: `${courseId}_mod1`, title: 'Module 1 : Communication Ecrite Professionnelle', description: 'Emails, rapports, comptes-rendus, et correspondance commerciale.', order: 1 },
      { id: `${courseId}_mod2`, title: 'Module 2 : Presentations et Reunions', description: 'Techniques de presentation, animation de reunions, et prise de parole.', order: 2 },
      { id: `${courseId}_mod3`, title: 'Module 3 : Negociation et Reseautage', description: 'Strategies de negociation, networking, et relations professionnelles.', order: 3 }
    ]
  };
  return templates[courseId] || [];
}

// ============================================
// DONNEES : LECONS
// ============================================

function makeLessons(courseId, moduleId, moduleIndex, moduleTitle) {
  const lessons = [];
  const bases = [
    {
      title: `Lecon 1 : ${moduleTitle.split(' : ')[1] || 'Fondamentaux'} — Partie 1`,
      type: 'theory',
      duration: 20,
      content: [
        { type: 'heading', text: 'Objectifs de la lecon' },
        { type: 'paragraph', text: 'Dans cette lecon, nous explorerons les concepts fondamentaux du module a travers des explications claires et des exemples concrets.' },
        { type: 'heading', text: 'Points cles' },
        { type: 'list', items: ['Concept theorique principal', 'Regles de grammaire essentielles', 'Vocabulaire de base'] },
        { type: 'callout', text: 'Astuce : Prenez des notes et repeteze les exemples a voix haute.' }
      ]
    },
    {
      title: `Lecon 2 : ${moduleTitle.split(' : ')[1] || 'Pratique'} — Exercices et Applications`,
      type: 'exercise',
      duration: 25,
      content: [
        { type: 'heading', text: 'Mise en pratique' },
        { type: 'paragraph', text: 'Appliquez ce que vous avez appris a travers des exercices interactifs et des jeux de role.' },
        { type: 'heading', text: 'Exercices' },
        { type: 'exercise', instruction: 'Completez les phrases avec le bon mot.', items: ['Je ___ (etre) etudiant.', 'Nous ___ (avoir) un chat.'] },
        { type: 'callout', text: 'Verifiez vos reponses avant de passer a la lecon suivante.' }
      ]
    },
    {
      title: `Lecon 3 : ${moduleTitle.split(' : ')[1] || 'Synthese'} — Culture et Revision`,
      type: 'culture',
      duration: 15,
      content: [
        { type: 'heading', text: 'Culture francophone' },
        { type: 'paragraph', text: 'Decouvrez un aspect culturel du monde francophone a travers des textes, videos, et anecdotes.' },
        { type: 'heading', text: 'Revision du module' },
        { type: 'list', items: ['Resume des points cles', 'Quiz rapide de verification', 'Ressources supplementaires'] }
      ]
    }
  ];

  bases.forEach((base, i) => {
    lessons.push({
      id: `${moduleId}_l${i + 1}`,
      courseId,
      moduleId,
      title: base.title,
      description: `Lecon ${i + 1} du ${moduleTitle.toLowerCase()}`,
      order: i + 1,
      type: base.type,
      duration: base.duration,
      content: base.content,
      vocabulary: [],
      grammar: [],
      resources: [],
      objectives: ['Comprendre les concepts cles', 'Appliquer les connaissances', 'Evaluer sa comprehension'],
      hasQuiz: i === 2, // Seule la derniere lecon a un quiz
      status: 'published'
    });
  });

  return lessons;
}

// ============================================
// DONNEES : QUIZ
// ============================================

const QUIZZES_DATA = [
  {
    id: 'quiz_a1_grammar',
    title: 'Quiz : Grammaire A1',
    description: 'Testez vos connaissances en grammaire de base : articles, pronoms, verbes au present.',
    level: CEFR_LEVELS.A1,
    category: 'grammar',
    duration: 10,
    passingScore: 60,
    maxAttempts: 3,
    skills: ['grammaire', 'conjugaison', 'articles'],
    isPublished: true
  },
  {
    id: 'quiz_a2_comprehension',
    title: 'Quiz : Comprehension A2',
    description: 'Evaluez votre capacite a comprendre des textes et dialogues de niveau elementaire.',
    level: CEFR_LEVELS.A2,
    category: 'comprehension',
    duration: 15,
    passingScore: 60,
    maxAttempts: 3,
    skills: ['comprehension-ecrite', 'vocabulaire', 'expressions'],
    isPublished: true
  },
  {
    id: 'quiz_b1_conversation',
    title: 'Quiz : Expression et Conversation B1',
    description: 'Testez votre capacite a vous exprimer et a comprendre des situations de la vie courante.',
    level: CEFR_LEVELS.B1,
    category: 'vocabulary',
    duration: 20,
    passingScore: 65,
    maxAttempts: 3,
    skills: ['expression-orale', 'vocabulaire', 'situations-sociales'],
    isPublished: true
  },
  {
    id: 'quiz_b2_advanced_grammar',
    title: 'Quiz : Grammaire Avancee B2',
    description: 'Subjonctif, conditionnel, discours rapporte : maitrisez les structures complexes.',
    level: CEFR_LEVELS.B2,
    category: 'grammar',
    duration: 20,
    passingScore: 65,
    maxAttempts: 3,
    skills: ['subjonctif', 'conditionnel', 'discours-rapporte'],
    isPublished: true
  },
  {
    id: 'quiz_c1_literature',
    title: 'Quiz : Litterature et Culture C1',
    description: 'Analyse litteraire, mouvements culturels, et nuances de la langue francaise.',
    level: CEFR_LEVELS.C1,
    category: 'culture',
    duration: 25,
    passingScore: 70,
    maxAttempts: 3,
    skills: ['litterature', 'analyse-textuelle', 'culture'],
    isPublished: true
  },
  {
    id: 'quiz_delf_practice',
    title: 'Examen Blanc DELF B1',
    description: 'Simulation complete de l\'examen DELF B1 avec les 4 epreuves.',
    level: CEFR_LEVELS.B1,
    category: 'delf',
    duration: 45,
    passingScore: 50,
    maxAttempts: 5,
    skills: ['comprehension-orale', 'comprehension-ecrite', 'production-orale', 'production-ecrite'],
    isPublished: true
  }
];

// ============================================
// DONNEES : QUESTIONS
// ============================================

function makeQuestionsForQuiz(quizId) {
  const pools = {
    quiz_a1_grammar: [
      { text: 'Quel article definit convient ? "___ chat dort sur le canape."', type: 'multiple_choice', level: 'A1', category: 'grammar', skill: 'articles', difficulty: 1, points: 1, explanation: 'On utilise "le" car c\'est un nom masculin singulier defini.', options: [{ text: 'Le', isCorrect: true }, { text: 'La', isCorrect: false }, { text: 'Les', isCorrect: false }, { text: 'Un', isCorrect: false }] },
      { text: 'Completez : "Je ___ (etre) etudiant."', type: 'fill_in_blank', level: 'A1', category: 'grammar', skill: 'conjugaison', difficulty: 1, points: 1, explanation: '"Etre" au present pour "je" se conjugue "suis".', acceptedAnswers: ['suis'] },
      { text: '"Tu" est un pronom personnel.', type: 'true_false', level: 'A1', category: 'grammar', skill: 'pronoms', difficulty: 1, points: 1, explanation: '"Tu" est bien un pronom personnel de la deuxieme personne du singulier.', correctAnswer: true },
      { text: 'Conjuguez : "Nous ___ (avoir) deux chiens."', type: 'short_answer', level: 'A1', category: 'grammar', skill: 'conjugaison', difficulty: 1, points: 1, explanation: '"Avoir" au present pour "nous" se conjugue "avons".', acceptedAnswers: ['avons'] },
      { text: 'Quel est l\'infinitif du verbe "mangeons" ?', type: 'multiple_choice', level: 'A1', category: 'grammar', skill: 'verbes', difficulty: 2, points: 1, explanation: '"Mangeons" vient de l\'infinitif "manger".', options: [{ text: 'Manger', isCorrect: true }, { text: 'Mange', isCorrect: false }, { text: 'Mangons', isCorrect: false }, { text: 'Mangé', isCorrect: false }] },
      { text: 'Rangez les saisons dans l\'ordre : Printemps, Ete, Hiver, Automne', type: 'ordering', level: 'A1', category: 'vocabulary', skill: 'saisons', difficulty: 1, points: 1, explanation: 'L\'ordre chronologique des saisons est : Printemps, Ete, Automne, Hiver.', correctOrder: ['Printemps', 'Ete', 'Automne', 'Hiver'] },
      { text: 'Associez les couleurs :', type: 'matching', level: 'A1', category: 'vocabulary', skill: 'couleurs', difficulty: 1, points: 2, explanation: 'Les fruits sont associes a leur couleur caracteristique.', pairs: [{ left: 'Pomme', right: 'Rouge' }, { left: 'Banane', right: 'Jaune' }, { left: 'Ciel', right: 'Bleu' }, { left: 'Herbe', right: 'Vert' }] },
      { text: 'Decrivez votre routine matinale en 3 phrases.', type: 'open_ended', level: 'A1', category: 'expression', skill: 'description', difficulty: 2, points: 3, explanation: 'Une bonne reponse decrit plusieurs activites avec des heures et des verbes conjugues.', keywords: ['matin', 'reveil', 'petit-dejeuner', 'travail', 'ecole', 'heure'] }
    ],
    quiz_a2_comprehension: [
      { text: 'Quel temps fait-il quand il pleut ?', type: 'multiple_choice', level: 'A2', category: 'comprehension', skill: 'meteo', difficulty: 1, points: 1, explanation: 'Quand il pleut, le temps est "pluvieux".', options: [{ text: 'Il fait beau', isCorrect: false }, { text: 'Il fait pluvieux', isCorrect: true }, { text: 'Il fait du vent', isCorrect: false }, { text: 'Il fait chaud', isCorrect: false }] },
      { text: '"Hier" est un adverbe de temps au passe.', type: 'true_false', level: 'A2', category: 'grammar', skill: 'adverbes', difficulty: 1, points: 1, explanation: '"Hier" designe le jour precedent, c\'est bien un adverbe de temps au passe.', correctAnswer: true },
      { text: 'Completez : "Je suis alle ___ cinema."', type: 'fill_in_blank', level: 'A2', category: 'grammar', skill: 'prepositions', difficulty: 1, points: 1, explanation: 'On dit "au cinema" (contraction de a + le).', acceptedAnswers: ['au', 'au cinema', 'au cinéma'] },
      { text: 'Mettez les phrases dans l\'ordre pour raconter une journee :', type: 'ordering', level: 'A2', category: 'comprehension', skill: 'chronologie', difficulty: 2, points: 2, explanation: 'L\'ordre chronologique d\'une journee est : reveil, petit-dejeuner, travail, dejeuner, loisirs, coucher.', correctOrder: ['Je me reveille a 7h.', 'Je prends mon petit-dejeuner.', 'Je vais au travail.', 'Je dejeune avec mes collegues.', 'Je fais du sport.', 'Je me couche a 23h.'] },
      { text: 'Associez les mots a leur contraire :', type: 'matching', level: 'A2', category: 'vocabulary', skill: 'antonymes', difficulty: 1, points: 2, explanation: 'Les antonymes sont les mots de sens oppose.', pairs: [{ left: 'Grand', right: 'Petit' }, { left: 'Chaud', right: 'Froid' }, { left: 'Rapide', right: 'Lent' }, { left: 'Heureux', right: 'Triste' }] },
      { text: 'Quel est le feminin de "acteur" ?', type: 'short_answer', level: 'A2', category: 'vocabulary', skill: 'genres', difficulty: 1, points: 1, explanation: 'Le feminin d\'"acteur" est "actrice".', acceptedAnswers: ['actrice'] }
    ],
    quiz_b1_conversation: [
      { text: 'Quelle phrase exprime un avis ?', type: 'multiple_choice', level: 'B1', category: 'expression', skill: 'opinion', difficulty: 2, points: 1, explanation: '"Je pense que..." est une formule typique pour exprimer un avis.', options: [{ text: 'Il fait 25 degres.', isCorrect: false }, { text: 'Je pense que c\'est une bonne idee.', isCorrect: true }, { text: 'Le train part a 14h.', isCorrect: false }, { text: 'La France est en Europe.', isCorrect: false }] },
      { text: 'Completez avec le subjonctif : "Il faut que tu ___ (etre) ponctuel."', type: 'fill_in_blank', level: 'B1', category: 'grammar', skill: 'subjonctif', difficulty: 3, points: 1, explanation: '"Etre" au subjonctif present pour "tu" se conjugue "sois".', acceptedAnswers: ['sois'] },
      { text: '"Bien que" introduit une proposition concessive.', type: 'true_false', level: 'B1', category: 'grammar', skill: 'concession', difficulty: 2, points: 1, explanation: '"Bien que" est bien une conjonction de subordination concessives.', correctAnswer: true },
      { text: 'Associez les expressions a leur registre :', type: 'matching', level: 'B1', category: 'culture', skill: 'registres', difficulty: 2, points: 2, explanation: 'Les expressions varient selon le registre de langue.', pairs: [{ left: 'Je vous prie d\'agreer...', right: 'Soutenu' }, { left: 'Salut, ca va ?', right: 'Familier' }, { left: 'Bonjour, comment allez-vous ?', right: 'Courant' }, { left: 'Quoi de neuf ?', right: 'Tres familier' }] },
      { text: 'Redigez un email de reclamation a votre proprietaire (100-150 mots).', type: 'open_ended', level: 'B1', category: 'expression', skill: 'redaction', difficulty: 3, points: 5, explanation: 'Une bonne reponse doit contenir : formule de politesse, description du probleme, demande claire, formule de cloture.', keywords: ['reclamation', 'probleme', 'reparer', 'appartement', 'proprietaire', 'politesse', 'solution'] }
    ],
    quiz_b2_advanced_grammar: [
      { text: 'Transformez a la voix passive : "Le chef a prepare le repas."', type: 'short_answer', level: 'B2', category: 'grammar', skill: 'voix-passive', difficulty: 3, points: 2, explanation: 'Le passif se forme avec l\'auxiliaire "etre" au meme temps que l\'actif + participe passe.', acceptedAnswers: ['Le repas a ete prepare par le chef.', 'Le repas a ete prepare par le chef', 'Le repas a été préparé par le chef'] },
      { text: 'Quelle proposition utilise le conditionnel passe ?', type: 'multiple_choice', level: 'B2', category: 'grammar', skill: 'conditionnel', difficulty: 3, points: 1, explanation: '"J\'aurais aime" est le conditionnel passe de "aimer".', options: [{ text: 'Je voudrais un cafe.', isCorrect: false }, { text: 'J\'aurais aime voyager.', isCorrect: true }, { text: 'Si j\'avais su, je serais venu.', isCorrect: false }, { text: 'Il faudra partir tot.', isCorrect: false }] },
      { text: '"Si j\'avais su, je serais venu" est une phrase au :', type: 'multiple_choice', level: 'B2', category: 'grammar', skill: 'hypothese', difficulty: 3, points: 1, explanation: 'C\'est une hypotheses du troisieme type (irreelle au passe) : si + plus-que-parfait, conditionnel passe.', options: [{ text: 'Present', isCorrect: false }, { text: 'Futur', isCorrect: false }, { text: 'Conditionnel passe (3e type)', isCorrect: true }, { text: 'Imperatif', isCorrect: false }] },
      { text: 'Completez avec le discours rapporte : Il a dit : "Je viens demain." → Il a dit qu\'il ___ le lendemain.', type: 'fill_in_blank', level: 'B2', category: 'grammar', skill: 'discours-rapporte', difficulty: 3, points: 1, explanation: '"Vient" (present) au discours rapporte devient "venait" (imparfait), et "demain" devient "le lendemain".', acceptedAnswers: ['venait'] }
    ],
    quiz_c1_literature: [
      { text: 'Quel mouvement litteraire est associe a Victor Hugo ?', type: 'multiple_choice', level: 'C1', category: 'culture', skill: 'litterature', difficulty: 3, points: 1, explanation: 'Victor Hugo est la figure emblematique du romantisme francais.', options: [{ text: 'Le Classicisme', isCorrect: false }, { text: 'Le Romantisme', isCorrect: true }, { text: 'Le Surrealisme', isCorrect: false }, { text: 'L\'Existentialisme', isCorrect: false }] },
      { text: 'Analysez la portee symbolique du "mal" dans Les Miserables (5-8 phrases).', type: 'open_ended', level: 'C1', category: 'litterature', skill: 'analyse', difficulty: 5, points: 8, explanation: 'Une bonne analyse explore le mal social (misere, injustice), le mal individuel (Thenardier), et la redemption (Jean Valjean).', keywords: ['redemption', 'misere', 'injustice', 'Jean Valjean', 'Javert', 'societe', 'amour', 'morale'] },
      { text: 'Le terme "oxymore" designe une figure de style reunissant deux termes contradictoires.', type: 'true_false', level: 'C1', category: 'grammar', skill: 'figures-de-style', difficulty: 2, points: 1, explanation: 'L\'oxymore (ex: "une douleur agreable") associe effectivement deux termes de sens oppose.', correctAnswer: true }
    ],
    quiz_delf_practice: [
      { text: 'Lisez le texte puis repondez : Quel est le sujet principal de ce passage ? (simulation)', type: 'multiple_choice', level: 'B1', category: 'comprehension', skill: 'comprehension-ecrite', difficulty: 2, points: 1, explanation: 'La question teste la comprehension du sujet principal d\'un texte argumentatif.', options: [{ text: 'Les avantages du velo en ville', isCorrect: true }, { text: 'L\'histoire du velo', isCorrect: false }, { text: 'Les differents types de velos', isCorrect: false }, { text: 'La fabrication des velos', isCorrect: false }] },
      { text: 'Apres avoir ecoute l\'audio (simulation), quelle est l\'attitude du locuteur ?', type: 'multiple_choice', level: 'B1', category: 'comprehension', skill: 'comprehension-orale', difficulty: 2, points: 1, explanation: 'La question evalue la capacite a identifier le ton et l\'attitude d\'un locuteur.', options: [{ text: 'Enthousiaste', isCorrect: false }, { text: 'Critique mais constructif', isCorrect: true }, { text: 'Indifferent', isCorrect: false }, { text: 'Colereux', isCorrect: false }] },
      { text: 'Redigez une lettre formelle de 160-180 mots pour demander un emploi (simulation DELF).', type: 'open_ended', level: 'B1', category: 'expression', skill: 'production-ecrite', difficulty: 4, points: 10, explanation: 'Les criteres d\'evaluation DELF : richesse lexicale, correction grammaticale, coherence, adequation a la consigne.', keywords: ['lettre', 'emploi', 'candidature', 'experience', 'competences', 'motivation', 'formule-politesse'] },
      { text: 'Le DELF B1 evalue 4 competences distinctes.', type: 'true_false', level: 'B1', category: 'delf', skill: 'format-examen', difficulty: 1, points: 1, explanation: 'Le DELF B1 evalue effectivement : CO, CE, PO, PE.', correctAnswer: true }
    ]
  };

  return (pools[quizId] || []).map((q, i) => ({
    id: `${quizId}_q${i + 1}`,
    ...q,
    createdBy: 'system_seed',
    createdAt: ts(),
    updatedAt: ts()
  }));
}

// ============================================
// SEED : COURSES
// ============================================

async function seedCourses() {
  console.log('\n--- COURSES ---');
  let created = 0;
  let skipped = 0;

  for (const course of COURSES_DATA) {
    const docId = course.id;
    const data = { ...course };
    delete data.id;
    data.createdAt = now();
    data.updatedAt = now();
    data.publishedAt = now();

    const result = await createIfNotExists(COLLECTIONS.COURSES, docId, data);
    if (result.existed) skipped++; else created++;
  }

  console.log(`  Resultat : ${created} cree(s), ${skipped} ignore(s)`);
  return { created, skipped };
}

// ============================================
// SEED : MODULES
// ============================================

async function seedModules() {
  console.log('\n--- MODULES ---');
  let created = 0;
  let skipped = 0;

  for (const course of COURSES_DATA) {
    const modules = makeModules(course.id);
    for (const mod of modules) {
      const data = {
        courseId: course.id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        lessons: [],
        lessonCount: 0,
        duration: 60,
        status: 'published',
        createdAt: now(),
        updatedAt: now()
      };

      const result = await createIfNotExists(COLLECTIONS.MODULES, mod.id, data);
      if (result.existed) skipped++; else created++;
    }
  }

  console.log(`  Resultat : ${created} cree(s), ${skipped} ignore(s)`);
  return { created, skipped };
}

// ============================================
// SEED : LESSONS
// ============================================

async function seedLessons() {
  console.log('\n--- LESSONS ---');
  let created = 0;
  let skipped = 0;

  for (const course of COURSES_DATA) {
    const modules = makeModules(course.id);
    for (let mi = 0; mi < modules.length; mi++) {
      const mod = modules[mi];
      const lessons = makeLessons(course.id, mod.id, mi, mod.title);

      // Creer un quiz pour la derniere lecon de chaque module si applicable
      let moduleQuizId = null;

      for (const lesson of lessons) {
        const data = { ...lesson };
        data.createdAt = now();
        data.updatedAt = now();

        // Lier le quiz module a la derniere lecon
        if (lesson.hasQuiz && moduleQuizId) {
          data.quizId = moduleQuizId;
        }

        const result = await createIfNotExists(COLLECTIONS.LESSONS, lesson.id, data);
        if (result.existed) skipped++; else created++;
      }
    }
  }

  console.log(`  Resultat : ${created} cree(s), ${skipped} ignore(s)`);
  return { created, skipped };
}

// ============================================
// SEED : QUIZZES
// ============================================

async function seedQuizzes() {
  console.log('\n--- QUIZZES ---');
  let created = 0;
  let skipped = 0;

  for (const quiz of QUIZZES_DATA) {
    const docId = quiz.id;
    const questions = makeQuestionsForQuiz(docId);
    const questionIds = questions.map(q => q.id);

    // D'abord creer les questions
    for (const q of questions) {
      const qData = { ...q };
      delete qData.id;
      await createIfNotExists(COLLECTIONS.QUESTIONS, q.id, {
        ...qData,
        createdAt: now(),
        updatedAt: now()
      });
    }

    const data = {
      title: quiz.title,
      description: quiz.description,
      level: quiz.level,
      category: quiz.category,
      examType: 'practice',
      questionIds,
      questionCount: questionIds.length,
      duration: quiz.duration,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      courseId: '',
      lessonId: '',
      moduleId: '',
      skills: quiz.skills,
      isPublished: quiz.isPublished,
      isArchived: false,
      createdBy: 'system_seed',
      createdAt: now(),
      updatedAt: now()
    };

    const result = await createIfNotExists(COLLECTIONS.QUIZZES, docId, data);
    if (result.existed) skipped++; else created++;
  }

  console.log(`  Resultat : ${created} cree(s), ${skipped} ignore(s)`);
  return { created, skipped };
}

// ============================================
// SEED : CERTIFICATE TEMPLATES
// ============================================

async function seedCertificateTemplates() {
  console.log('\n--- CERTIFICATE TEMPLATES ---');
  const templateId = 'template_default';

  if (await exists(COLLECTIONS.CERTIFICATE_TEMPLATES, templateId)) {
    console.log(`  [SKIP] Template existe deja`);
    return { created: 0, skipped: 1 };
  }

  await db.collection(COLLECTIONS.CERTIFICATE_TEMPLATES).doc(templateId).set({
    name: 'Certificat CECRL — Modele par defaut',
    description: 'Modele officiel de certification pour les niveaux CECRL A1-C2',
    organization: 'Francophone Academy',
    logoUrl: '',
    signatureName: 'Direction Pedagogique',
    signatureTitle: 'Francophone Academy',
    signatureImageUrl: '',
    backgroundColor: '#f8fafc',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    textColor: '#1e293b',
    fontFamily: 'Inter, sans-serif',
    isDefault: true,
    createdAt: now(),
    updatedAt: now()
  });

  console.log('  [CREATE] Template de certificat par defaut');
  return { created: 1, skipped: 0 };
}

// ============================================
// SEED : ADMIN USER (optionnel)
// ============================================

async function seedAdminUser() {
  console.log('\n--- ADMIN USER ---');

  const email = 'admin@francophone-academy.com';
  const uid = 'admin_default_001';

  if (await exists(COLLECTIONS.USERS, uid)) {
    console.log(`  [SKIP] Admin existe deja (UID: ${uid})`);
    return { created: 0, skipped: 1 };
  }

  // Creer le document utilisateur
  await db.collection(COLLECTIONS.USERS).doc(uid).set({
    uid,
    email,
    displayName: 'Administrateur',
    firstName: 'Admin',
    lastName: 'System',
    role: ROLES.SUPERADMIN,
    level: CEFR_LEVELS.C2,
    subscription: SUBSCRIPTION_PLANS.ENTERPRISE,
    emailVerified: true,
    isActive: true,
    country: 'FR',
    preferences: { language: 'fr', theme: 'light', notifications: true },
    createdAt: now(),
    updatedAt: now(),
    lastLoginAt: null
  });

  // Synchroniser les Custom Claims
  try {
    await auth.setCustomUserClaims(uid, {
      role: ROLES.SUPERADMIN,
      plan: SUBSCRIPTION_PLANS.ENTERPRISE,
      level: CEFR_LEVELS.C2
    });
    console.log('  [CREATE] Admin + Custom Claims (role: superadmin)');
  } catch (e) {
    console.log(`  [WARN] Document admin cree, mais impossible de definir les claims : ${e.message}`);
    console.log(`         L'utilisateur Firebase Auth n'existe pas encore. Creez-le via Auth, puis relancez le script.`);
  }

  return { created: 1, skipped: 0 };
}

// ============================================
// MISE A JOUR DES COURS (compteurs)
// ============================================

async function updateCourseCounters() {
  console.log('\n--- MISE A JOUR DES COMPTEURS COURS ---');

  for (const course of COURSES_DATA) {
    const modules = makeModules(course.id);
    const moduleIds = modules.map(m => m.id);
    let totalLessons = 0;

    for (const mod of modules) {
      const lessons = makeLessons(course.id, mod.id, 0, mod.title);
      totalLessons += lessons.length;
    }

    await db.collection(COLLECTIONS.COURSES).doc(course.id).update({
      modules: moduleIds,
      moduleCount: modules.length,
      lessonCount: totalLessons,
      quizCount: 1,
      updatedAt: now()
    });

    console.log(`  [UPDATE] ${course.id} : ${modules.length} modules, ${totalLessons} lecons`);
  }
}

// ============================================
// EXECUTION PRINCIPALE
// ============================================

async function main() {
  console.log('================================================');
  console.log('  Francophone Academy — Seed Firestore');
  console.log('================================================');
  console.log(`  Projet : ${admin.app().options.projectId || 'default'}`);
  console.log(`  Date   : ${new Date().toISOString()}`);
  console.log('  Mode   : IDEMPOTENT (relancer = sans doublons)');
  console.log('================================================');

  const stats = {
    courses: { created: 0, skipped: 0 },
    modules: { created: 0, skipped: 0 },
    lessons: { created: 0, skipped: 0 },
    quizzes: { created: 0, skipped: 0 },
    questions: { created: 0, skipped: 0 },
    certificateTemplates: { created: 0, skipped: 0 },
    adminUser: { created: 0, skipped: 0 }
  };

  try {
    stats.courses = await seedCourses();
    stats.modules = await seedModules();
    stats.lessons = await seedLessons();
    stats.quizzes = await seedQuizzes();
    stats.certificateTemplates = await seedCertificateTemplates();
    stats.adminUser = await seedAdminUser();
    await updateCourseCounters();

    console.log('\n================================================');
    console.log('  RESUME');
    console.log('================================================');
    const totalCreated = Object.values(stats).reduce((s, v) => s + v.created, 0);
    const totalSkipped = Object.values(stats).reduce((s, v) => s + v.skipped, 0);

    console.log(`  Cours             : ${stats.courses.created} cree(s), ${stats.courses.skipped} ignore(s)`);
    console.log(`  Modules           : ${stats.modules.created} cree(s), ${stats.modules.skipped} ignore(s)`);
    console.log(`  Lecons            : ${stats.lessons.created} cree(s), ${stats.lessons.skipped} ignore(s)`);
    console.log(`  Quiz              : ${stats.quizzes.created} cree(s), ${stats.quizzes.skipped} ignore(s)`);
    console.log(`  Templates certif. : ${stats.certificateTemplates.created} cree(s), ${stats.certificateTemplates.skipped} ignore(s)`);
    console.log(`  Admin             : ${stats.adminUser.created} cree(s), ${stats.adminUser.skipped} ignore(s)`);
    console.log('------------------------------------------------');
    console.log(`  TOTAL             : ${totalCreated} document(s) cree(s)`);
    console.log(`  TOTAL             : ${totalSkipped} document(s) ignore(s) (deja existants)`);
    console.log('================================================');
    console.log('  ✓ Seed termine avec succes !');
    console.log('================================================');
    console.log('\nProchaines etapes :');
    console.log('  1. Rafraichissez votre application web');
    console.log('  2. Verifiez que les cours s\'affichent');
    console.log('  3. Creez un compte utilisateur via Auth');
    console.log('  4. Testez l\'inscription a un cours');
    process.exit(0);
  } catch (error) {
    console.error('\n================================================');
    console.error('  ERREUR LORS DU SEED');
    console.error('================================================');
    console.error(error);
    process.exit(1);
  }
}

main();

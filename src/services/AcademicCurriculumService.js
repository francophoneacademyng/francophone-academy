/**
 * AcademicCurriculumService.js
 * Service metier pour le cadre academique de Francophone Academy.
 *
 * Hierarchie academique:
 * Program -> Level -> Module -> Unit -> Lesson -> Exercise -> Quiz -> Assignment -> Live Class -> Exam -> Certificate
 */

import { AcademicProgramRepository } from '../repositories/AcademicProgramRepository.js';
import { AcademicLevelRepository } from '../repositories/AcademicLevelRepository.js';
import { AcademicModuleRepository } from '../repositories/AcademicModuleRepository.js';
import { AcademicUnitRepository } from '../repositories/AcademicUnitRepository.js';
import { AcademicLessonRepository } from '../repositories/AcademicLessonRepository.js';
import { AcademicExerciseRepository } from '../repositories/AcademicExerciseRepository.js';
import { AcademicQuizRepository } from '../repositories/AcademicQuizRepository.js';
import { AcademicAssignmentRepository } from '../repositories/AcademicAssignmentRepository.js';
import { AcademicLiveClassRepository } from '../repositories/AcademicLiveClassRepository.js';
import { AcademicExamRepository } from '../repositories/AcademicExamRepository.js';
import { AcademicCertificateRepository } from '../repositories/AcademicCertificateRepository.js';

import { AcademicProgram } from '../models/AcademicProgram.js';
import { AcademicLevel } from '../models/AcademicLevel.js';
import { AcademicModule } from '../models/AcademicModule.js';
import { AcademicUnit } from '../models/AcademicUnit.js';
import { AcademicLesson } from '../models/AcademicLesson.js';
import { AcademicExercise } from '../models/AcademicExercise.js';
import { AcademicQuiz } from '../models/AcademicQuiz.js';
import { AcademicAssignment } from '../models/AcademicAssignment.js';
import { AcademicLiveClass } from '../models/AcademicLiveClass.js';
import { AcademicExam } from '../models/AcademicExam.js';
import { AcademicCertificate } from '../models/AcademicCertificate.js';

import { translateFirebaseError } from '../utils/firebaseErrors.js';

const DEFAULT_PROGRAM_ID = 'francophone-academy-core';

const DEFAULT_PROGRAM = {
  id: DEFAULT_PROGRAM_ID,
  code: 'FA-CURRICULUM-CORE',
  title: 'Francophone Academy Curriculum',
  description: 'Cadre academique principal pour la progression linguistique, professionnelle et culturelle.',
  language: 'fr',
  status: 'active'
};

const LEVEL_BLUEPRINTS = [
  {
    id: 'french-a1-foundations',
    code: 'A1',
    title: 'French A1 - Foundations',
    objectives: [
      'Maitriser les bases de communication quotidienne en francais.',
      'Construire un vocabulaire essentiel de survie.',
      'Comprendre et produire des phrases simples.'
    ],
    duration: { weeks: 12, guidedHours: 48, selfStudyHours: 24 },
    monthlyStructure: [
      { month: 1, focus: 'Alphabet, salutations, presentations', deliverables: ['Quiz de bases', 'Mini conversation guidee'] },
      { month: 2, focus: 'Famille, temps, lieux, routines', deliverables: ['Devoir oral court', 'Evaluation vocabulaire'] },
      { month: 3, focus: 'Situations pratiques du quotidien', deliverables: ['Simulation dialogue', 'Examen final A1'] }
    ],
    learningOutcomes: [
      'Se presenter et presenter une autre personne.',
      'Poser et repondre a des questions simples.',
      'Comprendre des messages courts et lents.'
    ],
    requiredSkills: ['Lecture de mots frequents', 'Prononciation de base', 'Conjugaison presente simple'],
    recommendedLiveClasses: ['Atelier de conversation debutant', 'Clinique pronunciation A1'],
    certificateRequirements: { minAttendanceRate: 80, minQuizScore: 65, minAssignmentScore: 65, examRequired: true, completionRate: 100 }
  },
  {
    id: 'french-a2-everyday-life',
    code: 'A2',
    title: 'French A2 - Everyday Life',
    objectives: [
      'Developper une autonomie de base dans la vie courante.',
      'Renforcer la grammaire usuelle (passes et futur proche).',
      'Participer a des echanges courts mais suivis.'
    ],
    duration: { weeks: 12, guidedHours: 54, selfStudyHours: 30 },
    monthlyStructure: [
      { month: 1, focus: 'Narration simple et experiences passees', deliverables: ['Quiz grammaire', 'Production ecrite'] },
      { month: 2, focus: 'Vie quotidienne, achats, services', deliverables: ['Role-play', 'Devoir comprehension'] },
      { month: 3, focus: 'Projets et intentions futures', deliverables: ['Presentation orale', 'Examen final A2'] }
    ],
    learningOutcomes: [
      'Interagir dans des situations de service.',
      'Rediger des messages personnels structures.',
      'Comprendre des annonces et instructions frequentes.'
    ],
    requiredSkills: ['Passe compose', 'Futur proche', 'Lexique quotidien et social'],
    recommendedLiveClasses: ['Conversation A2 en situation', 'Atelier grammaire active'],
    certificateRequirements: { minAttendanceRate: 80, minQuizScore: 70, minAssignmentScore: 70, examRequired: true, completionRate: 100 }
  },
  {
    id: 'french-b1-independence',
    code: 'B1',
    title: 'French B1 - Independence',
    objectives: [
      'Atteindre une communication autonome sur des sujets familiers.',
      'Structurer une opinion simple avec arguments.',
      'Comprendre des contenus authentiques moderes.'
    ],
    duration: { weeks: 16, guidedHours: 72, selfStudyHours: 40 },
    monthlyStructure: [
      { month: 1, focus: 'Revision avancee A2 et fluidite', deliverables: ['Quiz diagnostic', 'Discussion guidee'] },
      { month: 2, focus: 'Opinions, narration detaillee, experiences', deliverables: ['Devoir argumentatif 1', 'Evaluation orale'] },
      { month: 3, focus: 'Media et sujets de societe', deliverables: ['Quiz comprehension', 'Projet collaboratif'] },
      { month: 4, focus: 'Preparation examen niveau B1', deliverables: ['Examen blanc', 'Examen final B1'] }
    ],
    learningOutcomes: [
      'Soutenir un echange de 10 minutes sur un sujet connu.',
      'Ecrire un texte coherent de 180 a 220 mots.',
      'Comprendre l idee generale d emissions claires.'
    ],
    requiredSkills: ['Connecteurs logiques', 'Subjonctif de base', 'Prise de parole continue'],
    recommendedLiveClasses: ['Debat structure B1', 'Atelier expression ecrite B1'],
    certificateRequirements: { minAttendanceRate: 82, minQuizScore: 72, minAssignmentScore: 72, examRequired: true, completionRate: 100 }
  },
  {
    id: 'french-b2-advanced',
    code: 'B2',
    title: 'French B2 - Advanced',
    objectives: [
      'Communiquer avec aisance sur des sujets abstraits.',
      'Produire des argumentations solides.',
      'Consolider les registres de langue adaptes.'
    ],
    duration: { weeks: 16, guidedHours: 78, selfStudyHours: 48 },
    monthlyStructure: [
      { month: 1, focus: 'Expression argumentee avancee', deliverables: ['Essai 1', 'Quiz grammaire avancee'] },
      { month: 2, focus: 'Comprehension de documents complexes', deliverables: ['Synthese ecrite', 'Oral critique'] },
      { month: 3, focus: 'Prise de parole professionnelle', deliverables: ['Presentation professionnelle', 'Evaluation continue'] },
      { month: 4, focus: 'Consolidation et examen final B2', deliverables: ['Examen blanc complet', 'Examen final B2'] }
    ],
    learningOutcomes: [
      'Defendre une position avec nuance.',
      'Comprendre des conferences et podcasts standards.',
      'Rediger des textes argumentatifs structurants.'
    ],
    requiredSkills: ['Nuance lexicale', 'Structures complexes', 'Analyse critique'],
    recommendedLiveClasses: ['Masterclass argumentation B2', 'Clinique oral professionnel'],
    certificateRequirements: { minAttendanceRate: 85, minQuizScore: 75, minAssignmentScore: 75, examRequired: true, completionRate: 100 }
  },
  {
    id: 'french-c1-professional-mastery',
    code: 'C1',
    title: 'French C1 - Professional Mastery',
    objectives: [
      'Maitriser le francais academique et professionnel.',
      'Produire des interventions longues et precises.',
      'Analyser et synthetiser des contenus specialises.'
    ],
    duration: { weeks: 20, guidedHours: 96, selfStudyHours: 60 },
    monthlyStructure: [
      { month: 1, focus: 'Discours specialise et style', deliverables: ['Note de synthese', 'Quiz lexical avance'] },
      { month: 2, focus: 'Negociation et argumentation complexe', deliverables: ['Simulation reunion', 'Evaluation orale'] },
      { month: 3, focus: 'Ecriture professionnelle avancee', deliverables: ['Rapport professionnel', 'Feedback enseignant'] },
      { month: 4, focus: 'Presentation experte et prise de position', deliverables: ['Pitch expert', 'Examen blanc C1'] },
      { month: 5, focus: 'Validation finale', deliverables: ['Examen final C1', 'Portfolio'] }
    ],
    learningOutcomes: [
      'S exprimer spontanement avec precision.',
      'Conduire des presentations longues et convaincantes.',
      'Rediger des documents professionnels exigeants.'
    ],
    requiredSkills: ['Lexique specialise', 'Structuration de discours complexe', 'Pragmatique professionnelle'],
    recommendedLiveClasses: ['Atelier C1 communication professionnelle', 'Clinique ecriture experte'],
    certificateRequirements: { minAttendanceRate: 85, minQuizScore: 78, minAssignmentScore: 80, examRequired: true, completionRate: 100 }
  },
  {
    id: 'french-c2-expert',
    code: 'C2',
    title: 'French C2 - Expert',
    objectives: [
      'Atteindre une maitrise quasi native du francais.',
      'Intervenir avec finesse dans des contextes complexes.',
      'Mobiliser des registres linguistiques varies.'
    ],
    duration: { weeks: 24, guidedHours: 110, selfStudyHours: 70 },
    monthlyStructure: [
      { month: 1, focus: 'Precision stylistique et rhetorique', deliverables: ['Analyse critique', 'Debat evalue'] },
      { month: 2, focus: 'Comprehension de contenus denses', deliverables: ['Synthese avancee', 'Quiz expert'] },
      { month: 3, focus: 'Production ecrite de haut niveau', deliverables: ['Essai expert', 'Retour enseignant'] },
      { month: 4, focus: 'Prise de parole haute performance', deliverables: ['Conference simulee', 'Evaluation orale'] },
      { month: 5, focus: 'Consolidation C2', deliverables: ['Examen blanc C2', 'Plan de remediations'] },
      { month: 6, focus: 'Certification finale', deliverables: ['Examen final C2', 'Defense portfolio'] }
    ],
    learningOutcomes: [
      'Comprendre pratiquement toute forme de discours.',
      'Reformuler avec exactitude en contexte complexe.',
      'Adapter le style selon l audience et l objectif.'
    ],
    requiredSkills: ['Rhetorique avancee', 'Analyses multi-sources', 'Precision grammaticale complete'],
    recommendedLiveClasses: ['Seminaire C2 eloquence', 'Masterclass analyse critique'],
    certificateRequirements: { minAttendanceRate: 88, minQuizScore: 80, minAssignmentScore: 82, examRequired: true, completionRate: 100 }
  },
  {
    id: 'business-french',
    code: 'BUSINESS',
    title: 'Business French',
    objectives: [
      'Utiliser le francais dans les contextes d entreprise.',
      'Maitriser l ecriture professionnelle.',
      'Conduire reunions, presentations et negociations.'
    ],
    duration: { weeks: 12, guidedHours: 60, selfStudyHours: 32 },
    monthlyStructure: [
      { month: 1, focus: 'Emails, etiquette et communication interne', deliverables: ['Cas pratique email', 'Quiz communication'] },
      { month: 2, focus: 'Reunions, presentations et reporting', deliverables: ['Simulation reunion', 'Presentation evaluee'] },
      { month: 3, focus: 'Negociation et relation client', deliverables: ['Role-play commercial', 'Examen final business'] }
    ],
    learningOutcomes: [
      'Rediger des ecrits professionnels efficaces.',
      'Animer ou participer a une reunion en francais.',
      'Negocier avec clarte et diplomatie.'
    ],
    requiredSkills: ['Lexique business', 'Communication interculturelle', 'Structuration de presentation'],
    recommendedLiveClasses: ['Business speaking clinic', 'Atelier negociation en francais'],
    certificateRequirements: { minAttendanceRate: 85, minQuizScore: 75, minAssignmentScore: 78, examRequired: true, completionRate: 100 }
  },
  {
    id: 'delf-preparation',
    code: 'DELF',
    title: 'DELF Preparation',
    objectives: [
      'Preparer les candidats aux epreuves DELF.',
      'Installer des strategies d examen.',
      'Maximiser la performance en comprehension et production.'
    ],
    duration: { weeks: 10, guidedHours: 50, selfStudyHours: 30 },
    monthlyStructure: [
      { month: 1, focus: 'Format DELF et diagnostic', deliverables: ['Test de positionnement', 'Plan de progression'] },
      { month: 2, focus: 'Entrainement intensif aux epreuves', deliverables: ['Examen blanc 1', 'Feedback cible'] },
      { month: 3, focus: 'Simulation complete et remediation', deliverables: ['Examen blanc 2', 'Examen final DELF'] }
    ],
    learningOutcomes: [
      'Comprendre les criteres d evaluation DELF.',
      'Gerer le temps et les consignes en examen.',
      'Produire des reponses conformes aux attentes officielles.'
    ],
    requiredSkills: ['Gestion du temps', 'Strategies d examen', 'Auto-correction ciblee'],
    recommendedLiveClasses: ['Atelier oral DELF', 'Correction collective epreuves blanches'],
    certificateRequirements: { minAttendanceRate: 85, minQuizScore: 75, minAssignmentScore: 75, examRequired: true, completionRate: 100 }
  },
  {
    id: 'dalf-preparation',
    code: 'DALF',
    title: 'DALF Preparation',
    objectives: [
      'Preparer aux exigences DALF (C1/C2).',
      'Renforcer analyse, synthese et argumentation.',
      'Developper des performances orales avancees.'
    ],
    duration: { weeks: 12, guidedHours: 66, selfStudyHours: 40 },
    monthlyStructure: [
      { month: 1, focus: 'Cadrage DALF et attentes evaluatives', deliverables: ['Diagnostic DALF', 'Plan de remediation'] },
      { month: 2, focus: 'Epreuves ecrites avancees', deliverables: ['Synthese notee', 'Quiz methodologie'] },
      { month: 3, focus: 'Epreuves orales et simulations', deliverables: ['Oral blanc DALF', 'Examen final DALF'] }
    ],
    learningOutcomes: [
      'Maitriser les methodes de synthese et dissertation.',
      'Argumenter avec coherence et profondeur.',
      'Presenter oralement avec precision et confiance.'
    ],
    requiredSkills: ['Analyse documentaire', 'Argumentation complexe', 'Expression orale avancee'],
    recommendedLiveClasses: ['Masterclass oral DALF', 'Atelier synthese documentaire'],
    certificateRequirements: { minAttendanceRate: 88, minQuizScore: 78, minAssignmentScore: 80, examRequired: true, completionRate: 100 }
  },
  {
    id: 'pronunciation',
    code: 'PRON',
    title: 'Pronunciation',
    objectives: [
      'Ameliorer la clarte phonologique et l intelligibilite.',
      'Corriger les interferences phonemiques frequentes.',
      'Developper rythme, accentuation et intonation.'
    ],
    duration: { weeks: 8, guidedHours: 32, selfStudyHours: 24 },
    monthlyStructure: [
      { month: 1, focus: 'Sons, liaisons et enchainements', deliverables: ['Diagnostic phonologique', 'Quiz perception auditive'] },
      { month: 2, focus: 'Intonation et fluidite', deliverables: ['Enregistrement evalue', 'Examen final pronunciation'] }
    ],
    learningOutcomes: [
      'Prononcer avec une meilleure intelligibilite.',
      'Utiliser les liaisons et rythmes de facon naturelle.',
      'Auto-corriger les erreurs phonologiques majeures.'
    ],
    requiredSkills: ['Discrimination auditive', 'Imitation phonologique', 'Pratique orale reguliere'],
    recommendedLiveClasses: ['Laboratoire de prononciation', 'Coaching oral individuel'],
    certificateRequirements: { minAttendanceRate: 80, minQuizScore: 70, minAssignmentScore: 72, examRequired: true, completionRate: 100 }
  },
  {
    id: 'francophone-culture',
    code: 'CULTURE',
    title: 'Francophone Culture',
    objectives: [
      'Comprendre la diversite des espaces francophones.',
      'Developper la competence interculturelle.',
      'Relier langue, histoire, societe et pratiques culturelles.'
    ],
    duration: { weeks: 8, guidedHours: 28, selfStudyHours: 20 },
    monthlyStructure: [
      { month: 1, focus: 'Histoire, geographie et societes francophones', deliverables: ['Quiz culturel', 'Journal reflexif'] },
      { month: 2, focus: 'Arts, medias et communication interculturelle', deliverables: ['Presentation culturelle', 'Projet final culturel'] }
    ],
    learningOutcomes: [
      'Identifier les grandes aires de la francophonie.',
      'Analyser des references culturelles en contexte.',
      'Adapter la communication selon les codes culturels.'
    ],
    requiredSkills: ['Lecture contextuelle', 'Ecoute active interculturelle', 'Capacite de comparaison critique'],
    recommendedLiveClasses: ['Cafe culturel francophone', 'Debat interculturel'],
    certificateRequirements: { minAttendanceRate: 75, minQuizScore: 68, minAssignmentScore: 70, examRequired: true, completionRate: 100 }
  }
];

function levelIdsFromBlueprints() {
  return LEVEL_BLUEPRINTS.map(level => level.id);
}

export class AcademicCurriculumService {
  constructor() {
    this.programRepo = new AcademicProgramRepository();
    this.levelRepo = new AcademicLevelRepository();
    this.moduleRepo = new AcademicModuleRepository();
    this.unitRepo = new AcademicUnitRepository();
    this.lessonRepo = new AcademicLessonRepository();
    this.exerciseRepo = new AcademicExerciseRepository();
    this.quizRepo = new AcademicQuizRepository();
    this.assignmentRepo = new AcademicAssignmentRepository();
    this.liveClassRepo = new AcademicLiveClassRepository();
    this.examRepo = new AcademicExamRepository();
    this.certificateRepo = new AcademicCertificateRepository();
  }

  async bootstrapProgram(programId = DEFAULT_PROGRAM_ID) {
    try {
      const existingProgram = await this.programRepo.findById(programId);
      if (!existingProgram) {
        const payload = new AcademicProgram({
          ...DEFAULT_PROGRAM,
          id: programId,
          levelIds: levelIdsFromBlueprints()
        }).toFirestore();
        await this.programRepo.createProgram(programId, payload);
      } else {
        await this.programRepo.updateProgram(programId, { levelIds: levelIdsFromBlueprints() });
      }

      for (let index = 0; index < LEVEL_BLUEPRINTS.length; index += 1) {
        const blueprint = LEVEL_BLUEPRINTS[index];
        const existingLevel = await this.levelRepo.findById(blueprint.id);
        const payload = new AcademicLevel({
          ...blueprint,
          order: index + 1,
          programId,
          status: 'active'
        }).toFirestore();

        if (!existingLevel) {
          await this.levelRepo.createLevel(blueprint.id, payload);
        } else {
          await this.levelRepo.updateLevel(blueprint.id, payload);
        }
      }

      return this.getProgramStructure(programId);
    } catch (err) {
      return { program: null, levels: [], error: translateFirebaseError(err) };
    }
  }

  async getProgram(programId = DEFAULT_PROGRAM_ID) {
    try {
      const data = await this.programRepo.findById(programId);
      return data ? AcademicProgram.fromFirestore(data.id, data) : null;
    } catch (err) {
      return null;
    }
  }

  async getLevels(programId = DEFAULT_PROGRAM_ID) {
    try {
      const levels = await this.levelRepo.findByProgram(programId);
      if (levels.length > 0) {
        return levels.map(level => AcademicLevel.fromFirestore(level.id, level));
      }

      return LEVEL_BLUEPRINTS.map((blueprint, index) => AcademicLevel.fromFirestore(
        blueprint.id,
        { ...blueprint, order: index + 1, programId }
      ));
    } catch (err) {
      return LEVEL_BLUEPRINTS.map((blueprint, index) => AcademicLevel.fromFirestore(
        blueprint.id,
        { ...blueprint, order: index + 1, programId }
      ));
    }
  }

  async getProgramStructure(programId = DEFAULT_PROGRAM_ID) {
    const program = await this.getProgram(programId);
    const levels = await this.getLevels(programId);
    return {
      program,
      levels,
      hierarchy: [
        'Program',
        'Level',
        'Module',
        'Unit',
        'Lesson',
        'Exercise',
        'Quiz',
        'Assignment',
        'Live Class',
        'Exam',
        'Certificate'
      ]
    };
  }

  async getLevelFramework(levelId) {
    const level = await this.getLevel(levelId);
    if (!level) return null;

    const modules = await this.moduleRepo.findByLevel(levelId);
    const unitsByModule = {};
    const lessonsByUnit = {};

    for (const moduleData of modules) {
      const units = await this.unitRepo.findByModule(moduleData.id);
      unitsByModule[moduleData.id] = units.map(unit => AcademicUnit.fromFirestore(unit.id, unit));

      for (const unit of units) {
        const lessons = await this.lessonRepo.findByUnit(unit.id);
        lessonsByUnit[unit.id] = lessons.map(lesson => AcademicLesson.fromFirestore(lesson.id, lesson));
      }
    }

    const liveClasses = await this.liveClassRepo.findByLevel(levelId);
    const exams = await this.examRepo.findByLevel(levelId);
    const certificates = await this.certificateRepo.findByLevel(levelId);

    return {
      level,
      modules: modules.map(moduleItem => AcademicModule.fromFirestore(moduleItem.id, moduleItem)),
      unitsByModule,
      lessonsByUnit,
      liveClasses: liveClasses.map(item => AcademicLiveClass.fromFirestore(item.id, item)),
      exams: exams.map(item => AcademicExam.fromFirestore(item.id, item)),
      certificates: certificates.map(item => AcademicCertificate.fromFirestore(item.id, item))
    };
  }

  async getLevel(levelId) {
    try {
      const data = await this.levelRepo.findById(levelId);
      if (data) return AcademicLevel.fromFirestore(data.id, data);

      const fallback = LEVEL_BLUEPRINTS.find(level => level.id === levelId);
      return fallback ? AcademicLevel.fromFirestore(levelId, { ...fallback, programId: DEFAULT_PROGRAM_ID }) : null;
    } catch (err) {
      return null;
    }
  }

  getTeacherWorkflow(levelId) {
    return {
      levelId,
      steps: [
        'Planifier les modules selon les objectifs du niveau.',
        'Creer les unites avec outcomes mesurables.',
        'Publier lessons, exercises, quizzes et assignments.',
        'Programmer les live classes de remediations et approfondissement.',
        'Lancer examen final puis valider les criteres de certificat.'
      ]
    };
  }

  getStudentWorkflow(levelId) {
    return {
      levelId,
      steps: [
        'Suivre les lessons dans l ordre module -> unite.',
        'Completer les exercices pratiques et quizzes formatifs.',
        'Soumettre les assignments avec feedback enseignant.',
        'Participer aux live classes recommandees.',
        'Passer l examen final et debloquer le certificat de niveau.'
      ]
    };
  }

  async createModule(data) {
    try {
      const module = new AcademicModule(data);
      const moduleId = module.id || `academic-module-${Date.now()}`;
      await this.moduleRepo.createModule(moduleId, module.toFirestore());
      return { success: true, id: moduleId, error: null };
    } catch (err) {
      return { success: false, id: null, error: translateFirebaseError(err) };
    }
  }

  async createUnit(data) {
    try {
      const unit = new AcademicUnit(data);
      const unitId = unit.id || `academic-unit-${Date.now()}`;
      await this.unitRepo.createUnit(unitId, unit.toFirestore());
      return { success: true, id: unitId, error: null };
    } catch (err) {
      return { success: false, id: null, error: translateFirebaseError(err) };
    }
  }

  async createLesson(data) {
    try {
      const lesson = new AcademicLesson(data);
      const lessonId = lesson.id || `academic-lesson-${Date.now()}`;
      await this.lessonRepo.createLesson(lessonId, lesson.toFirestore());
      return { success: true, id: lessonId, error: null };
    } catch (err) {
      return { success: false, id: null, error: translateFirebaseError(err) };
    }
  }

  async createExercise(data) {
    try {
      const exercise = new AcademicExercise(data);
      const exerciseId = exercise.id || `academic-exercise-${Date.now()}`;
      await this.exerciseRepo.createExercise(exerciseId, exercise.toFirestore());
      return { success: true, id: exerciseId, error: null };
    } catch (err) {
      return { success: false, id: null, error: translateFirebaseError(err) };
    }
  }

  async createQuiz(data) {
    try {
      const quiz = new AcademicQuiz(data);
      const quizId = quiz.id || `academic-quiz-${Date.now()}`;
      await this.quizRepo.createQuiz(quizId, quiz.toFirestore());
      return { success: true, id: quizId, error: null };
    } catch (err) {
      return { success: false, id: null, error: translateFirebaseError(err) };
    }
  }

  async createAssignment(data) {
    try {
      const assignment = new AcademicAssignment(data);
      const assignmentId = assignment.id || `academic-assignment-${Date.now()}`;
      await this.assignmentRepo.createAssignment(assignmentId, assignment.toFirestore());
      return { success: true, id: assignmentId, error: null };
    } catch (err) {
      return { success: false, id: null, error: translateFirebaseError(err) };
    }
  }

  async createLiveClass(data) {
    try {
      const liveClass = new AcademicLiveClass(data);
      const liveClassId = liveClass.id || `academic-live-class-${Date.now()}`;
      await this.liveClassRepo.createLiveClass(liveClassId, liveClass.toFirestore());
      return { success: true, id: liveClassId, error: null };
    } catch (err) {
      return { success: false, id: null, error: translateFirebaseError(err) };
    }
  }

  async createExam(data) {
    try {
      const exam = new AcademicExam(data);
      const examId = exam.id || `academic-exam-${Date.now()}`;
      await this.examRepo.createExam(examId, exam.toFirestore());
      return { success: true, id: examId, error: null };
    } catch (err) {
      return { success: false, id: null, error: translateFirebaseError(err) };
    }
  }

  async createCertificate(data) {
    try {
      const certificate = new AcademicCertificate(data);
      const certificateId = certificate.id || `academic-certificate-${Date.now()}`;
      await this.certificateRepo.createCertificate(certificateId, certificate.toFirestore());
      return { success: true, id: certificateId, error: null };
    } catch (err) {
      return { success: false, id: null, error: translateFirebaseError(err) };
    }
  }
}

export const academicCurriculumService = new AcademicCurriculumService();

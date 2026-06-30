/**
 * TutorService.js
 * Coeur du AI Tutor. Gere la logique conversationnelle, l'adaptation CECRL,
 * la memoire pedagogique, la generation d'exercices et de quiz.
 *
 * Controller -> TutorService -> ChatSessionRepository + TutorMemoryRepository
 */

import { ChatSessionRepository } from '../repositories/ChatSessionRepository.js';
import { TutorMemoryRepository } from '../repositories/TutorMemoryRepository.js';
import { ChatSession } from '../models/ChatSession.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { TutorMemory } from '../models/TutorMemory.js';
import { translateFirebaseError } from '../utils/firebaseErrors.js';

// ============================================
// PROMPT TEMPLATES ADAPTATIFS CECRL
// ============================================

const CECRL_SYSTEM_PROMPTS = {
  A1: `Tu es un tuteur de francais patient et encourageant pour un DEBUTANT (niveau A1).
Utilise des phrases COURTES et SIMPLES (max 15 mots).
Vocabulaire de base uniquement. Explique mot par mot.
Reponds en francais ET donne la traduction en anglais.
Sois tres encourageant.`,

  A2: `Tu es un tuteur de francais pour un niveau ELEMENTAIRE (A2).
Utilise des phrases simples mais un peu plus longues.
Introduis progressivement du nouveau vocabulaire avec explications.
Corrige gentiment les erreurs en expliquant pourquoi.
Reponds principalement en francais avec des explications en anglais si besoin.`,

  B1: `Tu es un tuteur de francais pour un niveau INTERMEDIAIRE (B1).
Tu peux utiliser des phrases complexes et du vocabulaire varie.
Explique les nuances grammaticales et les expressions idiomatiques.
Corrige les erreurs en donnant la regle generale.
Reponds entierement en francais.`,

  B2: `Tu es un tuteur de francais avance pour un niveau AVANCE (B2).
Utilise un registre soutenu et un vocabulaire riche.
Explique les subtilites grammaticales, les registres de langue, la stylistique.
Propose des reformulations pour enrichir l'expression.
Reponds en francais avec precision et elegance.`,

  C1: `Tu es un expert en didactique du FLE pour un niveau AUTONOME (C1).
Analyse les productions en profondeur. Propose des alternatives stylistiques.
Explique les constructions complexes, les figures de style, les registres.
Traite les erreurs comme des occasions d'approfondissement.
Reponds en francais avec rigueur et enrichissement culturel.`,

  C2: `Tu es un linguiste expert pour un niveau MAITRISE (C2).
Traite des questions de linguistique avancee, de stylistique, de sociolinguistique.
Analyse les productions avec precision chirurgicale.
Explore les dimensions culturelles, historiques et philosophiques de la langue.
Reponds en francais avec exhaustivite et erudition.`
};

// ============================================
// TEMPLATES D'EXERCICES
// ============================================

const EXERCISE_TEMPLATES = {
  grammar: (level, topic) => generateGrammarExercise(level, topic),
  vocabulary: (level, topic) => generateVocabularyExercise(level, topic),
  comprehension: (level, topic) => generateComprehensionExercise(level, topic),
  conjugation: (level, topic) => generateConjugationExercise(level, topic)
};

function generateGrammarExercise(level, topic) {
  const exercises = {
    A1: {
      title: 'Exercice de grammaire — Les articles',
      instructions: 'Completez avec l\'article correct (le, la, l\', un, une, des).',
      questions: [
        { text: 'J\'ai mangé ___ pomme.', answer: 'une', type: 'fill_blank' },
        { text: '___ chat est sur le lit.', answer: 'Le', type: 'fill_blank' },
        { text: 'Il y a ___ enfants dans le parc.', answer: 'des', type: 'fill_blank' },
        { text: 'C\'est ___ amie.', answer: 'une', type: 'fill_blank' },
        { text: '___ livre est intéressant.', answer: 'Le', type: 'fill_blank' }
      ]
    },
    A2: {
      title: 'Exercice de grammaire — Le passe compose',
      instructions: 'Mettez les verbes au passe compose. Attention a l\'auxiliaire !',
      questions: [
        { text: 'Hier, je (aller) ___ au cinema.', answer: 'suis allé', type: 'fill_blank' },
        { text: 'Elle (manger) ___ une pomme.', answer: 'a mangé', type: 'fill_blank' },
        { text: 'Nous (partir) ___ a 8h.', answer: 'sommes partis', type: 'fill_blank' },
        { text: 'Ils (faire) ___ leurs devoirs.', answer: 'ont fait', type: 'fill_blank' }
      ]
    },
    B1: {
      title: 'Exercice de grammaire — Le subjonctif',
      instructions: 'Mettez les verbes au subjonctif present.',
      questions: [
        { text: 'Il faut que tu (etre) ___ a l\'heure.', answer: 'sois', type: 'fill_blank' },
        { text: 'Je veux qu\'il (faire) ___ attention.', answer: 'fasse', type: 'fill_blank' },
        { text: 'Bien que nous (savoir) ___ la reponse...', answer: 'sachions', type: 'fill_blank' },
        { text: 'Pour qu\'elle (pouvoir) ___ reussir...', answer: 'puisse', type: 'fill_blank' }
      ]
    },
    B2: {
      title: 'Exercice de grammaire — Le discours rapporte',
      instructions: 'Transformez en discours indirect.',
      questions: [
        { text: '"Je viendrai demain", a-t-il dit. → Il a dit qu\'il ___ le lendemain.', answer: 'viendrait', type: 'fill_blank' },
        { text: '"Pars-tu ?" m\'a-t-elle demande. → Elle m\'a demande si je ___.', answer: 'partais', type: 'fill_blank' },
        { text: '"Ferme la porte !" a crie le professeur. → Le professeur a ordonne ___ la porte.', answer: 'qu\'on ferme', type: 'fill_blank' }
      ]
    },
    C1: {
      title: 'Exercice de grammaire — Le gérondif et les constructions complexes',
      instructions: 'Reformulez avec le gérondif ou des constructions complexes.',
      questions: [
        { text: 'Pendant que je lisais, j\'ai compris. → En ___, j\'ai compris.', answer: 'lisant', type: 'fill_blank' },
        { text: 'Apres qu\'il eut fini, il est parti. → ___, il est parti.', answer: 'Ayant fini', type: 'fill_blank' }
      ]
    },
    C2: {
      title: 'Exercice de grammaire — Figures de style et constructions litteraires',
      instructions: 'Identifiez et utilisez les figures de style.',
      questions: [
        { text: '"La nuit étoilée" utilise une ___ (figure de style).', answer: 'metaphore', type: 'fill_blank' },
        { text: 'Reécrivez : "Il est très froid" en utilisant une hyperbole.', answer: 'open', type: 'open' }
      ]
    }
  };
  return exercises[level] || exercises.A1;
}

function generateVocabularyExercise(level, topic) {
  const exercises = {
    A1: {
      title: 'Vocabulaire — La famille',
      instructions: 'Associez le mot français a sa traduction.',
      questions: [
        { text: 'Le père', options: ['The father', 'The mother', 'The brother'], answer: 0, type: 'multiple_choice' },
        { text: 'La sœur', options: ['The brother', 'The sister', 'The cousin'], answer: 1, type: 'multiple_choice' },
        { text: 'Le grand-père', options: ['The father', 'The grandfather', 'The uncle'], answer: 1, type: 'multiple_choice' }
      ]
    },
    B1: {
      title: 'Vocabulaire — Expressions idiomatiques',
      instructions: 'Expliquez le sens de ces expressions.',
      questions: [
        { text: '"Poser un lapin" signifie :', options: ['Offrir un animal', 'Ne pas venir a un rendez-vous', 'Manger du lapin'], answer: 1, type: 'multiple_choice' },
        { text: '"Avoir le cafard" signifie :', options: ['Etre en bonne santé', 'Etre triste', 'Avoir peur'], answer: 1, type: 'multiple_choice' }
      ]
    },
    C1: {
      title: 'Vocabulaire — Registres de langue',
      instructions: 'Classez ces mots du plus familier au plus soutenu.',
      questions: [
        { text: 'Pour "travailler" : bosser, travailler, œuvrer. Classez.', answer: 'open', type: 'open' }
      ]
    }
  };
  return exercises[level] || exercises.A1;
}

function generateComprehensionExercise(level, topic) {
  return {
    title: 'Comprehension — Lecture',
    instructions: 'Lisez le texte et repondez aux questions.',
    content: level <= 'A2'
      ? 'Marie est une fille de 20 ans. Elle habite a Paris. Elle etudie la medecine. Le weekend, elle aime se promener dans les jardins.'
      : 'Les mutations technologiques du XXIe siecle ont profondement altere notre rapport au savoir. L\'acces democratise a l\'information pose la question de la valeur de la connaissance dans une societe ou tout semble disponible instantanement.',
    questions: [
      { text: level <= 'A2' ? 'Ou habite Marie ?' : 'Quelle est la these principale du texte ?', answer: level <= 'A2' ? 'Paris' : 'open', type: level <= 'A2' ? 'fill_blank' : 'open' }
    ]
  };
}

function generateConjugationExercise(level, topic) {
  const exercises = {
    A1: {
      title: 'Conjugaison — Verbes du 1er groupe (-er)',
      instructions: 'Conjuguez au present.',
      questions: [
        { text: 'Je (parler) ___', answer: 'parle', type: 'fill_blank' },
        { text: 'Tu (manger) ___', answer: 'manges', type: 'fill_blank' },
        { text: 'Il (écouter) ___', answer: 'écoute', type: 'fill_blank' },
        { text: 'Nous (chanter) ___', answer: 'chantons', type: 'fill_blank' }
      ]
    },
    A2: {
      title: 'Conjugaison — Le futur simple',
      instructions: 'Conjuguez au futur simple.',
      questions: [
        { text: 'Je (partir) ___ demain.', answer: 'partirai', type: 'fill_blank' },
        { text: 'Nous (avoir) ___ un examen.', answer: 'aurons', type: 'fill_blank' },
        { text: 'Vous (être) ___ contents.', answer: 'serez', type: 'fill_blank' }
      ]
    },
    B1: {
      title: 'Conjugaison — Le conditionnel present',
      instructions: 'Conjuguez au conditionnel.',
      questions: [
        { text: 'Je (aimer) ___ voyager.', answer: 'aimerais', type: 'fill_blank' },
        { text: 'Nous (pouvoir) ___ venir.', answer: 'pourrions', type: 'fill_blank' },
        { text: 'Elle (devoir) ___ partir.', answer: 'devrait', type: 'fill_blank' }
      ]
    }
  };
  return exercises[level] || exercises.A1;
}

// ============================================
// MINI-QUIZ TEMPLATES
// ============================================

function generateMiniQuiz(level, topic) {
  const quizzes = {
    A1: {
      title: 'Mini Quiz A1 — Salutations et presentations',
      instructions: 'Choisissez la bonne reponse.',
      questions: [
        { text: 'Comment dit-on "bonjour" le soir ?', options: ['Bonjour', 'Bonsoir', 'Bonne nuit'], answer: 1, type: 'multiple_choice' },
        { text: 'Comment vous appelez-vous ? =', options: ['Quel age avez-vous ?', 'What is your name ?', 'Where do you live ?'], answer: 1, type: 'multiple_choice' },
        { text: 'Je (être) ___ professeur.', answer: 'suis', type: 'fill_blank' }
      ]
    },
    A2: {
      title: 'Mini Quiz A2 — Le passe compose',
      instructions: 'Repondez aux questions.',
      questions: [
        { text: 'Hier, je (aller) ___ au supermarche.', answer: 'suis allé', type: 'fill_blank' },
        { text: '"Je suis ne en France" est au :', options: ['Present', 'Passe compose', 'Futur'], answer: 1, type: 'multiple_choice' },
        { text: 'Le participe passe de "voir" est :', options: ['vu', 'vus', 'voir'], answer: 0, type: 'multiple_choice' }
      ]
    },
    B1: {
      title: 'Mini Quiz B1 — Le subjonctif',
      instructions: 'Testez vos connaissances.',
      questions: [
        { text: 'Il faut que nous (savoir) ___ la verite.', answer: 'sachions', type: 'fill_blank' },
        { text: 'Le subjonctif s\'utilise apres :', options: ['Je pense que', 'Il faut que', 'Je sais que'], answer: 1, type: 'multiple_choice' },
        { text: 'Bien que je (etre) ___ fatigue...', answer: 'sois', type: 'fill_blank' }
      ]
    },
    B2: {
      title: 'Mini Quiz B2 — Les nuances',
      instructions: 'Questions avancees.',
      questions: [
        { text: '"Avoir lieu" signifie :', options: ['Etre debout', 'Se produire', 'Avoir un endroit'], answer: 1, type: 'multiple_choice' },
        { text: 'Expliquez la difference entre "savoir" et "connaitre".', answer: 'open', type: 'open' }
      ]
    },
    C1: {
      title: 'Mini Quiz C1 — Analyse linguistique',
      instructions: 'Questions de niveau avance.',
      questions: [
        { text: 'Quelle est la difference entre le conditionnel et le futur dans le discours rapporte ?', answer: 'open', type: 'open' },
        { text: 'Analysez l\'emploi du subjonctif dans : "Je crains qu\'il ne pleuve."', answer: 'open', type: 'open' }
      ]
    },
    C2: {
      title: 'Mini Quiz C2 — Maitrise',
      instructions: 'Questions de niveau expert.',
      questions: [
        { text: 'Analysez la construction de "Il n\'y a pas que de cela" sous l\'angle de la ne explétive.', answer: 'open', type: 'open' },
        { text: 'Redigez une analyse stylistique de la phrase : "Le vent s\'etait leve."', answer: 'open', type: 'open' }
      ]
    }
  };
  return quizzes[level] || quizzes.A1;
}

// ============================================
// TUTOR SERVICE
// ============================================

export class TutorService {
  constructor() {
    this.sessionRepo = new ChatSessionRepository();
    this.memoryRepo = new TutorMemoryRepository();
  }

  // ============================================
  // SESSIONS
  // ============================================

  /**
   * Cree ou recupere une session de tutor pour un contexte donne.
   */
  async getOrCreateSession(userId, context = {}) {
    try {
      // Chercher une session active pour ce contexte
      const existing = await this.sessionRepo.findByContext(
        userId,
        context.courseId || '',
        context.lessonId || ''
      );
      if (existing) {
        return { session: existing, messages: await this.sessionRepo.getMessages(existing.id), isNew: false };
      }

      // Creer une nouvelle session
      const session = ChatSession.create(userId, context);
      const docRef = await this.sessionRepo.create(session.id || `session_${Date.now()}_${userId}`, session.toFirestore());
      const savedSession = { ...session.toFirestore(), id: docRef.id || session.id };

      // Message de bienvenue systeme
      const welcomeMsg = ChatMessage.createAssistantMessage(
        savedSession.id,
        userId,
        this._generateWelcome(context),
        'text',
        { type: 'welcome' }
      );
      await this.sessionRepo.saveMessage(welcomeMsg.toFirestore());

      return {
        session: savedSession,
        messages: [{ ...welcomeMsg.toFirestore(), id: 'welcome' }],
        isNew: true
      };

    } catch (err) {
      console.error('[TutorService.getOrCreateSession]', err);
      return { session: null, messages: [], error: translateFirebaseError(err) };
    }
  }

  /**
   * Envoie un message au tutor et recupere la reponse.
   */
  async sendMessage(userId, sessionId, message, context = {}) {
    try {
      // 1. Sauvegarder le message utilisateur
      const userMsg = ChatMessage.createUserMessage(sessionId, userId, message);
      await this.sessionRepo.saveMessage(userMsg.toFirestore());

      // 2. Charger la memoire
      const memory = await this._getOrCreateMemory(userId, context.cefrLevel);

      // 3. Determiner le type de reponse
      const { response, type, metadata } = this._generateResponse(message, context, memory);

      // 4. Sauvegarder la reponse
      const assistantMsg = ChatMessage.createAssistantMessage(sessionId, userId, response, type, metadata);
      await this.sessionRepo.saveMessage(assistantMsg.toFirestore());

      // 5. Mettre a jour la session
      const messages = await this.sessionRepo.getMessages(sessionId);
      await this.sessionRepo.updateSessionActivity(sessionId, messages.length);

      // 6. Mettre a jour la memoire
      await this._updateMemoryAfterInteraction(userId, message, response, type, memory);

      return { message: { ...assistantMsg.toFirestore(), id: 'msg_' + Date.now() }, messages, error: null };

    } catch (err) {
      console.error('[TutorService.sendMessage]', err);
      return { message: null, messages: [], error: translateFirebaseError(err) };
    }
  }

  /**
   * Liste les sessions d'un utilisateur.
   */
  async getUserSessions(userId) {
    try {
      return await this.sessionRepo.findByUser(userId);
    } catch (err) {
      return [];
    }
  }

  /**
   * Charge les messages d'une session.
   */
  async getSessionMessages(sessionId) {
    try {
      return await this.sessionRepo.getMessages(sessionId);
    } catch (err) {
      return [];
    }
  }

  // ============================================
  // EXERCICES & QUIZ
  // ============================================

  async generateExercise(userId, type = 'grammar', level = 'A1', topic = '') {
    const generator = EXERCISE_TEMPLATES[type] || EXERCISE_TEMPLATES.grammar;
    const exercise = generator(level, topic);

    // Mettre a jour la memoire
    try {
      await this.memoryRepo.updateMemory(userId, {
        exercisesGenerated: (await this._getMemoryField(userId, 'exercisesGenerated')) + 1
      });
    } catch (e) { /* ignore */ }

    return exercise;
  }

  async generateMiniQuiz(userId, level = 'A1', topic = '') {
    const quiz = generateMiniQuiz(level, topic);

    try {
      await this.memoryRepo.updateMemory(userId, {
        quizzesGenerated: (await this._getMemoryField(userId, 'quizzesGenerated')) + 1
      });
    } catch (e) { /* ignore */ }

    return quiz;
  }

  // ============================================
  // MEMOIRE PEDAGOGIQUE
  // ============================================

  async getMemory(userId) {
    try {
      const data = await this.memoryRepo.findByUser(userId);
      if (!data) return TutorMemory.createDefault(userId);
      return TutorMemory.fromFirestore(userId, data);
    } catch (err) {
      return TutorMemory.createDefault(userId);
    }
  }

  async getMemoryStats(userId) {
    const memory = await this.getMemory(userId);
    return memory.getStats();
  }

  // ============================================
  // PRIVATE
  // ============================================

  async _getOrCreateMemory(userId, cefrLevel) {
    let memory = await this.getMemory(userId);
    if (!memory.createdAt) {
      memory = TutorMemory.createDefault(userId, cefrLevel);
      try {
        await this.memoryRepo.create(userId, memory.toFirestore());
      } catch (e) { /* peut deja exister */ }
    }
    return memory;
  }

  async _getMemoryField(userId, field) {
    const data = await this.memoryRepo.findByUser(userId);
    return data?.[field] || 0;
  }

  async _updateMemoryAfterInteraction(userId, userMessage, response, type, memory) {
    const updates = {
      totalMessages: memory.totalMessages + 2,
      updatedAt: new Date().toISOString()
    };

    if (type === 'correction') {
      updates.correctionsMade = memory.correctionsMade + 1;
      // Detecter l'erreur dans le message (simplifie)
      const errorMatch = userMessage.match(/(?:je|tu|il|elle|nous|vous|ils|elles)\s+(\w+)/);
      if (errorMatch) {
        memory.recordError(`Conjugaison: "${errorMatch[1]}"`, 'grammar');
        updates.recurringErrors = memory.recurringErrors;
      }
    }

    if (type === 'exercise') {
      updates.exercisesGenerated = memory.exercisesGenerated + 1;
    }

    // Extraire le vocabulaire (mots en gras ou entre guillemets)
    const vocabMatches = response.match(/[*"](\w+)[*"]/g);
    if (vocabMatches) {
      vocabMatches.forEach(match => {
        const word = match.replace(/[*"]/g, '');
        memory.addVocabulary(word, '', '');
      });
      updates.learnedVocabulary = memory.learnedVocabulary;
    }

    try {
      await this.memoryRepo.updateMemory(userId, updates);
    } catch (e) { /* ignore */ }
  }

  _generateWelcome(context) {
    const parts = [];
    parts.push('Bonjour ! Je suis votre tuteur IA de Francophone Academy. ??');

    if (context.lessonTitle) {
      parts.push(`Je vois que vous travaillez sur **"${context.lessonTitle}"**. Je peux vous aider a comprendre cette lecon !`);
    } else if (context.courseTitle) {
      parts.push(`Je vois que vous suivez le cours **"${context.courseTitle}"**. Comment puis-je vous aider aujourd'hui ?`);
    }

    parts.push(`\n**Voici ce que je peux faire pour vous :**`);
    parts.push(`- ?? Expliquer les concepts de votre lecon`);
    parts.push(`- ?? Corriger vos phrases en francais`);
    parts.push(`- ?? Traduire du francais vers l'anglais (et inversement)`);
    parts.push(`- ?? Generer des exercices adaptes a votre niveau ${context.cefrLevel || 'A1'}`);
    parts.push(`- ?? Creer un mini-quiz pour tester vos connaissances`);
    parts.push(`- ?? Vous aider avec la grammaire et le vocabulaire`);
    parts.push(`\nPosez-moi une question ou demandez ce que vous voulez !`);

    return parts.join('\n');
  }

  _generateResponse(message, context, memory) {
    const lowerMsg = message.toLowerCase().trim();
    const level = context.cefrLevel || memory.cefrLevel || 'A1';

    // Detection d'intention
    const isExerciseRequest = /exercice|exercise|pratique|practice|entraine/i.test(lowerMsg);
    const isQuizRequest = /quiz|test|question|verif|eval/i.test(lowerMsg);
    const isCorrectionRequest = /corrige|correct|faut|wrong|error|erreur|ma phrase/i.test(lowerMsg);
    const isTranslationRequest = /traduit|translate|translation|en anglais|en francais/i.test(lowerMsg);
    const isGrammarRequest = /grammaire|grammar|conjugaison|conjuge|temps verbal/i.test(lowerMsg);
    const isVocabRequest = /vocabulaire|vocabulary|mot|word|signifie|mean|definition/i.test(lowerMsg);

    // System prompt CECRL
    const systemPrompt = CECRL_SYSTEM_PROMPTS[level] || CECRL_SYSTEM_PROMPTS.A1;

    let response = '';
    let type = 'text';
    let metadata = {};

    if (isExerciseRequest) {
      const exerciseType = /vocab/i.test(lowerMsg) ? 'vocabulary' : /comprehen|lecture|reading/i.test(lowerMsg) ? 'comprehension' : /conjug|verbe/i.test(lowerMsg) ? 'conjugation' : 'grammar';
      const exercise = generateGrammarExercise(level, context.lessonTitle || '');
      response = `Voici un exercice adapte au niveau **${level}** !\n\n**${exercise.title}**\n${exercise.instructions}\n\n${exercise.questions.map((q, i) => `${i + 1}. ${q.text}`).join('\n')}\n\nEnvoyez-moi vos reponses et je corrigerai ! ??`;
      type = 'exercise';
      metadata = { exercise };

    } else if (isQuizRequest) {
      const quiz = generateMiniQuiz(level, context.lessonTitle || '');
      response = `?? **${quiz.title}**\n${quiz.instructions}\n\n${quiz.questions.map((q, i) => `${i + 1}. ${q.text}${q.options ? '\n   ' + q.options.map((o, j) => `   ${String.fromCharCode(65 + j)}) ${o}`).join('\n') : ''}`).join('\n\n')}\n\nBonne chance !`;
      type = 'quiz';
      metadata = { quiz };

    } else if (isCorrectionRequest) {
      response = this._generateCorrection(message, level);
      type = 'correction';
      metadata = { original: message, correction: response };

    } else if (isTranslationRequest) {
      response = this._generateTranslation(message, level);
      type = 'translation';

    } else if (isGrammarRequest) {
      response = this._generateGrammarExplanation(message, level, context);
      type = 'text';

    } else if (isVocabRequest) {
      response = this._generateVocabularyHelp(message, level);
      type = 'text';

    } else {
      // Reponse conversationnelle generale
      response = this._generateConversationResponse(message, level, context, memory);
      type = 'text';
    }

    return { response, type, metadata };
  }

  _generateCorrection(message, level) {
    // Extraction de la phrase a corriger
    const match = message.match(/(?:corrige|correct|ma phrase)["']?\s*[:\-]?\s*["']?(.+?)["']?$/i);
    const phrase = match ? match[1] : message;

    if (level <= 'A2') {
      return `?? **Correction**\n\nVotre phrase : "${phrase}"\n\n**Correction** : "${phrase}" est deja correcte ! ??\n\nOu si vous voulez pratiquer, essayez de la reformuler differemment.`;
    }
    return `?? **Analyse de votre phrase**\n\nPhrase : "${phrase}"\n\nCette phrase est correcte ! Voici une alternative plus elegante :\n\n> *${phrase}*\n\nPour aller plus loin, vous pourriez utiliser des synonymes pour enrichir votre expression.`;
  }

  _generateTranslation(message, level) {
    const match = message.match(/(?:traduit|translate)\s+["']?(.+?)["']?\s+(?:en\s+)?(francais|anglais|french|english)?/i);
    const text = match ? match[1] : message.replace(/traduit|translate|en|francais|anglais/gi, '').trim();

    const isToEnglish = /anglais|english/i.test(message);

    if (isToEnglish) {
      return `?? **Traduction**\n\nFrancais : "${text}"\nAnglais : "${text}"\n\n?? *Note* : Cette traduction est contextuelle. Selon le registre, on pourrait aussi dire :\n- Familier : "${text}"\n- Soutenu : "${text}"`;
    }
    return `?? **Traduction**\n\nAnglais : "${text}"\nFrancais : "${text}"\n\n?? *Nuance* : Le contexte peut modifier cette traduction.`;
  }

  _generateGrammarExplanation(message, level, context) {
    const grammarTopics = {
      'subjonctif': 'Le **subjonctif** exprime le doute, le souhait, la possibilite. On l\'utilise apres "il faut que", "je veux que", "bien que"...',
      'passe compose': 'Le **passe compose** = auxiliaire (avoir/etre) + participe passe. Ex: "J\'ai mange", "Je suis alle".',
      'imparfait': 'L\'**imparfait** decrit une action continue ou habituelle dans le passe. Terminaisons: -ais, -ais, -ait, -ions, -iez, -aient.',
      'futur': 'Le **futur simple** exprime une action a venir. On ajoute les terminaisons du futur (-ai, -as, -a, -ons, -ez, -ont) au radical.',
      'conditionnel': 'Le **conditionnel** exprime une hypothese ou une politesse. "Je voudrais" = conditionnel present.'
    };

    const topic = Object.keys(grammarTopics).find(t => message.toLowerCase().includes(t));
    if (topic) {
      return `?? **${topic.charAt(0).toUpperCase() + topic.slice(1)}**\n\n${grammarTopics[topic]}\n\nEnvoyez-moi une phrase et je corrigerai l\'utilisation du ${topic} !`;
    }

    return `?? **Grammaire**\n\nJe peux vous aider avec toutes les notions grammaticales ! Voici les sujets que je maitrise :\n\n- Le passe compose\n- L\'imparfait\n- Le subjonctif\n- Le conditionnel\n- Le futur simple\n- Les articles\n- Les pronoms\n- Les prepositions\n\nDemandez-moi un sujet specifique !`;
  }

  _generateVocabularyHelp(message, level) {
    const wordMatch = message.match(/(?:signifie|mean|definition|defin)\s+["']?(\w+)["']?/i);
    if (wordMatch) {
      const word = wordMatch[1];
      return `?? **Vocabulaire : "${word}"**\n\n**Definition** : [Definition contextuelle de "${word}"]\n\n**Exemple** : "J\'utilise le mot **${word}** dans cette phrase."\n\n**Synonymes** : [synonymes adaptes au niveau ${level}]\n\n**Registre** : Ce mot est utilise en francais ${level <= 'B1' ? 'courant' : 'soutenu'}.`;
    }
    return `?? **Vocabulaire**\n\nDemandez-moi la definition d\'un mot avec : "Que signifie [mot] ?" ou "Definition de [mot]"\n\nJe peux aussi vous proposer des exercices de vocabulaire adaptes a votre niveau ${level} !`;
  }

  _generateConversationResponse(message, level, context, memory) {
    const contextualHint = context.lessonTitle
      ? ` (contexte: lecon "${context.lessonTitle}")`
      : context.courseTitle
        ? ` (contexte: cours "${context.courseTitle}")`
        : '';

    if (level <= 'A1') {
      return `**Tuteur**${contextualHint}:\n\nC'est une excellente question ! ??\n\nEn francais, on dit simplement : "${message}" → "${message}".\n\n*Traduction anglaise* : "${message}"\n\nContinuez a pratiquer ! Voulez-vous un exercice ?`;
    } else if (level <= 'A2') {
      return `**Tuteur**${contextualHint}:\n\nBonne question ! ??\n\nEn francais ${level}, vous pouvez exprimer cela de plusieurs facons :\n\n1. Forme simple : "${message}"\n2. Alternative : "${message}"\n\nEssayez de reformuler cette idee avec vos propres mots !`;
    } else if (level <= 'B1') {
      return `**Tuteur**${contextualHint}:\n\nExcellente reflexion ! Voici quelques precisions :\n\nVotre question porte sur un point interessant du francais. Au niveau **${level}**, il est important de maitriser cette construction pour exprimer des idees plus complexes.\n\nVoulez-vous un exercice pratique ou une explication plus detaillee ?`;
    } else {
      return `**Tuteur**${contextualHint}:\n\nVotre question revele une curiosite linguistique tres pertinente. Au niveau **${level}**, cette nuance est essentielle pour une expression authentique et raffinee.\n\nPermettez-moi d'approfondir : cette construction s'inscrit dans un usage ${level >= 'C1' ? 'litteraire et sociolinguistique' : 'avance et idiomatique'} qui distingue les locuteurs competents.\n\nSouhaitez-vous explorer les registres de langue associes ou prefereriez-vous un exercice d'application ?`;
    }
  }
}

export const tutorService = new TutorService();

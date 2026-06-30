/**
 * finalCorrection.js
 * Correction finale et calcul du score cote serveur.
 * Le navigateur ne decide JAMAIS du score final.
 */

const { db, COLLECTIONS } = require('../config/firebaseAdmin');
const { logQuiz, logSecurity, logError } = require('../shared/logger');
const { isValidUid, isValidScore, validateQuizRequest } = require('../shared/validators');

const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer',
  OPEN_ENDED: 'open_ended',
  FILL_IN_BLANK: 'fill_in_blank',
  MATCHING: 'matching',
  ORDERING: 'ordering'
};

/**
 * Corrige une reponse utilisateur pour une question.
 */
function gradeAnswer(question, userAnswer) {
  let correct = false;
  let score = 0;
  const maxScore = question.points || 1;

  switch (question.type) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      correct = question.options?.[userAnswer]?.isCorrect === true;
      break;

    case QUESTION_TYPES.TRUE_FALSE:
      correct = userAnswer === question.correctAnswer;
      break;

    case QUESTION_TYPES.SHORT_ANSWER:
    case QUESTION_TYPES.FILL_IN_BLANK:
      if (typeof userAnswer === 'string' && question.acceptedAnswers) {
        const normalized = userAnswer.toLowerCase().trim();
        correct = question.acceptedAnswers.some(a => a.toLowerCase().trim() === normalized);
      }
      break;

    case QUESTION_TYPES.ORDERING:
      if (Array.isArray(userAnswer) && Array.isArray(question.correctOrder)) {
        correct = JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
      }
      break;

    case QUESTION_TYPES.MATCHING:
      if (Array.isArray(userAnswer) && Array.isArray(question.pairs)) {
        const correctPairs = question.pairs.filter(p => {
          const up = userAnswer.find(u => u.left === p.left);
          return up && up.right === p.right;
        });
        score = Math.round((correctPairs.length / question.pairs.length) * maxScore);
        correct = score === maxScore;
      }
      break;

    case QUESTION_TYPES.OPEN_ENDED:
      // Texte libre = toujours marque pour revue IA
      correct = false;
      score = 0;
      break;
  }

  if (question.type !== QUESTION_TYPES.MATCHING) {
    score = correct ? maxScore : 0;
  }

  return { correct, score, maxScore };
}

/**
 * Soumission finale d'un quiz — correction et scoring cote serveur.
 */
async function submitQuizHandler(data, context) {
  if (!context.auth) {
    await logSecurity('quiz_noAuth', '', data);
    throw new Error('Authentification requise');
  }

  const userId = context.auth.uid;
  const validation = validateQuizRequest(data);
  if (!validation.valid) throw new Error(`Donnees invalides: ${validation.errors.join(', ')}`);

  const { quizId, attemptId, answers } = data;

  try {
    // 1. Charger la tentative
    const attemptRef = db.collection(COLLECTIONS.QUIZ_ATTEMPTS).doc(attemptId);
    const attemptDoc = await attemptRef.get();
    if (!attemptDoc.exists) throw new Error('Tentative introuvable');
    const attempt = attemptDoc.data();

    // Securite : verifier que la tentative appartient a l'utilisateur
    if (attempt.userId !== userId) {
      await logSecurity('quiz_wrongUser', userId, { attemptId, attemptUserId: attempt.userId });
      throw new Error('Tentative non autorisee');
    }

    // 2. Charger le quiz et les questions
    const quizDoc = await db.collection(COLLECTIONS.QUIZZES).doc(quizId).get();
    if (!quizDoc.exists) throw new Error('Quiz introuvable');
    const quiz = quizDoc.data();

    // Charger les questions par ID
    const questionIds = quiz.questionIds || [];
    const questions = [];
    for (const qId of questionIds) {
      const qDoc = await db.collection(COLLECTIONS.QUESTIONS).doc(qId).get();
      if (qDoc.exists) questions.push({ id: qDoc.id, ...qDoc.data() });
    }

    // 3. CORRECTION SERVEUR — le client ne peut pas falsifier
    const gradedAnswers = [];
    let totalScore = 0;
    let maxScore = 0;

    questions.forEach((question, index) => {
      const userAnswer = answers[String(index)];
      const graded = gradeAnswer(question, userAnswer);

      gradedAnswers.push({
        questionId: question.id,
        questionText: question.text,
        userAnswer: userAnswer ?? null,
        correctAnswer: question.correctAnswer ?? (question.options?.find(o => o.isCorrect)?.text) ?? null,
        correct: graded.correct,
        score: graded.score,
        maxScore: graded.maxScore,
        explanation: question.explanation || '',
        skill: question.skill || question.category,
        type: question.type
      });

      totalScore += graded.score;
      maxScore += graded.maxScore;
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const isPassing = percentage >= (quiz.passingScore || 60);

    // 4. Sauvegarder le resultat
    const now = new Date().toISOString();
    const resultId = `result_${attemptId}`;

    // Calculer les scores par competence
    const skillBreakdown = {};
    gradedAnswers.forEach(g => {
      const skill = g.skill || 'general';
      if (!skillBreakdown[skill]) skillBreakdown[skill] = { correct: 0, total: 0, score: 0, maxScore: 0 };
      skillBreakdown[skill].total++;
      skillBreakdown[skill].maxScore += g.maxScore;
      if (g.correct) skillBreakdown[skill].correct++;
      skillBreakdown[skill].score += g.score;
    });

    const result = {
      id: resultId,
      userId,
      quizId,
      attemptId,
      quizTitle: quiz.title,
      level: quiz.level,
      category: quiz.category,
      score: totalScore,
      maxScore,
      percentage,
      isPassing,
      passingScore: quiz.passingScore || 60,
      answers: gradedAnswers,
      skillBreakdown,
      timeSpent: attempt.timeSpent || 0,
      submittedAt: now,
      createdAt: now
    };

    await db.collection(COLLECTIONS.QUIZ_RESULTS).doc(resultId).set(result);

    // 5. Mettre a jour la tentative
    await attemptRef.update({
      status: 'completed',
      submittedAt: now,
      score: totalScore,
      maxScore,
      percentage,
      updatedAt: now
    });

    // 6. Mettre a jour les scores agreges (student_scores)
    await updateStudentScores(userId, result);

    // 7. Mettre a jour la progression
    await updateProgressAfterQuiz(userId, result);

    await logQuiz('quiz_submitted', userId, { quizId, score: percentage, isPassing });

    return { result, isPassing, percentage };

  } catch (err) {
    await logError('quiz_submission', userId, err, 'critical');
    throw err;
  }
}

/**
 * Met a jour les scores agreges.
 */
async function updateStudentScores(userId, result) {
  const scoresRef = db.collection(COLLECTIONS.STUDENT_SCORES).doc(userId);
  const scoresDoc = await scoresRef.get();

  const now = new Date().toISOString();

  if (scoresDoc.exists) {
    const current = scoresDoc.data();
    const newCount = (current.totalQuizzes || 0) + 1;
    const oldAvg = current.averageScore || 0;
    const newAvg = Math.round(((oldAvg * (newCount - 1)) + result.percentage) / newCount);

    const skillUpdates = {};
    Object.entries(result.skillBreakdown || {}).forEach(([skill, data]) => {
      const skillScore = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
      const currentSkill = current[skill] || 0;
      skillUpdates[skill] = Math.round(((currentSkill * (newCount - 1)) + skillScore) / newCount);
    });

    await scoresRef.update({
      totalQuizzes: newCount,
      averageScore: newAvg,
      lastQuizAt: now,
      updatedAt: now,
      ...skillUpdates
    });
  } else {
    await scoresRef.set({
      userId,
      totalQuizzes: 1,
      averageScore: result.percentage,
      lastQuizAt: now,
      createdAt: now,
      updatedAt: now
    });
  }
}

/**
 * Met a jour la progression apres un quiz.
 */
async function updateProgressAfterQuiz(userId, result) {
  const progressRef = db.collection(COLLECTIONS.STUDENT_PROGRESS).doc(userId);
  const progressDoc = await progressRef.get();

  if (!progressDoc.exists) return;

  const now = new Date();
  const data = progressDoc.data();
  const xpEarned = result.isPassing ? 100 : 50;
  const today = now.toISOString().split('T')[0];
  const lastDate = data.lastStudyDate?.split('T')[0];

  const updates = {
    quizzesTaken: (data.quizzesTaken || 0) + 1,
    quizAverage: calculateNewAverage(data.quizAverage, data.quizzesTaken, result.percentage),
    xp: (data.xp || 0) + xpEarned,
    updatedAt: now.toISOString()
  };

  if (lastDate !== today) {
    updates.streak = (data.streak || 0) + 1;
    if (updates.streak > (data.maxStreak || 0)) updates.maxStreak = updates.streak;
    updates.lastStudyDate = now.toISOString();
  }

  await progressRef.update(updates);
}

function calculateNewAverage(oldAvg, oldCount, newScore) {
  const count = (oldCount || 0) + 1;
  return Math.round((((oldAvg || 0) * (count - 1)) + newScore) / count);
}

module.exports = { submitQuizHandler, gradeAnswer };

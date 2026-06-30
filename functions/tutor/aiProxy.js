/**
 * aiProxy.js
 * Proxy Cloud Function pour les appels IA.
 * Le navigateur ne connait JAMAIS les cles API.
 * Toutes les requetes IA passent par cette fonction securisee.
 */

const axios = require('axios');
const { db, COLLECTIONS, SECRETS } = require('../config/firebaseAdmin');
const { log, logError, logSecurity } = require('../shared/logger');
const { isValidUid, sanitizeString } = require('../shared/validators');

const CECRL_PROMPTS = {
  A1: 'Tu es un tuteur de francais patient pour un DEBUTANT. Phrases courtes, vocabulaire simple. Reponds en francais avec traduction anglaise si utile.',
  A2: 'Tu es un tuteur de francais pour un niveau ELEMENTAIRE. Explications claires, corrections gentilles. Reponds en francais principalement.',
  B1: 'Tu es un tuteur pour un niveau INTERMEDIAIRE. Francais uniquement, nuances expliquees. Corrige les erreurs avec explications.',
  B2: 'Tu es un tuteur avance pour un niveau AVANCE. Vocabulaire riche, registres varies, expressions idiomatiques.',
  C1: 'Tu es un expert pour un niveau AUTONOME. Analyses approfondies, alternatives stylistiques, references culturelles.',
  C2: 'Tu es un linguiste expert pour un niveau MAITRISE. Precision chirurgicale, dimensions culturelles et sociolinguistiques.'
};

const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GEMINI: 'gemini'
};

/**
 * Appelle l'API OpenAI via le proxy securise.
 */
async function callOpenAI(systemPrompt, userMessage, temperature = 0.7) {
  if (!SECRETS.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY non configuree');

  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature,
    max_tokens: 2000
  }, {
    headers: {
      'Authorization': `Bearer ${SECRETS.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });

  return response.data.choices[0].message.content;
}

/**
 * Appelle l'API Anthropic via le proxy securise.
 */
async function callAnthropic(systemPrompt, userMessage, temperature = 0.7) {
  if (!SECRETS.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY non configuree');

  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-3-haiku-20240307',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    temperature
  }, {
    headers: {
      'x-api-key': SECRETS.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });

  return response.data.content[0].text;
}

/**
 * Appelle l'API Gemini via le proxy securise.
 */
async function callGemini(systemPrompt, userMessage) {
  if (!SECRETS.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY non configuree');

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${SECRETS.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }],
      generationConfig: { maxOutputTokens: 2000, temperature: 0.7 }
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
  );

  return response.data.candidates[0].content.parts[0].text;
}

/**
 * Proxy IA principal — point d'entree unique pour toutes les requetes IA.
 * Le client envoie : { message, cefrLevel, context, provider }
 * Le serveur : ajoute le system prompt securise, appelle l'API, retourne la reponse.
 */
async function tutorProxyHandler(data, context) {
  // 1. Auth requise
  if (!context.auth) {
    await logSecurity('ai_noAuth', '', { messageLength: data.message?.length });
    throw new Error('Authentification requise');
  }

  const userId = context.auth.uid;
  const { message, cefrLevel = 'A1', context = '', provider = AI_PROVIDERS.OPENAI, messageType = 'text' } = data;

  if (!message || typeof message !== 'string') {
    throw new Error('Message requis');
  }

  const sanitizedMessage = sanitizeString(message, 5000);
  const systemPrompt = CECRL_PROMPTS[cefrLevel] || CECRL_PROMPTS.A1;

  // Ajouter le contexte pedagogique au prompt
  const fullSystemPrompt = `${systemPrompt}\n\nContexte de la lecon : ${context || 'Discussion libre'}\n\nType de reponse attendue : ${messageType}.`;

  try {
    let response;

    // Appel au provider selectionne
    switch (provider) {
      case AI_PROVIDERS.ANTHROPIC:
        response = await callAnthropic(fullSystemPrompt, sanitizedMessage);
        break;
      case AI_PROVIDERS.GEMINI:
        response = await callGemini(fullSystemPrompt, sanitizedMessage);
        break;
      case AI_PROVIDERS.OPENAI:
      default:
        response = await callOpenAI(fullSystemPrompt, sanitizedMessage);
        break;
    }

    // Sauvegarder dans le tutor memory (pour la memoire pedagogique)
    await saveTutorMessage(userId, sanitizedMessage, response, cefrLevel);

    // Logger l'appel (sans le contenu complet pour la confidentialite)
    await log('tutor', 'aiResponse', userId, {
      cefrLevel, provider, messageLength: sanitizedMessage.length, responseLength: response.length
    });

    return {
      response,
      cefrLevel,
      provider,
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    await logError('aiProxy', userId, err, 'critical');

    // Fallback : reponse par defaut si l'API est indisponible
    return {
      response: `Je suis desole, je rencontre un probleme technique. Veuillez reessayer dans un moment. (Erreur: ${err.message})`,
      cefrLevel,
      provider: 'fallback',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Sauvegarde le message dans le tutor memory.
 */
async function saveTutorMessage(userId, userMessage, aiResponse, cefrLevel) {
  try {
    const memoryRef = db.collection(COLLECTIONS.TUTOR_MEMORY).doc(userId);
    const memoryDoc = await memoryRef.get();

    const now = new Date().toISOString();

    if (memoryDoc.exists) {
      await memoryRef.update({
        totalMessages: (memoryDoc.data().totalMessages || 0) + 1,
        lastInteractionAt: now,
        updatedAt: now
      });
    } else {
      await memoryRef.set({
        userId,
        cefrLevel,
        totalMessages: 1,
        recurringErrors: [],
        learnedVocabulary: [],
        masteredTopics: [],
        lastInteractionAt: now,
        createdAt: now,
        updatedAt: now
      });
    }
  } catch (e) {
    // Non critique
  }
}

module.exports = { tutorProxyHandler, AI_PROVIDERS };

const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const OPENAI_TIMEOUT_MS = 10000;

// -----------------------------------------------------------------------
// Tone detection
// -----------------------------------------------------------------------

const TONE_RULES = [
  { keywords: ['urgente', 'agora', 'imediato', 'socorro'], tone: 'Urgente' },
  { keywords: ['obrigado', 'agradeço', 'grato', 'valeu'], tone: 'Agradecido' },
  { keywords: ['problema', 'erro', 'falha', 'bug', 'defeito'], tone: 'Empático' },
  { keywords: ['cancelar', 'cancelamento', 'devolver', 'reembolso'], tone: 'Crítico' },
];

function guessTone(text = '') {
  const normalized = text.toLowerCase();
  for (const rule of TONE_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      return rule.tone;
    }
  }
  return 'Profissional';
}

// -----------------------------------------------------------------------
// Fallback (sem LLM)
// -----------------------------------------------------------------------

function fallbackSuggestion(event) {
  const tone = guessTone(event.text);
  const snippet = event.text.length > 120 ? `${event.text.slice(0, 120)}...` : event.text;
  const reasons = [
    snippet || 'Conteúdo não textual recebido.',
    `Remetente: ${event.senderName || event.from}`,
  ];
  const actions = [
    'Confirme o tom em uma resposta rápida.',
    'Verifique o histórico da conta antes de responder.',
  ];
  return {
    tone,
    reasons,
    actions,
    summary: `${event.senderName || 'Cliente'} enviou: ${snippet}`,
  };
}

// -----------------------------------------------------------------------
// OpenAI integration
// -----------------------------------------------------------------------

async function callOpenAI(event) {
  if (!OPENAI_API_KEY) {
    return null;
  }

  const prompt = [
    'Resuma a mensagem do WhatsApp abaixo e proponha até 3 próximos passos.',
    `Mensagem: "${event.text}"`,
    'Responda SOMENTE com JSON válido contendo as chaves: "tone" (string), "reasons" (array de strings), "actions" (array de strings), "summary" (string).',
  ].join('\n');

  const payload = {
    model: OPENAI_MODEL,
    temperature: 0.5,
    max_tokens: 400,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Você é um assistente que resume mensagens de clientes e sugere próximos passos para operadores da empresa. Responda sempre em JSON.',
      },
      { role: 'user', content: prompt },
    ],
  };

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    payload,
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: OPENAI_TIMEOUT_MS,
    },
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI retornou conteúdo vazio');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('não foi possível parsear a resposta da LLM');
  }

  return {
    tone: typeof parsed.tone === 'string' ? parsed.tone : guessTone(event.text),
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 3) : [],
    actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3) : [],
    summary: typeof parsed.summary === 'string' ? parsed.summary : event.text,
  };
}

// -----------------------------------------------------------------------
// Telegram text builder
// -----------------------------------------------------------------------

function buildTelegramText(event, suggestion) {
  const lines = [
    `<b>Nova mensagem de ${event.senderName || event.from}</b>`,
    `<i>Tom sugerido: ${suggestion.tone}</i>`,
    '',
    '<b>Razoes:</b>',
    ...suggestion.reasons.slice(0, 3).map((r, i) => `${i + 1}. ${r}`),
    '',
    '<b>Proximas acoes:</b>',
    ...suggestion.actions.slice(0, 3).map((a, i) => `${i + 1}. ${a}`),
  ];
  return lines.join('\n');
}

// -----------------------------------------------------------------------
// Main export
// -----------------------------------------------------------------------

async function generateSuggestion(event) {
  try {
    const llmResponse = await callOpenAI(event);
    if (llmResponse) {
      return { ...llmResponse, telegramText: buildTelegramText(event, llmResponse) };
    }
  } catch (error) {
    console.warn(JSON.stringify({ level: 'warn', message: 'LLM fallback ativado', reason: error.message }));
  }

  const fallback = fallbackSuggestion(event);
  return { ...fallback, telegramText: buildTelegramText(event, fallback) };
}

module.exports = {
  generateSuggestion,
  __test: {
    guessTone,
    fallbackSuggestion,
    buildTelegramText,
  },
};

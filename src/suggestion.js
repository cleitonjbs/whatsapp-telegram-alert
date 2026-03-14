const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

function guessTone(text = '') {
  const normalized = text.toLowerCase();
  if (normalized.includes('urgente') || normalized.includes('agora')) {
    return 'Urgente';
  }
  if (normalized.includes('obrigado') || normalized.includes('agradeço')) {
    return 'Agradecido';
  }
  if (normalized.includes('problema') || normalized.includes('erro')) {
    return 'Empático';
  }
  return 'Profissional';
}

function fallbackSuggestion(event) {
  const tone = guessTone(event.text);
  const reasons = [
    event.text.length > 120 ? `${event.text.slice(0, 120)}...` : event.text,
    `Recebido de ${event.senderName || event.from}`,
  ];
  const actions = [
    'Confirme o tom em uma resposta rápida.',
    'Verifique o histórico da conta antes de responder.',
  ];
  return {
    tone,
    reasons,
    actions,
    summary: `${event.senderName || 'Cliente'} enviou: ${event.text}`,
  };
}

async function callOpenAI(event) {
  if (!OPENAI_API_KEY) {
    return null;
  }

  const prompt = `Resuma a seguinte mensagem do WhatsApp e proponha próximos passos curtos.
Mensagem: "${event.text}"
Inclua o tom sugerido e liste até 3 razões e ações como JSON com keys "tone", "reasons" (array) e "actions" (array).`;

  const payload = {
    model: OPENAI_MODEL,
    temperature: 0.6,
    messages: [
      {
        role: 'system',
        content: 'Você é um assistente que resume mensagens de cliente e sugere próximos passos para operadores da empresa.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  const headers = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, { headers });
  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI retornou conteúdo vazio');
  }

  try {
    const parsed = JSON.parse(content);
    return {
      tone: parsed.tone || guessTone(event.text),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      summary: parsed.summary || event.text,
    };
  } catch (error) {
    throw new Error('não foi possível parsear a resposta da LLM');
  }
}

function buildTelegramText(event, suggestion) {
  const header = `🚨 Nova mensagem: ${event.senderName || event.from}`;
  const toneLine = `Tom sugerido: ${suggestion.tone}`;
  const reasonLines = suggestion.reasons
    .slice(0, 3)
    .map((reason, index) => `${index + 1}. ${reason}`)
    .join('\n');
  const actionLines = suggestion.actions
    .slice(0, 3)
    .map((action, index) => `${index + 1}. ${action}`)
    .join('\n');

  return [header, toneLine, 'Razões:', reasonLines, 'Próximas ações:', actionLines].filter(Boolean).join('\n\n');
}

async function generateSuggestion(event) {
  try {
    const llmResponse = await callOpenAI(event);
    if (llmResponse) {
      return {
        ...llmResponse,
        telegramText: buildTelegramText(event, llmResponse),
      };
    }
  } catch (error) {
    console.warn('LLM fallback:', error.message);
  }

  const fallback = fallbackSuggestion(event);
  return {
    ...fallback,
    telegramText: buildTelegramText(event, fallback),
  };
}

module.exports = {
  generateSuggestion,
  __test: {
    guessTone,
    fallbackSuggestion,
  },
};

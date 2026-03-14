const { generateSuggestion } = require('./suggestion');
const { sendTelegramAlert } = require('./telegram');

const processedIds = new Set();
const MAX_TRACKED = 2000;
const trackedQueue = [];

function log(level, message, meta = {}) {
  const entry = { level, time: new Date().toISOString(), message, ...meta };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// -----------------------------------------------------------------------
// WAHA webhook — payload format:
// {
//   event: "message",
//   session: "default",
//   payload: {
//     id: "...",
//     from: "5511999999999@c.us",
//     body: "texto",
//     hasMedia: false,
//     timestamp: 1667561485,
//     _data: { notifyName: "João" }
//   }
// }
// -----------------------------------------------------------------------

async function handleWahaWebhook(payload) {
  if (!payload || typeof payload.event !== 'string') {
    throw new Error('invalid waha payload');
  }

  // Só processa eventos de mensagens recebidas (não as enviadas por nós)
  const HANDLED_EVENTS = ['message', 'message.any'];
  if (!HANDLED_EVENTS.includes(payload.event)) {
    log('info', 'waha event ignored', { event: payload.event });
    return;
  }

  const msgPayload = payload.payload;
  if (!msgPayload || !msgPayload.id) {
    log('warn', 'waha payload sem id, ignorado', { event: payload.event });
    return;
  }

  // Ignora mensagens enviadas pelo próprio número
  if (msgPayload.fromMe === true) {
    log('info', 'mensagem própria ignorada', { id: msgPayload.id });
    return;
  }

  const event = normalizeWahaMessage(payload);
  if (!event) return;

  await processEvent(event);
}

function normalizeWahaMessage(wahaEvent) {
  const p = wahaEvent.payload || {};
  if (!p.id) return null;

  // Nome do remetente pode estar em _data.notifyName ou pushName
  const senderName =
    p._data?.notifyName ||
    p._data?.pushName ||
    wahaEvent.me?.pushName ||
    (p.from ? p.from.replace('@c.us', '').replace('@s.whatsapp.net', '') : 'Desconhecido');

  const text = p.body || (p.hasMedia ? `[midia: ${p.type || 'arquivo'}]` : '');
  const snippet = text || p.type || 'conteúdo multimídia';

  return {
    id: p.id,
    session: wahaEvent.session || 'default',
    from: p.from || '',
    senderName,
    text: snippet,
    type: p.type || 'text',
    hasMedia: p.hasMedia || false,
    mediaUrl: p.media?.url || null,
    timestamp: p.timestamp,
    raw: p,
  };
}

async function processEvent(event) {
  if (shouldSkip(event.id)) {
    log('info', 'duplicate message skipped', { messageId: event.id });
    return;
  }

  log('info', 'processing waha event', { messageId: event.id, from: event.from, type: event.type });

  try {
    const suggestion = await generateSuggestion(event);
    await sendTelegramAlert(event, suggestion);
    log('info', 'alert dispatched', { messageId: event.id });
  } catch (err) {
    log('error', 'failed to process event', { messageId: event.id, error: err.message });
    throw err;
  }
}

function shouldSkip(messageId) {
  if (!messageId) return true;
  if (processedIds.has(messageId)) return true;

  processedIds.add(messageId);
  trackedQueue.push(messageId);
  if (trackedQueue.length > MAX_TRACKED) {
    processedIds.delete(trackedQueue.shift());
  }
  return false;
}

module.exports = {
  handleWahaWebhook,
  __test: {
    normalizeWahaMessage,
    processedIds,
    shouldSkip,
  },
};

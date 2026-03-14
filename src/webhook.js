const { generateSuggestion } = require('./suggestion');
const { sendTelegramAlert } = require('./telegram');

const VERIFY_TOKEN = process.env.WABA_VERIFY_TOKEN;

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

function handleWebhookVerification({ 'hub.verify_token': token, 'hub.challenge': challenge }) {
  if (VERIFY_TOKEN && token === VERIFY_TOKEN) {
    log('info', 'webhook verification successful');
    return challenge || 'OK';
  }
  log('warn', 'webhook verification failed', { tokenProvided: !!token });
  return null;
}

async function handleIncomingMessages(payload) {
  if (!payload || !Array.isArray(payload.entry)) {
    throw new Error('invalid webhook payload');
  }

  const events = [];
  payload.entry.forEach((entry) => {
    (entry.changes || []).forEach((change) => {
      const value = change.value || {};
      const contacts = value.contacts || [];
      const contact = contacts[0] || {};
      const messages = value.messages || [];
      messages.forEach((message) => {
        const event = normalizeMessage(entry.id, contact, message);
        if (event) {
          events.push(event);
        }
      });
    });
  });

  log('info', 'processing incoming webhook', { eventCount: events.length });
  await Promise.all(events.map((event) => processEvent(event)));
}

function normalizeMessage(entryId, contact, message) {
  if (!message || !message.id) {
    return null;
  }

  const text = message.text?.body || '';
  const name = contact.profile?.name || contact.wa_id || message.from;
  const snippet = text || message.type || 'conteúdo multimídia';

  return {
    id: message.id,
    entryId,
    from: message.from,
    senderName: name,
    text: snippet,
    type: message.type,
    timestamp: message.timestamp,
    raw: message,
  };
}

async function processEvent(event) {
  if (shouldSkip(event.id)) {
    log('info', 'duplicate message skipped', { messageId: event.id });
    return;
  }

  log('info', 'processing event', { messageId: event.id, from: event.from, type: event.type });

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
  if (!messageId) {
    return true;
  }
  if (processedIds.has(messageId)) {
    return true;
  }
  processedIds.add(messageId);
  trackedQueue.push(messageId);
  if (trackedQueue.length > MAX_TRACKED) {
    const stale = trackedQueue.shift();
    processedIds.delete(stale);
  }
  return false;
}

module.exports = {
  handleWebhookVerification,
  handleIncomingMessages,
  __test: {
    normalizeMessage,
    processedIds,
    shouldSkip,
  },
};

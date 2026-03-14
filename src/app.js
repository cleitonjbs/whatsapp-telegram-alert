const express = require('express');
const crypto = require('crypto');
const { handleWahaWebhook } = require('./webhook');

const START_TIME = Date.now();
const WAHA_HMAC_KEY = process.env.WAHA_HMAC_KEY || '';

function log(level, message, meta = {}) {
  const entry = { level, time: new Date().toISOString(), message, ...meta };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// Valida assinatura HMAC opcional do WAHA (X-Webhook-Hmac + sha512)
function verifyHmac(req) {
  if (!WAHA_HMAC_KEY) return true; // HMAC não configurado, aceita tudo

  const signature = req.headers['x-webhook-hmac'];
  if (!signature) {
    log('warn', 'hmac header ausente');
    return false;
  }

  const expected = crypto
    .createHmac('sha512', WAHA_HMAC_KEY)
    .update(req.rawBody || '')
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function createApp() {
  const app = express();

  // Preserva o raw body para verificação HMAC
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    }),
  );

  // ------------------------------------------------------------------
  // Health check
  // ------------------------------------------------------------------
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
      timestamp: new Date().toISOString(),
    });
  });

  // ------------------------------------------------------------------
  // Webhook do WAHA (POST /webhook)
  // Configure no WAHA: url = http://<seu-host>:3000/webhook
  // ------------------------------------------------------------------
  app.post('/webhook', async (req, res) => {
    if (!verifyHmac(req)) {
      log('warn', 'waha hmac inválido, requisição rejeitada');
      return res.status(401).json({ error: 'unauthorized' });
    }

    try {
      await handleWahaWebhook(req.body);
      return res.sendStatus(200);
    } catch (error) {
      log('error', 'waha webhook processing failed', { reason: error.message });
      if (error.message === 'invalid waha payload') {
        return res.status(400).json({ error: error.message });
      }
      // Retorna 200 mesmo em erros internos para evitar reenvios infinitos
      return res.sendStatus(200);
    }
  });

  // ------------------------------------------------------------------
  // Rota raiz
  // ------------------------------------------------------------------
  app.get('/', (_req, res) => {
    res.json({ service: 'WAHA → Telegram alert bridge', status: 'running' });
  });

  // ------------------------------------------------------------------
  // 404 genérico
  // ------------------------------------------------------------------
  app.use((_req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  return app;
}

module.exports = createApp;

require('dotenv').config();
const createApp = require('./app');

const PORT = process.env.PORT || 3000;

function log(level, message, meta = {}) {
  const entry = { level, time: new Date().toISOString(), message, ...meta };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// Validação antecipada das variáveis obrigatórias
const REQUIRED_VARS = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
if (missing.length > 0) {
  log('error', 'variáveis de ambiente obrigatórias ausentes', { missing });
  process.exit(1);
}

const app = createApp();

const server = app.listen(PORT, () => {
  log('info', 'servidor iniciado', { port: PORT, env: process.env.NODE_ENV || 'development' });
});

// Graceful shutdown: aguarda conexões ativas encerrarem antes de sair
function shutdown(signal) {
  log('info', 'sinal de encerramento recebido', { signal });
  server.close(() => {
    log('info', 'servidor encerrado com sucesso');
    process.exit(0);
  });

  // Força encerramento após 10 s se ainda houver conexões abertas
  setTimeout(() => {
    log('warn', 'forçando encerramento após timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  log('error', 'uncaughtException', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log('error', 'unhandledRejection', { reason: String(reason) });
});

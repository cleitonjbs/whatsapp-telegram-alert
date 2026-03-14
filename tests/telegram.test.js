const nock = require('nock');

const OLD_ENV = process.env;

beforeEach(() => {
  process.env = { ...OLD_ENV, TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: '12345' };
});

afterEach(() => {
  nock.cleanAll();
  process.env = OLD_ENV;
  jest.resetModules();
});

describe('telegram dispatcher', () => {
  it('creates a keyboard with sanitized ids', () => {
    const { __test } = require('../src/telegram');
    const keyboard = __test.createKeyboard('abc:123');
    expect(keyboard.inline_keyboard[0][0].callback_data).toContain('reply:abc_123');
  });

  it('sends a message with inline keyboard', async () => {
    const { sendTelegramAlert } = require('../src/telegram');
    const scope = nock('https://api.telegram.org')
      .post('/bottest-token/sendMessage')
      .reply(200, { ok: true });

    const event = { id: 'msg-1', senderName: 'Cliente', from: '551199999' };
    await sendTelegramAlert(event, { telegramText: 'teste' });

    expect(scope.isDone()).toBe(true);
  });
});

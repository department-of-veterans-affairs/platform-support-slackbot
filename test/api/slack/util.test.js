const { expect } = require('chai');

describe('api/slack/util', () => {
  let util;

  beforeEach(() => {
    util = require('../../../src/api/slack/util')(logger);
  });

  afterEach(() => {
    util = null;
  });

  describe('stringifyMessageId()', () => {
    it('should stringify a timestamp', () => {
      let timestamp = 1620757447.050401;

      let result = util.stringifyMessageId(timestamp);

      expect(result).to.equal('msgId:1620757447.050401');
    });
    it('should fail gracefully with a null', () => {
      let timestamp = null;

      let result = util.stringifyMessageId(timestamp);

      expect(result).to.equal('msgId:');
    });
  });

  describe('createMessageLink()', () => {
    it('build a message link correctly', () => {
      // Example Link:
      // https://example.slack.com/archives/C01UZ7SULTX/p1620056853018500
      const channel = 'C01UZ7SULTX';
      const host = 'example.slack.com';
      const messageId = '1620055651.018100';

      const link = util.createMessageLink(host, channel, messageId);

      expect(link).to.equal(
        'https://example.slack.com/archives/C01UZ7SULTX/p1620055651018100'
      );
    });

    it('should return an empty string with a null channel', () => {
      const channel = null;
      const host = 'example.slack.com';
      const messageId = 'abc';

      const link = util.createMessageLink(host, channel, messageId);

      expect(link).to.equal('');
    });

    it('should return an empty string with a null message host', () => {
      const channel = 'abc';
      const host = null;
      const messageId = 'abc';

      const link = util.createMessageLink(host, channel, messageId);

      expect(link).to.equal('');
    });

    it('should return an empty string with a null message id', () => {
      const channel = 'abc';
      const host = 'example.slack.com';
      const messageId = null;

      const link = util.createMessageLink(host, channel, messageId);

      expect(link).to.equal('');
    });
  });
});

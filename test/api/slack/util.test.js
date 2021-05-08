const expect = require('chai').expect;

const logger = require('pino')({
  enabled: false,
});

describe('Util', () => {
  let util;

  beforeEach(() => {
    util = require('../../../src/api/slack/util')(logger);
  });

  afterEach(() => {
    util = null;
  });

  describe('createMessageLink()', () => {
    it('build a message link correctly', () => {
      // Example Link:
      // https://adhoc.slack.com/archives/C01UZ7SULTX/p1620056853018500
      const channel = 'C01UZ7SULTX';
      const messageId = '1620055651.018100';

      const link = util.createMessageLink(channel, messageId);

      expect(link).to.equal(
        'https://adhoc.slack.com/archives/C01UZ7SULTX/p1620055651018100'
      );
    });

    it('should return an empty string with a null channel', () => {
      const channel = null;
      const messageId = 'abc';

      const link = util.createMessageLink(channel, messageId);

      expect(link).to.equal('');
    });

    it('should return an empty string with a null message id', () => {
      const channel = 'abc';
      const messageId = null;

      const link = util.createMessageLink(channel, messageId);

      expect(link).to.equal('');
    });
  });

  describe('parseChannelTopic()', () => {
    it('should parse a correctly written channel topic', () => {
      const channelTopic = `Need help from Platform? Ask here!
      Off-hours emergency? Ping #oncall!
      
      BE: @Riley Anderson
      FE: @eugene_doan
      OPS: @Jeremy Britt
      DS: @brooks
      Analytics: @Jon Wehausen
      Collab Cycle: @vsp-product-support-members`;

      const result = util.parseChannelTopic(channelTopic);

      expect(result['BE']).to.equal('@Riley Anderson');
      expect(result['FE']).to.equal('@eugene_doan');
      expect(result['OPS']).to.equal('@Jeremy Britt');
      expect(result['DS']).to.equal('@brooks');
      expect(result['Analytics']).to.equal('@Jon Wehausen');
      expect(result['Collab Cycle']).to.equal('@vsp-product-support-members');
    });
  });
});

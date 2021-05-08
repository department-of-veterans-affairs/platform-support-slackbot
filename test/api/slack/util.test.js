const expect = require('chai').expect;

const logger = require('pino')({
  enabled: false,
});

describe('api/slack', () => {
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

        expect(Object.keys(result).length).to.equal(6);
        expect(result['be']).to.equal('@Riley Anderson');
        expect(result['fe']).to.equal('@eugene_doan');
        expect(result['ops']).to.equal('@Jeremy Britt');
        expect(result['ds']).to.equal('@brooks');
        expect(result['analytics']).to.equal('@Jon Wehausen');
        expect(result['collab cycle']).to.equal('@vsp-product-support-members');
      });

      it('should parse a mixed case channel topic', () => {
        const channelTopic = `Need help from Platform? Ask here!
        Off-hours emergency? Ping #oncall!
        
        Be: @Riley Anderson
        fE: @eugene_doan
        OpS: @Jeremy Britt
        Ds: @brooks
        AnAlYTiCs: @Jon Wehausen
        ColLaB CYclE: @vsp-product-support-members`;

        const result = util.parseChannelTopic(channelTopic);

        expect(result['be']).to.equal('@Riley Anderson');
        expect(result['fe']).to.equal('@eugene_doan');
        expect(result['ops']).to.equal('@Jeremy Britt');
        expect(result['ds']).to.equal('@brooks');
        expect(result['analytics']).to.equal('@Jon Wehausen');
        expect(result['collab cycle']).to.equal('@vsp-product-support-members');
      });

      it('should ignore random @-mentions', () => {
        const channelTopic = `Need help from Platform? Ask here!
        Off-hours emergency? Ping @chris!! @alex
        
        BE: @Riley Anderson
        FE: @eugene_doan`;

        const result = util.parseChannelTopic(channelTopic);

        expect(Object.keys(result).length).to.equal(2);
        expect(result['be']).to.equal('@Riley Anderson');
        expect(result['fe']).to.equal('@eugene_doan');
      });

      it('should allow for no spacing between colon and @-mention', () => {
        const channelTopic = `Need help from Platform? Ask here!
        Off-hours emergency? Ping #oncall!
        
        Be:@Riley Anderson
        fE:@eugene_doan`;

        const result = util.parseChannelTopic(channelTopic);

        expect(Object.keys(result).length).to.equal(2);
        expect(result['be']).to.equal('@Riley Anderson');
        expect(result['fe']).to.equal('@eugene_doan');
      });

      it('should not crash on invalid on call specification', () => {
        const channelTopic = `Need help from Platform? Ask here!
        Off-hours emergency? Ping #oncall!
        
        :@ 
        Be:@Riley Anderson
        fE:@eugene_doan`;

        const result = util.parseChannelTopic(channelTopic);

        expect(Object.keys(result).length).to.equal(2);
        expect(result['be']).to.equal('@Riley Anderson');
        expect(result['fe']).to.equal('@eugene_doan');
      });

      it('should not crash on split character', () => {
        const channelTopic = `Need help from Platform? Ask here!
        Off-hours emergency? Ping #oncall!
        
        : 
        Be:@Riley Anderson
        fE:@eugene_doan`;

        const result = util.parseChannelTopic(channelTopic);

        expect(Object.keys(result).length).to.equal(2);
        expect(result['be']).to.equal('@Riley Anderson');
        expect(result['fe']).to.equal('@eugene_doan');
      });
    });
  });
});

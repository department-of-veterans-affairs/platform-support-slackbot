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
        
        BE: <@U01T9CL8PEK>
        FE: <@U1Q33H0LT>
        OPS: <@U01T9CL8PEK>
        DS: @brooks
        Analytics: @Jon Wehausen
        Collab Cycle: <!subteam^S01U1JJPANT|@va-principals-product>`;

        const result = util.parseChannelTopic(channelTopic);

        expect(Object.keys(result).length).to.equal(4);
        expect(result['be']).to.equal('<@U01T9CL8PEK>');
        expect(result['fe']).to.equal('<@U1Q33H0LT>');
        expect(result['ops']).to.equal('<@U01T9CL8PEK>');
        expect(result['collab cycle']).to.equal(
          '<!subteam^S01U1JJPANT|@va-principals-product>'
        );
      });

      it('should parse a mixed case channel topic', () => {
        const channelTopic = `Need help from Platform? Ask here!
          Off-hours emergency? Ping #oncall!

          Be: <@U01T9CL8PEK>
          fE: <@U1Q33H0LT>
          OpS: <@U01T9CL8PEK>
          Ds: @brooks
          AnAlYTiCs: @Jon Wehausen
          ColLaB CYclE: <!subteam^S01U1JJPANT|@va-principals-product>`;

        const result = util.parseChannelTopic(channelTopic);

        expect(result['be']).to.equal('<@U01T9CL8PEK>');
        expect(result['fe']).to.equal('<@U1Q33H0LT>');
        expect(result['ops']).to.equal('<@U01T9CL8PEK>');
        expect(result['collab cycle']).to.equal(
          '<!subteam^S01U1JJPANT|@va-principals-product>'
        );
      });

      it('should ignore random @-mentions', () => {
        const channelTopic = `Need help from Platform? Ask here!
          Off-hours emergency? Ping @chris!! @alex

          BE: <@U01T9CL8PEK>
          FE: <@U1Q33H0LT>`;

        const result = util.parseChannelTopic(channelTopic);

        expect(Object.keys(result).length).to.equal(2);
        expect(result['be']).to.equal('<@U01T9CL8PEK>');
        expect(result['fe']).to.equal('<@U1Q33H0LT>');
      });

      it('should allow for no spacing between colon and @-mention', () => {
        const channelTopic = `Need help from Platform? Ask here!
          Off-hours emergency? Ping #oncall!

          Be:<@U01T9CL8PEK>
          fE:<@U1Q33H0LT>`;

        const result = util.parseChannelTopic(channelTopic);

        expect(Object.keys(result).length).to.equal(2);
        expect(result['be']).to.equal('<@U01T9CL8PEK>');
        expect(result['fe']).to.equal('<@U1Q33H0LT>');
      });

      it('should not crash on invalid on call specification', () => {
        const channelTopic = `Need help from Platform? Ask here!
          Off-hours emergency? Ping #oncall!

          :<@>
          Be:<@U01T9CL8PEK>
          fE:<@U1Q33H0LT>`;

        const result = util.parseChannelTopic(channelTopic);

        expect(Object.keys(result).length).to.equal(2);
        expect(result['be']).to.equal('<@U01T9CL8PEK>');
        expect(result['fe']).to.equal('<@U1Q33H0LT>');
      });

      it('should not crash on split character', () => {
        const channelTopic = `Need help from Platform? Ask here!
          Off-hours emergency? Ping #oncall!

          :
          Be:<@U01T9CL8PEK>
          fE:<@U1Q33H0LT>`;

        const result = util.parseChannelTopic(channelTopic);

        expect(Object.keys(result).length).to.equal(2);
        expect(result['be']).to.equal('<@U01T9CL8PEK>');
        expect(result['fe']).to.equal('<@U1Q33H0LT>');
      });
    });
  });
});

const sinon = require('sinon');
const chai = require('chai');
const assertArrays = require('chai-arrays');

// Chai Setup
chai.use(assertArrays);
const expect = chai.expect;

const logger = require('pino')({
  enabled: false,
});

describe('api/google', () => {
  describe('Google Sheets', () => {
    let sheets;
    let obj = {};

    beforeEach(() => {
      sheets = require('../../../src/api/google')(logger);

      // Initialize Spies
      obj.addRow = sinon.spy();

      // Initialize Stubs
      sinon
        .stub(sheets, 'getGoogleSheet')
        .withArgs(sinon.match.any)
        .returns(obj);

      sinon.stub(sheets, 'getResponsesSheet').resolves(obj);

      sinon.stub(sheets, 'getTeamsSheetRows').resolves([
        { Title: 'Frontend Tools', Id: 'FE' },
        { Title: 'Backend Tools', Id: 'BE' },
      ]);

      sheets.getGoogleSheet.callThrough();
      sheets.getTeamsSheetRows.callThrough();
    });

    afterEach(() => {
      sheets = null;
    });

    describe('getTeams()', () => {
      it('should convert teams to text/value pair', async () => {
        const result = await sheets.getTeams();

        expect(result).to.eql([
          { text: 'Frontend Tools', value: 'FE' },
          { text: 'Backend Tools', value: 'BE' },
        ]);
      });
    });

    describe('getTeamById()', () => {
      it('should get team by 1 based index', async () => {
        const result = await sheets.getTeamById(2);

        expect(result).to.eql({
          Title: 'Backend Tools',
          Id: 'BE',
        });
      });

      it('should return null if the team is not found', async () => {
        const result = await sheets.getTeamById(3);

        expect(result).to.be.null;
      });
    });

    describe('captureResponses()', () => {
      it('should save responses correctly', async () => {
        const ticketId = 'ticket123';
        const messageId = 'abcd1234';
        const username = 'alex.yip';
        const usersRequestingSupport = ['alex.yip', 'james'];
        const selectedTeam = 'FE';
        const summaryDescription = 'I need some support';
        const messageLink = 'http://example.com/abcd1234';
        const dateTime = new Date();

        await sheets.captureResponses(
          ticketId,
          messageId,
          username,
          usersRequestingSupport,
          selectedTeam,
          summaryDescription,
          messageLink,
          dateTime
        );

        const spy = obj.addRow;
        const firstCallArg = spy.getCall(0).args[0];

        expect(spy.called).to.be.true;
        expect(firstCallArg.TicketId).to.equal(ticketId);
        expect(firstCallArg.MessageId).to.equal(messageId);
        expect(firstCallArg.SubmittedBy).to.equal(username);
        expect(firstCallArg.DateTimeUTC).to.equal(dateTime);
        expect(firstCallArg.Users).to.equal('alex.yip, james');
        expect(firstCallArg.Team).to.equal(selectedTeam);
        expect(firstCallArg.Summary).to.equal(summaryDescription);
        expect(firstCallArg.MessageLink).to.equal(messageLink);
      });
    });

    describe('', () => {});
  });
});

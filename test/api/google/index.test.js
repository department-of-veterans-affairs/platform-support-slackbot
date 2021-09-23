const { expect } = require('chai');

describe('api/google', () => {
  let sheets;
  let obj = {};

  beforeEach(() => {
    sheets = require('../../../src/api/google')(logger);

    // Initialize Spies
    obj.addRow = sinon.spy();

    // Initialize Stubs
    sinon.stub(sheets, 'getGoogleSheet').withArgs(sinon.match.any).returns(obj);

    sinon.stub(sheets, 'getResponsesSheet').resolves(obj);

    sinon.stub(sheets, 'getTeamsSheetRows').resolves([
      { Display: 'Frontend Tools', Id: 'FE' },
      { Display: 'Backend Tools', Id: 'BE' },
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
        Display: 'Backend Tools',
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

  describe('updateReplyTimeStampForMessage()', () => {
    let responsesSheetRows = [];

    beforeEach(() => {
      responsesSheetRows = [
        { MessageId: 'msg:1000.0', FirstReplyTimeUTC: '', save: sinon.spy() },
        { MessageId: 'msg:1001.0', FirstReplyTimeUTC: '', save: sinon.spy() },
        { MessageId: 'msg:1002.0', FirstReplyTimeUTC: '', save: sinon.spy() },
      ];

      sinon.stub(sheets, 'getResponseSheetRows').resolves(responsesSheetRows);
    });

    afterEach(() => {
      responsesSheetRows = [];
    });

    it('should update time of first reply of specified Message Id', async () => {
      await sheets.updateReplyTimeStampForMessage('msg:1001.0');

      expect(responsesSheetRows[1].save.calledOnce).to.be.true;
      expect(responsesSheetRows[1].FirstReplyTimeUTC).to.be.not.empty;
    });

    it('should not update any rows for an invalid Message Id', async () => {
      await sheets.updateReplyTimeStampForMessage('msg:2021.1');

      expect(responsesSheetRows[0].save.notCalled);
      expect(responsesSheetRows[1].save.notCalled);
      expect(responsesSheetRows[2].save.notCalled);
    });
  });

  describe('updateAssignedTeamForMessage()', () => {
    let responsesSheetRows = [];

    beforeEach(() => {
      responsesSheetRows = [
        { TicketId: 'a1', Team: '', save: sinon.spy() },
        { TicketId: 'b2', Team: '', save: sinon.spy() },
        { TicketId: 'c3', Team: '', save: sinon.spy() },
      ];

      sinon.stub(sheets, 'getResponseSheetRows').resolves(responsesSheetRows);
    });

    afterEach(() => {
      responsesSheetRows = [];
    });

    it('should update team for Ticket Id', async () => {
      await sheets.updateAssignedTeamForMessage('b2', 'FE');

      expect(responsesSheetRows[1].save.calledOnce).to.be.true;
      expect(responsesSheetRows[1].Team).to.equal('FE');
    });

    it('should not update any rows for an invalid Ticket Id', async () => {
      await sheets.updateAssignedTeamForMessage('za13', 'FE');

      expect(responsesSheetRows[0].save.notCalled);
      expect(responsesSheetRows[1].save.notCalled);
      expect(responsesSheetRows[2].save.notCalled);
    });
  });

  describe('getMessageByTicketId()', () => {
    let responsesSheetRows = [];

    beforeEach(() => {
      responsesSheetRows = [
        { TicketId: 'a1', MessageId: 'msgId:1000.0' },
        { TicketId: 'b2', MessageId: 'msgId:1001.0' },
        { TicketId: 'c3', MessageId: 'msgId:1002.0' },
      ];

      sinon.stub(sheets, 'getResponseSheetRows').resolves(responsesSheetRows);
    });

    afterEach(() => {
      responsesSheetRows = [];
    });

    it('should return Slack message id (timestamp) as string', async () => {
      const slackMessageId = await sheets.getMessageByTicketId('c3');

      expect(slackMessageId).to.equal('1002.0');
    });

    it('should return null if ticket id is not found', async () => {
      const slackMessageId = await sheets.getMessageByTicketId('cz12');

      expect(slackMessageId).to.be.null;
    });
  });

  describe('', () => {});
});

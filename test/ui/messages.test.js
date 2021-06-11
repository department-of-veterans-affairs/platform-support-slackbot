const { expect } = require('chai');

const responseBuilder = require('../../src/ui/messages');

describe('ui/messages', () => {
  it('should populate a response message correctly', () => {
    const ticketId = 'abc123';
    const userId = 'alex.yip';
    const selectedTeam = 'FE Tools';
    const summaryDescription = 'I need a PR Reviewed';
    const mention = '<@alex.yip>';
    const team = null;

    let response = responseBuilder.buildSupportResponse(
      ticketId,
      userId,
      selectedTeam,
      summaryDescription,
      mention,
      team
    );

    expect(response[0].text.text).to.equal(
      "Hey there <@alex.yip>! We've received your Platform support request."
    );
    expect(response[1].text.text).to.equal('*Need help from*\nFE Tools');
    expect(response[2].text.text).to.equal('*Summary*\nI need a PR Reviewed');
    expect(response[3].text.text).to.equal('Assigned to: <@alex.yip>');
  });
});

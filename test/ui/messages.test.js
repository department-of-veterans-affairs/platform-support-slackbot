const { expect } = require('chai');

const responseBuilder = require('../../src/ui/messages');

describe('ui/messages', () => {
  it('should populate a response message correctly', () => {
    const ticketId = 'abc123';
    const userId = 'alex.yip';
    const selectedTeam = 'FE Tools';
    const selectedCategory = 'Pull Request';
    const summaryDescription = 'I need a PR Reviewed';
    const mention = '<@alex.yip>';
    const team = null;

    let response = responseBuilder.buildSupportResponse(
      ticketId,
      userId,
      selectedTeam,
      selectedCategory,
      summaryDescription,
      mention,
      team
    );

    expect(response[0].text.text).to.equal(
      "From *<@alex.yip>*: I need a PR Reviewed"
    );
    expect(response[2].text.text).to.equal('*Assigned to: <@alex.yip>* (FE Tools)\n');
  });
});

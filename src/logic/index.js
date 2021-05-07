const responseBuilder = require('../ui/messages');

module.exports = function (logger) {
  const sheets = require('../api/google')(logger);
  const util = require('../api/slack/util')(logger);

  let logic = {};

  logic.postHelpMessageToUserOnly = async (client, channel, user) => {
    await client.chat.postEphemeral({
      channel: channel,
      user: user,
      blocks: responseBuilder.buildHelpResponse(user),
    });
  };

  logic.updateTimeStampOfSupportResponse = async (slackMessageId) => {
    if (slackMessageId) {
      const messageIdString = util.stringifyMessageId(slackMessageId);
      logger.debug(messageIdString);
      sheets.updateReplyTimeStampForMessage(messageIdString);
    }
  };

  return logic;
};

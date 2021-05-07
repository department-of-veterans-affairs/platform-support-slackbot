const responseBuilder = require('../ui/messages');

module.exports = function (logger) {
  let logic = {};

  logic.postHelpMessageToUserOnly = async (client, channel, user) => {
    await client.chat.postEphemeral({
      channel: channel,
      user: user,
      blocks: responseBuilder.buildHelpResponse(user),
    });
  };

  return logic;
};

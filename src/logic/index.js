const modalBuilder = require('../ui/modals');
const responseBuilder = require('../ui/messages');

module.exports = function (logger) {
  const sheets = require('../api/google')(logger);
  const util = require('../api/slack/util')(logger);

  let logic = {};

  /**
   * Displays help (emphemeral) message to user. (Only visible to the user)
   * @param {object} client Slack Client Object
   * @param {string} channel Slack Channel Id
   * @param {string} user Slack User Id
   */
  logic.postHelpMessageToUserOnly = async (client, channel, user) => {
    await client.chat.postEphemeral({
      channel: channel,
      user: user,
      blocks: responseBuilder.buildHelpResponse(user),
    });
  };

  /**
   * Updates the timestamp of first reaction from user to a support ticket
   * @param {string} slackMessageId Slack Message Id
   */
  logic.updateTimeStampOfSupportResponse = async (slackMessageId) => {
    if (!slackMessageId) return;

    const messageIdString = util.stringifyMessageId(slackMessageId);
    logger.debug(messageIdString);
    sheets.updateReplyTimeStampForMessage(messageIdString);
  };

  /**
   * Displays support modal to the user.
   * @param {object} client Slack Client Object
   * @param {string} user Current User Id
   * @param {string} trigger_id Trigger Id to generate modal
   */
  logic.displaySupportModal = async (client, user, trigger_id) => {
    logger.debug('buildSupportModal()');

    const options = await sheets.getTeams();

    const view = modalBuilder.buildSupportModal(user, options);

    const result = await client.views.open({
      trigger_id,
      view,
    });

    logger.debug(`user: ${user}`);
    logger.trace(result);
  };

  /**
   * Displays reassignment modal to the user.
   * @param {object} client Slack Client Object
   * @param {*} ticketId Nanoid generated ticket Id to be used to reference Google Sheet
   * @param {string} trigger_id Trigger Id to generate modal
   */
  logic.displayReassignmentModal = async (client, ticketId, trigger_id) => {
    logger.debug('buildReassignmentModal()');

    const options = await sheets.getTeams();

    const view = modalBuilder.buildReassignmentModal(options, ticketId);

    const result = await client.views.open({
      trigger_id,
      view,
    });

    logger.debug(`ticketId: ${ticketId}`);
    logger.trace(result);
  };

  return logic;
};

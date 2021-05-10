const modalBuilder = require('../ui/modals');
const responseBuilder = require('../ui/messages');
const { nanoid } = require('nanoid');

module.exports = function (logger) {
  const sheets = require('../api/google')(logger);
  const util = require('../api/slack/util')(logger);
  const formSupport = require('./form-support')(logger);

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
   * @param {string} ticketId Nanoid generated ticket Id to be used to reference Google Sheet
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

  /**
   * Handles support form submission.
   * @param {object} client Slack Client Object
   * @param {object} body Slack Message Body
   * @param {object} view Slack View
   */
  logic.handleSupportFormSubmission = async (client, body, view) => {
    // Ticket ID is used for reassignment button to reference
    // the slack message
    const ticketId = nanoid();

    const formData = await formSupport.extractSupportFormData(
      client,
      body,
      view
    );

    logger.debug(formData);

    const routeData = await formSupport.buildSupportRoute(client, formData);

    const messageData = await formSupport.postSupportTicketMessage(
      client,
      ticketId,
      formData,
      routeData
    );

    const messageLink = util.createMessageLink(
      messageData.channel,
      messageData.messageId
    );

    // Slack uses a numeric timestamp (double) for a message id. Saving the value
    // into Google Sheets is problematic as it tries to truncate values. Converting
    // the message id to a string value prevents Google Sheets from modifying the
    // message id.
    const messageIdString = util.stringifyMessageId(messageData.messageId);

    logger.debug(`Posted Message ID: ${messageData.messageId}`);
    logger.debug(`Posted Message ID Hashed: ${messageIdString}`);

    await sheets.captureResponses(
      ticketId,
      messageIdString,
      formData.submittedBy.username,
      formData.whoNeedsSupport.map((u) => u.username),
      formData.selectedTeam.id,
      formData.summaryDescription,
      messageLink
    );
  };

  return logic;
};

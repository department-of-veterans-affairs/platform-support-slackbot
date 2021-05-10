const modalBuilder = require('../ui/modals');
const responseBuilder = require('../ui/messages');
const { nanoid } = require('nanoid');

const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = function (logger) {
  const sheets = require('../api/google')(logger);
  const util = require('../api/slack/util')(logger);
  const slack = require('../api/slack')(logger);
  const formSupport = require('./form-support')(logger);
  const routing = require('./routing')(logger);

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

    const oncalluser = await routing.getOnCallUser(
      client,
      formData.selectedTeam.id
    );

    const messageData = await formSupport.postSupportTicketMessage(
      client,
      ticketId,
      formData,
      oncalluser
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
      formData.selectedTeam.title,
      formData.summaryDescription,
      messageLink
    );
  };

  /**
   * Handles Support Ticket Reassignment Form
   * @param {object} client Slack Client Object
   * @param {object} payload Slack Payload Object
   * @param {object} view Slack View Object
   */
  logic.handleReassignmentFormSubmission = async (client, payload, view) => {
    const ticketId = payload.private_metadata;

    logger.info(ticketId);

    const team = await formSupport.extractReassignFormData(view);

    logger.info(team);

    sheets.updateAssignedTeamForMessage(ticketId, team.title);

    const messageId = await sheets.getMessageByTicketId(ticketId);

    logger.info(messageId);

    const message = await slack.getMessageById(
      client,
      messageId,
      SUPPORT_CHANNEL_ID
    );

    const onCallUser = await routing.getOnCallUser(client, team.id);

    logger.info(message);

    const blocks = [
      ...message.blocks,
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Assigned to: <@${onCallUser}>`,
          verbatim: false,
        },
      },
    ];

    client.chat.update({
      channel: SUPPORT_CHANNEL_ID,
      ts: messageId,
      blocks,
    });
  };

  return logic;
};

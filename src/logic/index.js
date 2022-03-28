const modalBuilder = require('../ui/modals');
const responseBuilder = require('../ui/messages');
const { nanoid } = require('nanoid');
const fetch = require('node-fetch');
const SUPPORT_HOST = process.env.SLACK_SUPPORT_HOSTNAME;
const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = (logger) => {
  const sheets = require('../api/google')(logger),
        util = require('../api/slack/util')(logger),
        slack = require('../api/slack')(logger),
        formSupport = require('./form-support')(logger),
        routing = require('./routing')(logger);

  let logic = {};

  /**
   * Displays help (emphemeral) message to user. (Only visible to the user)
   * @param {object} client Slack Client Object
   * @param {string} channel Slack Channel Id
   * @param {string} user Slack User Id
   */
  logic.postHelpMessageToUserOnly = async (client, channel, user) => {
    logger.debug('postHelpMessageToUserOnly()');

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
    logger.debug('updateTimeStampOfSupportResponse()');

    if (!slackMessageId) return;

    const messageIdString = util.stringifyMessageId(slackMessageId);
    logger.debug(`messageIdString: ${messageIdString}`);

    await sheets.updateReplyTimeStampForMessage(messageIdString);
  };

  /**
   * Displays support modal to the user.
   * @param {object} client Slack Client Object
   * @param {string} user Current User Id
   * @param {string} trigger_id Trigger Id to generate modal
   */
  logic.displaySupportModal = async (client, user, trigger_id) => {
    logger.debug('displaySupportModal()');

    const teamOptions = await sheets.getTeams();
    const topicOptions = await sheets.getTopics();
    const view = modalBuilder.buildSupportModal(user, teamOptions, topicOptions);

    const result = await client.views.open({
      trigger_id,
      view,
    });
  };

  /**
   * Displays reassignment modal to the user.
   * @param {object} client Slack Client Object
   * @param {string} ticketId Nanoid generated ticket Id to be used to reference Google Sheet
   * @param {string} trigger_id Trigger Id to generate modal
   */
  logic.displayReassignmentModal = async (client, ticketId, trigger_id) => {
    logger.debug('displayReassignmentModal()');

    const options = await sheets.getTeams();

    const view = modalBuilder.buildReassignmentModal(options, ticketId);

    const result = await client.views.open({
      trigger_id,
      view,
    });
  };

  /**
   * Handles support form submission.
   * @param {object} client Slack Client Object
   * @param {object} body Slack Message Body
   * @param {object} view Slack View
   */
  logic.handleSupportFormSubmission = async (client, body, view) => {
    logger.debug('handleSupportFormSubmission()');

    // Ticket ID is used for reassignment button to reference
    // the slack message
    const ticketId = nanoid();

    const formData = await formSupport.extractSupportFormData(
      client,
      body,
      view
    );

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
      SUPPORT_HOST,
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
      formData.selectedTopic.name,
      formData.summaryDescription,
      messageLink
    );

    await fetch('https://sreautoanswer01.vercel.app/api/getanswer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ticketId,
        messageIdString,
        messageLink,
        ...formData
      })
    })

  };

  /**
   * Handles Support Ticket Reassignment Form
   * @param {object} body Slack Body Object
   * @param {object} view Slack View Object
   * @param {object} client Slack Client Object
   * @param {object} payload Slack Payload Object
   */
  logic.handleReassignmentFormSubmission = async (
    body,
    view,
    client,
    payload
  ) => {
    let sendErrorMessageToUser = () => {
      logic.handleError(
        client,
        "Hey there!  Sorry, I'm having some difficulties reassigning your ticket.  Please contact support.",
        SUPPORT_CHANNEL_ID,
        body.user.id
      );
    }

    logger.debug('handleReassignmentFormSubmission()');

    const ticketId = payload.private_metadata,
          team = await formSupport.extractReassignFormData(view);

    let {messageId, messageRow} = await sheets.getMessageByTicketId(ticketId);

    if (!messageId) return sendErrorMessageToUser();

    await sheets.updateAssignedTeamForMessage(ticketId, team.title, messageRow);

    const message = await slack.getMessageById(
      client,
      messageId,
      SUPPORT_CHANNEL_ID
    );

    if (!message) return sendErrorMessageToUser();

    const onCallUser = await routing.getOnCallUser(client, team.id);

    let blocks = message.blocks;

    blocks[2] = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Assigned to: ${onCallUser}* (${team.display})`,
        verbatim: false,
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Reassign Ticket',
        },
        action_id: 'reassign_ticket',
        value: ticketId,
      },
    };

    await slack.updateMessageById(client, messageId, SUPPORT_CHANNEL_ID, blocks);
  };

  logic.handleError = async (client, friendlyErrorMessage, channel, user) => {
    await client.chat.postEphemeral({
      channel: channel,
      user: user,
      text: friendlyErrorMessage,
    });
  };

  return logic;
};

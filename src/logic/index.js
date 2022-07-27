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
    //logger.debug('postHelpMessageToUserOnly()');

    await client.chat.postEphemeral({
      channel: channel,
      user: user,
      blocks: responseBuilder.buildHelpResponse(user),
    });
  };


/**
   * Displays help (emphemeral) message to user. (Only visible to the user)
   * @param {object} client Slack Client Object
   * @param {string} teams Teams array from google sheet
   */
  logic.getTeamsAssignmentText = async(client, teams) => {
    const textArray = await Promise.all(
      teams.map( async (team) => {
        let user = await routing.getOnCallUser(client, team.value)
        return `${team.text}: ${user} \n`;
      })
    )
    return textArray.join('');
  }

  /**
   * Updates the timestamp of first reaction from user to a support ticket
   * @param {string} slackMessageId Slack Message Id
   */
  logic.updateTimeStampOfSupportResponse = async (slackMessageId) => {
    //logger.debug('updateTimeStampOfSupportResponse()');

    if (!slackMessageId) return;

    const messageIdString = util.stringifyMessageId(slackMessageId);
    //logger.debug(`messageIdString: ${messageIdString}`);

    await sheets.updateReplyTimeStampForMessage(messageIdString);
  };

  /**
   * Displays support modal to the user.
   * @param {object} client Slack Client Object
   * @param {string} user Current User Id
   * @param {string} trigger_id Trigger Id to generate modal
   */
  logic.displaySupportModal = async (client, user, trigger_id) => {
    //logger.debug('displaySupportModal()');

    const teamOptions = await sheets.getTeams();
    const topicOptions = await sheets.getTopics();
    const view = modalBuilder.buildSupportModal(user, teamOptions, topicOptions);

    const result = await client.views.open({
      trigger_id,
      view,
    });
  };

  /**
   * Displays on-support modal to the user.
   * @param {object} client Slack Client Object
   * @param {string} user Current User Id
   * @param {string} trigger_id Trigger Id to generate modal
   */
  logic.displayOnSupportModal = async (client, user, trigger_id) => {
    //logger.debug('displayOnSupportModal()');

    const teamOptions = await sheets.getTeams();
    const teamsText = await logic.getTeamsAssignmentText(client, teamOptions);

    const view = modalBuilder.buildOnSupportModal(user, teamOptions, teamsText);

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
  logic.displayReassignmentModal = async (client, ticketId, trigger_id, message) => {
    //logger.debug('displayReassignmentModal()');

    const options = await sheets.getTeams();
    const view = modalBuilder.buildReassignmentModal(options, ticketId, message);

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
    //logger.debug('handleSupportFormSubmission()');

    // Ticket ID is used for reassignment button to reference
    // the slack message
    const ticketId = nanoid(),
          {
            team,
          } = view.state.values,
          selectedTeamId = team.selected.selected_option.value,
          teamData = await sheets.getTeamById(selectedTeamId),
          formData = await formSupport.extractSupportFormData(
            client,
            body,
            view,
            teamData
          ),

          oncalluser = await routing.getOnCallUser(
            client,
            formData.selectedTeam.id,
            teamData
          ),

          messageData = await formSupport.postSupportTicketMessage(
            client,
            ticketId,
            formData,
            oncalluser
          ),

          messageLink = util.createMessageLink(
            SUPPORT_HOST,
            messageData.channel,
            messageData.messageId
          ),

    // Slack uses a numeric timestamp (double) for a message id. Saving the value
    // into Google Sheets is problematic as it tries to truncate values. Converting
    // the message id to a string value prevents Google Sheets from modifying the
    // message id.
          messageIdString = util.stringifyMessageId(messageData.messageId);

    //logger.debug(`Posted Message ID: ${messageData.messageId}`);
    //logger.debug(`Posted Message ID Hashed: ${messageIdString}`);
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
    sheets.getResponsesSheet(true)
    /*await fetch('https://sreautoanswer01.vercel.app/api/getanswer', {
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
    })*/
    return;

  };


  /**
     * Handles on-call form submission.
     * @param {object} client Slack Client Object
     * @param {object} body Slack Message Body
     * @param {object} view Slack View
     */
  logic.handleOnSupportFormSubmission = async (client, body, view) => {
    //logger.debug('handleOnSupportFormSubmission()');

    // Ticket ID is used for reassignment button to reference
    // the slack message
    const formData = await formSupport.extractOnSupportFormData(
      client,
      body,
      view
    );

    sheets.captureOnSupport(
      formData.selectedTeam.id,
      formData.user.selected.selected_users.join(',')
    );

    await formSupport.postOnSupportMessage(
      formData,
      client
    );
  };

  /**
   * Handles Support Ticket Reassignment Form
   * @param {object} client Slack Client Object
   * @param {object} view Slack View Object
   * @param {object} body Slack Body Object
   */
  logic.handleReassignmentFormSubmission = async (
    client,
    view,
    body
  ) => {
    let sendErrorMessageToUser = () => {
      logic.handleError(
        client,
        "Hey there!  Sorry, I'm having some difficulties reassigning your ticket.  Please contact support.",
        SUPPORT_CHANNEL_ID,
        body.user.id
      );
    }
    //logger.debug('handleReassignmentFormSubmission()');
    const { message, ticketId} = JSON.parse(body.view.private_metadata),
          team = await formSupport.extractReassignFormData(view);
    
    let sheetMessage;

    if (!message) return sendErrorMessageToUser();

    const onSupportUsers = await routing.getOnCallUser(client, team.id);

    let blocks = message.blocks;

    blocks[2] = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Assigned to: ${onSupportUsers}* (${team.display})`,
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

    await slack.updateMessageById(client, message.ts, SUPPORT_CHANNEL_ID, blocks);

    sheets.updateAssignedTeamForMessage(ticketId, team.title);
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

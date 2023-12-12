const modalBuilder = require('../ui/modals');
const responseBuilder = require('../ui/messages');
const { nanoid } = require('nanoid');
const fetch = require('node-fetch');
const github = require('../api/github');
const SUPPORT_HOST = process.env.SLACK_SUPPORT_HOSTNAME;
const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = (logger) => {
  const sheets = require('../api/google')(logger),
        util = require('../api/slack/util')(logger),
        slack = require('../api/slack')(logger),
        formSupport = require('./form-support')(logger),
        routing = require('./routing')(logger),
        github = require('../api/github')(logger);

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
  logic.updateTimeStampOfSupportResponse = async (slackMessageId, isReaction) => {
    logger.debug('updateTimeStampOfSupportResponse()');

    if (!slackMessageId) return;

    const messageIdString = util.stringifyMessageId(slackMessageId);
    //logger.debug(`messageIdString: ${messageIdString}`);

    sheets.updateReplyTimeStampForMessage(messageIdString, isReaction);
  };

  /**
   * Displays support modal to the user.
   * @param {object} client Slack Client Object
   * @param {string} user Current User Id
   * @param {string} trigger_id Trigger Id to generate modal
   */
  logic.displaySupportModal = async (client, user, trigger_id) => {
    //logger.debug('displaySupportModal()');
    const topicOptions = await sheets.getTopics();
    const view = modalBuilder.buildSupportModal(user, topicOptions);

    const result = await client.views.open({
      trigger_id,
      view,
    });
  };

  /**
   * Ammends the topic field to the support modal. Triggered after a user selects a team
   * @param {object} body Slack event object
   * @param {object} client Slack Client Object
   * @returns {object} result of request to update slack view
   */

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
   * Displays reassignment modal to the user.
   * @param {object} client Slack Client Object
   * @param {string} ticketId Nanoid generated ticket Id to be used to reference Google Sheet
   * @param {string} trigger_id Trigger Id to generate modal
   */
    logic.closeTicket = async (client, ticketId, message) => {
      const rows = await sheets.getResponseSheetRows();
      const row = rows.find((row) => row.TicketId === ticketId);
      await client.chat.update({channel: SUPPORT_CHANNEL_ID, ts: message.ts, text: message.text, blocks: message.blocks.slice(0, -1)})
      await client.reactions.add({channel: SUPPORT_CHANNEL_ID, timestamp: message.ts, name: 'support-complete'})
      formSupport.postSurveyMessage(client, message.thread_ts || message.ts)
      if (row && row.GithubIssueId) {
        github.closeIssue(row.GithubIssueId)
      }
    }

/**
   * Handles support form submission.
   * @param {object} client Slack Client Object
   * @param {id} messageId Slack Message Id
   * @param {object} formData form submission data
   */
  logic.generateAutoAnswer = async(client, messageId, formData) => {
    const autoAnswers = await sheets.getAutoAnswers(formData.selectedTopic.id, formData.selectedTeam.id, formData.summaryDescription);

    if (autoAnswers.length > 0) {
      formSupport.postAutoAnswerMessage(client, messageId, autoAnswers);
      for (const answer of autoAnswers) {
        formSupport.postAdditionalContextMessage(client, messageId, answer);
      }
    } else {
      return;
    }
  }

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
    const topicOptions = await sheets.getTopics();
    const ticketId = nanoid(),
          selectedTeamId = topicOptions.filter(topic => topic.text === view.state.values.topic.selected.selected_option.text.text)[0].team.split(',')[0],
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

          githubIssue = teamData.GitHubIntegrationEnabled === 'TRUE' ? 
                        await github.createIssue(
                          formData.summaryDescription.substring(0,60) + '...', 
                          `Submitted By: ${formData.submittedBy.username}\n Topic: ${formData.selectedTopic.name}\nTeam: ${formData.selectedTeam.name}\n\n\n${formData.summaryDescription}`,
                          teamData.GitHubLabel
                        ) :
                        null;

          messageData = await formSupport.postSupportTicketMessage(
            client,
            ticketId,
            formData,
            oncalluser,
            githubIssue
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
    
    if (githubIssue) {
      await github.commentOnIssue(githubIssue.data.number, `Slack Thread Link: ${messageLink}`);
    }
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
      messageLink,
      githubIssue ? githubIssue.data.number : null
    );

    await logic.generateAutoAnswer(client, messageData.messageId, formData);

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

  logic.recordAnswerAnalytic = async(client, value, trigger_id) => {
    await sheets.captureAnswerAnalytic(JSON.parse(value));
  }

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

    await sheets.captureOnSupport(
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

    blocks[3] = {
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
    await client.chat.postMessage({
      channel: process.env.SLACK_SUPPORT_CHANNEL,
      thread_ts: message.ts,
      text: `<@${body.user.id}> reassigned ticket to: ${onSupportUsers} (${team.display})`
    })

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

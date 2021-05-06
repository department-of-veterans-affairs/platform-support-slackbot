const responseBuilder = require('./api/slack/block-kit/response-builder');

const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = function (app, logger) {
  const util = require('./api/slack/util')(logger);
  const sheets = require('./api/google/sheets')(logger);
  const schedule = require('./api/pagerduty/schedule')(logger);

  /* EVENT LISTENERS */

  /**
   * EVENT: app_mention
   * Responds with a help message anytime someone mentions
   * the support bot.
   */
  app.event('app_mention', async ({ client, payload }) => {
    try {
      logger.info('EVENT: app_mention');

      await client.chat.postEphemeral({
        channel: payload.channel,
        user: payload.user,
        blocks: responseBuilder.buildHelpResponse(payload.user),
      });
    } catch (error) {
      logger.error(error);
    }
  });

  /**
   * EVENT: reaction_added
   * Captures the current time the first emoji reaction to a
   * support ticket.
   */
  app.event('reaction_added', async ({ payload }) => {
    try {
      logger.info('EVENT: reaction_added');

      if (payload.item.ts) {
        logger.debug(payload);
        const hashedMessageId = util.hashMessageId(payload.item.ts);
        logger.debug(hashedMessageId);
        sheets.updateReplyTimeStampForMessage(hashedMessageId);
      }
    } catch (error) {
      logger.error(error);
    }
  });

  /**
   * EVENT: member_joined_channel
   * Sends a help message when a user joins the channel.
   */
  app.event('member_joined_channel', async ({ event, client }) => {
    try {
      logger.info('EVENT: member_joined_channel');

      client.chat.postEphemeral({
        channel: event.channel,
        user: event.user,
        blocks: responseBuilder.buildHelpResponse(event.user),
      });
    } catch (error) {
      logger.error(error);
    }
  });

  /* MESSAGE LISTENERS */

  /**
   * MESSAGE: Hello
   * Just responds to the message "hello"
   */
  app.message('hello', async ({ message, say }) => {
    try {
      logger.info('MESSAGE: hello');
      logger.debug(message.user);

      await say(`Hey there <@${message.user}>!`);
    } catch (error) {
      logger.error(error);
    }
  });

  /**
   * MESSAGE: any
   * Listens to any messages on the channel to determine if
   * the message is a reply to a support ticket.  If the reply
   * is the first reply, capture the current time of the reply.
   */
  app.message('', async ({ message }) => {
    try {
      logger.info('MESSAGE: *');

      // If message is a reply
      if (message.thread_ts) {
        const hashedMessageId = util.hashMessageId(message.thread_ts);

        logger.debug(message.thread_ts);
        logger.debug(hashedMessageId);

        sheets.updateReplyTimeStampForMessage(hashedMessageId);
      }
    } catch (error) {
      logger.error(error);
    }
  });

  /* ACTION LISTENERS (BUTTON CLICK HANDLERS) */

  /**
   * Action: platform_support
   * This function gets called when the green button "Platform Support Request"
   * is clicked on.  It brings up the platform support request modal.
   */
  app.action('platform_support', async ({ ack, body, client }) => {
    try {
      logger.info('ACTION: platform_support');

      await ack();

      util.buildSupportModal(client, body.user.id, body.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  /**
   * Action: reassign_ticket
   * This function gets called when the "Reassign Ticket" button
   * is clicked on.  It brings up a reassign ticket modal.
   */
  app.action('reassign_ticket', async ({ ack, body, client }) => {
    try {
      logger.info('ACTION: reassign_ticket');

      await ack();

      util.buildReassignmentModal(client, body.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  /* COMMAND LISTENERS */

  /**
   * Command: /help
   * Respond with Ephemeral help message anytime someone
   * types in the /help command.
   */
  app.command('/help', async ({ ack, body, client }) => {
    try {
      logger.info('COMMAND: /help');

      await ack();

      await client.chat.postEphemeral({
        channel: body.channel_id,
        user: body.user_id,
        blocks: responseBuilder.buildHelpResponse(body.user_id),
      });
    } catch (error) {
      logger.error(error);
    }
  });

  /**
   * Command: /support
   * Brings up the platform support request modal when someone
   * types the /support command.
   */
  app.command('/support', async ({ ack, body, client }) => {
    try {
      logger.info('COMMAND: /support');

      await ack();

      util.buildSupportModal(client, body.user_id, body.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  /* COMMAND LISTENERS */

  /**
   * Shortcut: support
   * Brings up the platform support request modal when someone
   * clicks on the Platform Support bot's shortcut in the app.
   * (Note: Not the channel specific shortcut, the global one.)
   */
  app.shortcut('support', async ({ shortcut, ack, client }) => {
    try {
      logger.info('SHORTCUT: support');

      await ack();

      util.buildSupportModal(client, shortcut.user.id, shortcut.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  /* VIEW LISTENERS */

  async function extractFormData(client, body, view) {
    const { id, username } = body.user;
    const {
      users_requesting_support: users,
      topic,
      summary,
    } = view.state.values;

    const selectedTeamId = topic.selected.selected_option.value;
    const whoNeedsSupportUserIds = users.users.selected_users;
    const summaryDescription = summary.value.value;

    const whoNeedsSupport = (
      await util.getSlackUsers(client, whoNeedsSupportUserIds)
    ).map((user) => {
      return { id: user.user.id, username: user.user.name };
    });

    const teamData = await sheets.getTeamById(selectedTeamId);

    const selectedTeam = teamData
      ? {
          id: teamData.Title,
          name: teamData.Display,
          pagerDutySchedule: teamData.PagerDutySchedule,
          slackGroup: teamData.SlackGroup,
        }
      : {};

    return {
      submittedBy: {
        id,
        username,
      },
      whoNeedsSupport,
      selectedTeam,
      summaryDescription,
    };
  }

  async function postSupportTicket(client, formData) {
    const postedMessage = await client.chat.postMessage({
      channel: SUPPORT_CHANNEL_ID,
      link_names: 1,
      blocks: responseBuilder.buildSupportResponse(
        formData.submittedBy.id,
        formData.selectedTeam.name,
        formData.summaryDescription
      ),
      text: `Hey there <@${formData.submittedBy.id}>, you have a new Platform Support ticket!`,
      unfurl_links: false, // Remove Link Previews
    });

    logger.trace(postedMessage);

    if (!postedMessage.ok) {
      logger.error(`Unable to post message. ${JSON.stringify(postedMessage)}`);
      return {
        messageId: null,
        channel: null,
        error: 'Error Posting Message',
      };
    }

    return {
      messageId: postedMessage.ts,
      channel: postedMessage.channel,
    };
  }

  /**
   * View: support_modal_view
   * Handles the form submission when someone submits the Platform Support
   * form.
   */
  app.view('support_modal_view', async ({ ack, body, view, client }) => {
    try {
      logger.info('VIEW: support_modal_view (FORM SUBMISSION)');

      await ack();

      const formData = await extractFormData(client, body, view);

      logger.debug(formData);

      if (formData.selectedTeam.pagerDutySchedule) {
        const email = await schedule.getOnCallPersonEmailForSchedule(
          formData.selectedTeam.pagerDutySchedule
        );
        const user = await util.getSlackUserByEmail(client, email);
        logger.info('Slack User');
        logger.info(user);
      }

      const messageData = await postSupportTicket(client, formData);

      const messageLink = util.createMessageLink(
        messageData.channel,
        messageData.messageId
      );

      const hashedMessageId = util.hashMessageId(messageData.messageId);

      logger.debug(`Posted Message ID: ${messageData.messageId}`);
      logger.debug(`Posted Message ID Hashed: ${hashedMessageId}`);

      sheets.captureResponses(
        hashedMessageId,
        formData.submittedBy.username,
        formData.whoNeedsSupport.map((u) => u.username),
        formData.selectedTeam.id,
        formData.summaryDescription,
        messageLink
      );
    } catch (error) {
      logger.error(error);
    }
  });

  /**
   * View: reassign_modal_view
   * Handles the form submission when someone submits the reassigns
   * a ticket
   */
  app.view('reassign_modal_view', async (obj) => {
    try {
      logger.info('VIEW: reassign_modal_view (FORM SUBMISSION)');
      logger.info(obj);

      const { ack } = obj;

      await ack();
    } catch (error) {
      logger.error(error);
    }
  });
};

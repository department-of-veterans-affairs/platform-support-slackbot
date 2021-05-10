const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = function (app, logger) {
  const slack = require('./api/slack')(logger);
  const logic = require('./logic')(logger);
  const util = require('./api/slack/util')(logger);
  const sheets = require('./api/google')(logger);
  const formSupport = require('./logic/form-support')(logger);
  const routing = require('./logic/routing')(logger);

  /* EVENT LISTENERS */

  /**
   * EVENT: app_mention
   * Responds with a help message anytime someone mentions
   * the support bot.
   */
  app.event('app_mention', async ({ client, payload }) => {
    try {
      logger.info('EVENT: app_mention');

      await logic.postHelpMessageToUserOnly(
        client,
        payload.channel,
        payload.user
      );
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

      // payload.item.ts is the associated message id of the emoji reaction
      logic.updateTimeStampOfSupportResponse(payload.item.ts);
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

      await logic.postHelpMessageToUserOnly(client, event.channel, event.user);
    } catch (error) {
      logger.error(error);
    }
  });

  /* MESSAGE LISTENERS */

  /**
   * MESSAGE: Hello
   * Just responds to the message "hello"
   */
  app.message('hello', async ({ message, say, client }) => {
    try {
      logger.info('MESSAGE: hello');
      logger.debug(message.user);

      // const data = util.parseChannelTopic(await slack.getChannelTopic(client));

      const data = await routing.getOnCallUser(client, 1);

      logger.info(data);

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

      // message.thread_ts only exists for replies
      logic.updateTimeStampOfSupportResponse(message.thread_ts);
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

      await logic.displaySupportModal(client, body.user.id, body.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  /**
   * Action: reassign_ticket
   * This function gets called when the "Reassign Ticket" button
   * is clicked on.  It brings up a reassign ticket modal.
   */
  app.action('reassign_ticket', async ({ ack, body, client, payload }) => {
    try {
      logger.info('ACTION: reassign_ticket');

      await ack();

      await logic.displayReassignmentModal(
        client,
        payload.value,
        body.trigger_id
      );
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

      await logic.postHelpMessageToUserOnly(
        client,
        body.channel_id,
        body.user_id
      );
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

      await logic.displaySupportModal(client, body.user_id, body.trigger_id);
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

      await logic.displaySupportModal(
        client,
        shortcut.user.id,
        shortcut.trigger_id
      );
    } catch (error) {
      logger.error(error);
    }
  });

  /* VIEW LISTENERS */

  /**
   * View: support_modal_view
   * Handles the form submission when someone submits the Platform Support
   * form.
   */
  app.view('support_modal_view', async ({ ack, body, view, client }) => {
    try {
      logger.info('VIEW: support_modal_view (FORM SUBMISSION)');

      await ack();

      logic.handleSupportFormSubmission(client, body, view);
    } catch (error) {
      logger.error(error);
    }
  });

  async function extractReassignFormData(view) {
    const { topic } = view.state.values;

    const selectedValue = topic.selected.selected_option.value;

    const team = await sheets.getTeamById(selectedValue);

    return {
      title: team.Title,
      display: team.Display,
    };
  }

  async function getMessageById(client, messageId) {
    const messages = await client.conversations.history({
      channel: SUPPORT_CHANNEL_ID,
      latest: parseFloat(messageId) + 1,
      oldest: parseFloat(messageId) - 1,
    });

    return messages.messages.find((msg) => msg.ts === messageId);
  }

  /**
   * View: reassign_modal_view
   * Handles the form submission when someone submits the reassigns
   * a ticket
   */
  app.view('reassign_modal_view', async (obj) => {
    try {
      logger.info('VIEW: reassign_modal_view (FORM SUBMISSION)');

      const { ack, payload, client, view } = obj;

      await ack();

      const ticketId = payload.private_metadata;

      logger.info(ticketId);

      const team = await extractReassignFormData(view);

      logger.info(team);

      sheets.updateAssignedTeamForMessage(ticketId, team.title);

      const messageId = await sheets.getMessageByTicketId(ticketId);

      logger.info(messageId);

      const message = await getMessageById(client, messageId);

      logger.info(message);

      const blocks = [
        ...message.blocks,
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Assigned to: Alex Yip',
            verbatim: false,
          },
        },
      ];

      client.chat.update({
        channel: SUPPORT_CHANNEL_ID,
        ts: messageId,
        blocks,
      });
    } catch (error) {
      logger.error(error);
    }
  });
};

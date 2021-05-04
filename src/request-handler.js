const responseBuilder = require('./api/slack/block-kit/response-builder');

const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = function (app, logger) {
  const util = require('./util')(logger);
  const sheets = require('./api/google/sheets')(logger);

  app.event('reaction_added', async ({ payload }) => {
    try {
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

  app.message('hello', async ({ message, say }) => {
    try {
      logger.debug(message.user_id);
      logger.debug(message.user);
      await say(`Hey there <@${message.user}>!`);
    } catch (error) {
      logger.error(error);
    }
  });

  // Listens to any message
  app.message('', async ({ message }) => {
    try {
      if (message.thread_ts) {
        logger.debug(message);
        const hashedMessageId = util.hashMessageId(message.thread_ts);
        logger.debug(hashedMessageId);
        sheets.updateReplyTimeStampForMessage(hashedMessageId);
      }
    } catch (error) {
      logger.error(error);
    }
  });

  app.command('/help', async ({ ack, body, client }) => {
    // Message the user
    try {
      await ack();

      let msg = `Hey there <@${body.user_id}>!  To submit a new support request, use the /support command.  Simply type /support in the chat.`;

      await client.chat.postMessage({
        channel: body.channel_id,
        text: msg,
      });
    } catch (error) {
      logger.error(error);
    }
  });

  app.command('/support', async ({ ack, body, client }) => {
    try {
      // Acknowledge the command request
      await ack();

      logger.info('/support command invoked.');

      // Call views.open with the built-in client
      util.buildSupportModal(client, body.user_id, body.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  // The open_modal shortcut opens a plain old modal
  app.shortcut('support', async ({ shortcut, ack, client }) => {
    try {
      // Acknowledge shortcut request
      await ack();

      logger.info('support shortcut invoked.');

      // Call views.open with the built-in client
      util.buildSupportModal(client, shortcut.user.id, shortcut.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  // Handle Form Submission
  app.view('support_modal_view', async ({ ack, body, view, client }) => {
    // Message the user
    try {
      await ack();

      const { id, username: whoSubmitted } = body.user;
      const {
        users_requesting_support: users,
        topic,
        summary,
      } = view.state.values;

      const whoNeedsSupport = users.users.selected_users;
      const selectedTeam = topic.selected.selected_option.value;
      const summaryDescription = summary.value.value;

      logger.trace('whoNeedsSupport', whoNeedsSupport);
      logger.trace('selectedTeam', selectedTeam);
      logger.trace('summaryDescription', summaryDescription);

      const dateTime = new Date(Date.now());

      const postedMessage = await client.chat.postMessage({
        channel: SUPPORT_CHANNEL_ID,
        link_names: 1,
        blocks: responseBuilder.buildSupportResponse(
          id,
          selectedTeam,
          summaryDescription
        ),
        text: `Hey there <@${id}>!`,
        unfurl_links: false, // Remove Link Previews
      });

      if (!postedMessage.ok) {
        logger.error(
          `Unable to post message. ${JSON.stringify(postedMessage)}`
        );
        return;
      }

      const messageId = postedMessage.ts;

      const messageLink = util.createMessageLink(
        postedMessage.channel,
        messageId
      );

      const hashedMessageId = util.hashMessageId(messageId);

      logger.trace(postedMessage);
      logger.debug(`Posted Message ID: ${messageId}`);
      logger.debug(`Posted Message ID Hashed: ${hashedMessageId}`);

      const slackUsers = await Promise.all(
        whoNeedsSupport.map(async (id) => await util.getSlackUser(client, id))
      );

      const usernames = slackUsers.map((user) => user.user.name);

      sheets.captureResponses(
        hashedMessageId,
        whoSubmitted,
        dateTime,
        usernames,
        selectedTeam,
        summaryDescription,
        messageLink
      );
    } catch (error) {
      logger.error(error);
    }
  });
};

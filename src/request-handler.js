const logger = require("pino")();
const modalBuilder = require("./block-kit/modal-builder");
const responseBuilder = require("./block-kit/response-builder");
const sheets = require('./google-sheets/sheets');

const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

function requestHandler(app) {
  async function buildSupportModal(client, user, trigger_id) {
    const topics = await sheets.getTopics();

    const view = modalBuilder.buildSupportModal(user, topics);

    const result = await client.views.open({
      trigger_id,
      view,
    });

    logger.debug(result);
  }

  // Listens to incoming messages that contain "hello"
  app.message("hello", async ({ message, say }) => {
    logger.debug(message.user);
    await say(`Hey there <@${message.user}>!`);
  });

  app.command("/help", async ({ ack, body, client, command }) => {
    await ack();

    let msg = `Hey there <@${body.user_id}>!  To submit a new support request, use the /support command.  Simply type /support in the chat.`;

    // Message the user
    try {
      await client.chat.postMessage({
        channel: body.channel_id,
        text: msg,
      });
    } catch (error) {
      logger.error(error);
    }
  });

  app.command("/support", async ({ ack, body, client }) => {
    // Acknowledge the command request
    await ack();

    try {
      // Call views.open with the built-in client
      buildSupportModal(client, body.user_id, body.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  // The open_modal shortcut opens a plain old modal
  app.shortcut("support", async ({ shortcut, ack, client }) => {
    try {
      // Acknowledge shortcut request
      await ack();

      // Call views.open with the built-in client
      buildSupportModal(client, shortcut.user.id, shortcut.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  // Handle Form Submission
  app.view("support_modal_view", async ({ ack, body, view, client }) => {
    await ack();

    const { id, username } = body.user;
    const { users_requesting_support, topic, summary } = view.state.values;

    const usersRequestingSupport =
      users_requesting_support.users.selected_users;
    const selectedTopic = topic.selected.selected_option.value;
    const summaryDescription = summary.value.value;

    logger.trace("usersRequestingSupport", usersRequestingSupport);
    logger.trace("selectedTopic", selectedTopic);
    logger.trace("summaryDescription", summaryDescription);

    // Message the user
    try {
      await client.chat.postMessage({
        channel: SUPPORT_CHANNEL_ID,
        link_names: 1,
        blocks: responseBuilder.buildSupportResponse(id, usersRequestingSupport, selectedTopic, summaryDescription),
        text: `Hey there <@${id}>!`,
      });
    } catch (error) {
      logger.error(error);
    }
  });
}

module.exports = requestHandler;

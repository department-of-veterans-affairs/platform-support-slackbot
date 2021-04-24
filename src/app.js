require('dotenv').config()
const { App } = require("@slack/bolt");
const modalBuilder = require('./modal-builder');

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

async function buildSupportModal(client, user, trigger_id) {
  const view = modalBuilder.buildSupportModal(user);

  const result = await client.views.open({
    trigger_id,
    view,
  });

  //   console.log(result);
}

// Listens to incoming messages that contain "hello"
app.message("hello", async ({ message, say }) => {
  console.log(message.user);
  await say(`Hey there <@${message.user}>!`);
});

app.command("/help", async (args) => {
  //   console.log(args);

  const { ack, body, client, command } = args;

  await ack();

  let msg = `Hey there <@${body.user_id}>!  To submit a new support request, use the /support command.  Simply type /support in the chat.`;

  // Message the user
  try {
    await client.chat.postMessage({
      channel: body.channel_id,
      text: msg,
    });
  } catch (error) {
    console.error(error);
  }
});

app.command("/support", async (args) => {
  const { ack, body, client } = args;
  //console.log(args);
  // Acknowledge the command request
  await ack();

  try {
    // Call views.open with the built-in client
    buildSupportModal(client, body.user_id, body.trigger_id);
  } catch (error) {
    console.error(error);
  }
});

// Handle Form Submission
app.view("support_modal_view", async ({ ack, body, view, client }) => {
  // Acknowledge the view_submission event
  await ack();

  const { id, username } = body.user;
  const { users_requesting_support, topic, summary } = view.state.values;

  const usersRequestingSupport = users_requesting_support.users.selected_users;
  const selectedTopic = topic.selected.selected_option.value;
  const summaryDescription = summary.value.value;

  console.log("usersRequestingSupport", usersRequestingSupport);
  console.log("selectedTopic", selectedTopic);
  console.log("summaryDescription", summaryDescription);

  // Message the user
  try {
    await client.chat.postMessage({
      channel: id,
      link_names: 1,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Hey there <@${id}>! We've recieved your Platform support request.`,
          },
        //   accessory: {
        //     type: "button",
        //     text: {
        //       type: "plain_text",
        //       text: "Click Me",
        //     },
        //     action_id: "button_click",
        //   },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*New platform request from*\n${usersRequestingSupport.map(u => `<@${u}>`).join(', ')}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Need help with*\n${selectedTopic}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Summary*\n${summaryDescription}`,
          },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Tagging: <@U01T9CL8PEK>"
            }
        }
      ],
      text: `Hey there <@${id}>!`,
    });
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
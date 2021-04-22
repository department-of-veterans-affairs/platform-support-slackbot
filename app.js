const { App } = require("@slack/bolt");

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

async function buildSupportModal(client, user, trigger_id) {
  const view = {
    type: "modal",
    submit: {
      type: "plain_text",
      text: "Submit",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "Cancel",
      emoji: true,
    },
    title: {
      type: "plain_text",
      text: "How can we help?",
      emoji: true,
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "plain_text",
          text:
            ":wave: Hey there!\n\nPlease fill out the form below and we'll route your support request to the right team.",
          emoji: true,
        },
      },
      {
        type: "divider",
      },
      {
        type: "input",
        element: {
          type: "multi_users_select",
          placeholder: {
            type: "plain_text",
            text: "Select users",
            emoji: true,
          },
          action_id: "multi_users_select-action",
          initial_users: [user],
        },
        label: {
          type: "plain_text",
          text: "User Requesting Support",
          emoji: true,
        },
      },
      {
        type: "input",
        label: {
          type: "plain_text",
          text: "Summary of Request",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          multiline: true,
        },
      },
    ],
  };

  const result = await client.views.open({
    trigger_id,
    view,
  });

  console.log(result);
}

// Listens to incoming messages that contain "hello"
app.message("hello", async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log(message.user);
  await say(`Hey there <@${message.user}>!`);
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

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();

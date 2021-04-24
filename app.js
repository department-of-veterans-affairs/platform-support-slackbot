const { App } = require("@slack/bolt");

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

async function buildSupportModal(client, user, trigger_id) {
  const view = {
    type: "modal",
    callback_id: "support_modal_view",
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
        block_id: "users_requesting_support",
        element: {
          type: "multi_users_select",
          placeholder: {
            type: "plain_text",
            text: "Select users",
            emoji: true,
          },
          action_id: "users",
          initial_users: [user],
        },
        label: {
          type: "plain_text",
          text: "User requesting support",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "topic",
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Select an item",
            emoji: true,
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: "PR Review",
                emoji: true,
              },
              value: "PR_Review",
            },
            {
              text: {
                type: "plain_text",
                text: "SOCKS",
                emoji: true,
              },
              value: "SOCKS",
            },
            {
              text: {
                type: "plain_text",
                text: "Access to something",
                emoji: true,
              },
              value: "Access",
            },
            {
              text: {
                type: "plain_text",
                text: "Deployment",
                emoji: true,
              },
              value: "Deployment",
            },
            {
              text: {
                type: "plain_text",
                text: "Troubleshooting",
                emoji: true,
              },
              value: "Troubleshooting",
            },
            {
              text: {
                type: "plain_text",
                text: "Local environment",
                emoji: true,
              },
              value: "Local_Environment",
            },
            {
              text: {
                type: "plain_text",
                text: "Platform Architecture",
                emoji: true,
              },
              value: "Platform_Architecture",
            },
            {
              text: {
                type: "plain_text",
                text: "Deploy",
                emoji: true,
              },
              value: "Deploy",
            },
            {
              text: {
                type: "plain_text",
                text: "Forms system",
                emoji: true,
              },
              value: "Forms_System",
            },
            {
              text: {
                type: "plain_text",
                text: "Design system",
                emoji: true,
              },
              value: "Design_System",
            },
            {
              text: {
                type: "plain_text",
                text: "Analytics",
                emoji: true,
              },
              value: "Analytics",
            },
            {
              text: {
                type: "plain_text",
                text: "Accessibility",
                emoji: true,
              },
              value: "Accessibility",
            },
            {
              text: {
                type: "plain_text",
                text: "IA",
                emoji: true,
              },
              value: "IA",
            },
            {
              text: {
                type: "plain_text",
                text: "Design",
                emoji: true,
              },
              value: "Design",
            },
            {
              text: {
                type: "plain_text",
                text: "Security",
                emoji: true,
              },
              value: "Security",
            },
            {
              text: {
                type: "plain_text",
                text: "QA",
                emoji: true,
              },
              value: "QA",
            },
            {
              text: {
                type: "plain_text",
                text: "Something else",
                emoji: true,
              },
              value: "Something else",
            },
          ],
          action_id: "selected",
        },
        label: {
          type: "plain_text",
          text: "I need help with",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "summary",
        label: {
          type: "plain_text",
          text: "Summary of request",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          multiline: true,
          action_id: "value",
        },
      },
    ],
  };

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

  // Message to send user
  let msg = "";

  let results = true;

  if (results) {
    msg = "Your submission was successful";
  } else {
    msg = "There was an error with your submission";
  }

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

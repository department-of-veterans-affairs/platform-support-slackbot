const buildSupportModal = (user) => {
  return {
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
};

module.exports = {
  buildSupportModal,
};
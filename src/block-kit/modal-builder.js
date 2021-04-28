const buildDropDownOptions = (topics) => {
  return topics.map(topic => {
      return {
        text: {
          type: "plain_text",
          text: topic.text,
          emoji: true,
        },
        value: topic.value,
      };
  });
}

const buildSupportModal = (user, topics) => {
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
          options: buildDropDownOptions(topics),
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

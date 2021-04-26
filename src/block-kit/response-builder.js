const buildSupportResponse = (id, usersRequestingSupport, selectedTopic, summaryDescription) => {
  return [
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
        text: `*New platform request from*\n${usersRequestingSupport
          .map((u) => `<@${u}>`)
          .join(", ")}`,
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
        text: "Tagging: <@U01T9CL8PEK>",
      },
    },
  ];
};

module.exports = {
  buildSupportResponse,
};

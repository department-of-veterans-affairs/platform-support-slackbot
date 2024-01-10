const buildSupportResponse = (
  ticketId,
  userId,
  selectedTeam,
  selectedCategory,
  summaryDescription,
  mention,
  team,
  githubIssue
) => {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `From *<@${userId}>*: ${summaryDescription}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Request Type: ${selectedCategory}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: githubIssue
          ? `GitHub Support Issue: ${githubIssue.data.html_url}`
          : " ",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: mention
          ? `*Assigned to: ${mention}* (${selectedTeam})\n`
          : `*Assigned to: ${team}*\n`,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Reassign Ticket",
        },
        action_id: "reassign_ticket",
        value: ticketId,
      },
    },
    {
      type: "section",
      text: {
        type: 'mrkdwn',
        text: "Click here when this support request is complete"
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Close Ticket",
        },
        action_id: "close_ticket",
        value: ticketId,
      },
    }
  ]
  return blocks;
};

const buildAutoAnswerResponse = (ticketId, autoAnswers) => {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:page_facing_up:  We found some documentation that may help.`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: autoAnswers
          .map((answer) => `:point_right:  <${answer.link}|${answer.title}>`)
          .join("\n"),
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `A support representative will respond shortly.`,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Did this help?`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Yes",
          },
          action_id: "auto_answer_yes",
          value: JSON.stringify({
            value: "yes",
            ticketId,
          }),
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "No",
          },
          action_id: "auto_answer_no",
          value: JSON.stringify({
            value: "no",
            ticketId,
          }),
        },
      ],
    },
  ];
};

const buildAdditionalPostResponse = (ticketId, answer) => {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${answer.additionalContextPostText} \n ${answer.additionalContextPostLink && answer.additionalContextPostTitle ? '<' + answer.additionalContextPostLink + '|' + answer.additionalContextPostTitle + '>' : ''}`
      },
    },
  ];
};

const buildSurveyResponse = () => {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:thank_you: Thanks for contacting support! How would you rate your service? Please let us know <https://dj540s05.optimalworkshop.com/questions/4f1260bbdcd3a4579c269455ee1d9b4f|HERE> so we can improve in the future.`
      }
    }
  ]
}

const buildOnSupportResponse = async (userId, text) => {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<@${userId}>* updated a support assignment:`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: text,
      },
    },
  ];
};

const buildHelpResponse = (userId = null) => {
  const user = userId == null ? "" : ` <@${userId}>`;
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Hey there${user}! You can create a support request by clicking on the button below.`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Platform Support Request",
          },
          style: "primary",
          action_id: "platform_support",
        },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "You can create a support request by typing `/support` command in the message field\nor by\n clicking on the *shortcut menu ⚡* → *Need help from Platform?*",
      },
    },
  ];
};

module.exports = {
  buildSupportResponse,
  buildHelpResponse,
  buildOnSupportResponse,
  buildAutoAnswerResponse,
  buildAdditionalPostResponse,
  buildSurveyResponse
};

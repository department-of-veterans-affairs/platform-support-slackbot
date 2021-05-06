const buildSupportResponse = (userId, selectedTeam, summaryDescription) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Hey there <@${userId}>! We've recieved your Platform support request.`,
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Reassign Ticket',
        },
        action_id: 'reassign_ticket',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Need help with*\n${selectedTeam}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Summary*\n${summaryDescription}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Assigned to: <@U01T9CL8PEK>',
      },
    },
  ];
};

const buildHelpResponse = (userId = null) => {
  const user = userId == null ? '' : ` <@${userId}>`;
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Hey there${user}! You can create a support request by clicking on the button below.`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            emoji: true,
            text: 'Platform Support Request',
          },
          style: 'primary',
          action_id: 'platform_support',
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          'You can create a support request by typing `/support` command in the message field\nor by\n clicking on the *shortcut menu ⚡* → *Platform Support* → *Need Platform Support*',
      },
    },
  ];
};

module.exports = {
  buildSupportResponse,
  buildHelpResponse,
};
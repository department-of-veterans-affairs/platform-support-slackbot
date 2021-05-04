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
        action_id: 'reassign_button_click',
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
        text: 'Tagging: <@U01T9CL8PEK>',
      },
    },
  ];
};

module.exports = {
  buildSupportResponse,
};

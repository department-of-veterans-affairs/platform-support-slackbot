const buildSupportResponse = (
  ticketId,
  userId,
  selectedTeam,
  selectedCategory,
  summaryDescription,
  mention,
  team
) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `From *<@${userId}>*: ${summaryDescription}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Request Type: ${selectedCategory}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: mention ? `*Assigned to: ${mention}* (${selectedTeam})\n` : `*Assigned to: ${team}*\n`,
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Reassign Ticket',
        },
        action_id: 'reassign_ticket',
        value: ticketId,
      },
    },
  ];
};

const buildOnCallResponse = (
  userId,
  teams
) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<@${userId}>* updated an on-call assignment:`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${teams.map((team) => `${team.text}: ${team.onCallUser ? `<@${team.onCallUser}>` : team.slackGroup} \n`).join('')}`,
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
  buildOnCallResponse
};

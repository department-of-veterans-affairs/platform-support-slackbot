/* ────────────────────────────────
   Slack-message block builders
   ──────────────────────────────── */

const PR_REGEX =
  /https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(?=\D|$)/;

/* 1 ─ Ticket-header blocks (no PR summary here) */
async function buildSupportResponse(
  ticketId,
  userId,
  selectedTeam,
  selectedCategory,
  summaryDescription,
  mention,
  team,
  githubIssue
) {
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
      text: { type: 'mrkdwn', text: `Request Type: ${selectedCategory}` },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: githubIssue
          ? `• <${githubIssue.data.html_url}|GitHub Support Issue>`
          : ' ',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: mention
          ? `*Assigned to: ${mention}* (${selectedTeam})\n`
          : `*Assigned to: ${team}*\n`,
      },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: 'Reassign Ticket' },
        action_id: 'reassign_ticket',
        value: ticketId,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Click here when this support request is complete',
      },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: 'Close Ticket' },
        action_id: 'close_ticket',
        value: ticketId,
      },
    },
  ];
}

/* 2 ─ Auto-answer reply */
function buildAutoAnswerResponse(ticketId, autoAnswers) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':page_facing_up:  We found some documentation that may help.',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: autoAnswers
          .map(a => `:point_right:  <${a.link}|${a.title}>`)
          .join('\n'),
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'A support representative will respond shortly.',
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: 'Did this help?' },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Yes' },
          action_id: 'auto_answer_yes',
          value: JSON.stringify({ value: 'yes', ticketId }),
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'No' },
          action_id: 'auto_answer_no',
          value: JSON.stringify({ value: 'no', ticketId }),
        },
      ],
    },
  ];
}

/* 3 ─ Extra-context reply */
function buildAdditionalPostResponse(ticketId, answer) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          answer.additionalContextPostText +
          (answer.additionalContextPostLink && answer.additionalContextPostTitle
            ? `\n<${answer.additionalContextPostLink}|${answer.additionalContextPostTitle}>`
            : ''),
      },
    },
  ];
}

/* 4 ─ Survey reply */
function buildSurveyResponse() {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':thank_you: Thanks for contacting support! Please let us know <https://dj540s05.optimalworkshop.com/questions/4f1260bbdcd3a4579c269455ee1d9b4f|how you would rate your service here> so we can improve in the future.',
      },
    },
  ];
}

/* 5 ─ On-support announcement */
async function buildOnSupportResponse(userId, text) {
  return [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*<@${userId}>* updated a support assignment:` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text },
    },
  ];
}

/* 6 ─ Help/msg builder */
function buildHelpResponse(userId = null) {
  const mention = userId ? ` <@${userId}>` : '';
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Hey there${mention}! You can create a support request by clicking the button below.`,
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
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          'You can also open a request by typing `/support` or via the *⚡ shortcut → "Need help from Platform?"*',
      },
    },
  ];
}

/* ───────────────────────────────
   exports
   ─────────────────────────────── */
module.exports = {
  buildSupportResponse,
  buildAutoAnswerResponse,
  buildAdditionalPostResponse,
  buildSurveyResponse,
  buildOnSupportResponse,
  buildHelpResponse,
};


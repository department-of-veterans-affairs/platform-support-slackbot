const buildDropDown = (options) => {
  return options.map((option) => {
    return {
      text: {
        type: 'plain_text',
        text: option.text,
        emoji: true,
      },
      value: option.value,
    };
  });
};

const loadTopicField = (topicOptions) => {
  return {
    type: 'input',
    block_id: 'topic',
    element: {
      type: 'static_select',
      placeholder: {
        type: 'plain_text',
        text: 'Select an item',
        emoji: true,
      },
      options: buildDropDown(topicOptions),
      action_id: 'selected',
    },
    label: {
      type: 'plain_text',
      text: 'Request topic',
      emoji: true,
    },
  }
}

const buildSupportModal = (user, topicOptions, topicBlock) => {
  let blocks = [
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: ":wave: Hey there!\n\nPlease fill out the form below and we'll route your support request to the right team.",
        emoji: true,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'input',
      block_id: 'topic',
      element: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Select an item',
          emoji: true,
        },
        options: buildDropDown(topicOptions),
        action_id: 'selected',
      },
      label: {
        type: 'plain_text',
        text: 'Request topic',
        emoji: true,
      },
    },
    // {
    //   type: 'input',
    //   block_id: 'team',
    //   dispatch_action: true,
    //   element: {
    //     type: 'static_select',
    //     placeholder: {
    //       type: 'plain_text',
    //       text: 'Select an item',
    //       emoji: true,
    //     },
    //     options: buildDropDown(teamOptions),
    //     action_id: 'team_selected'
    //   },
    //   label: {
    //     type: 'plain_text',
    //     text: 'Assign to',
    //     emoji: true,
    //   },
    // },
    {
      type: 'input',
      block_id: 'summary',
      label: {
        type: 'plain_text',
        text: 'Summary of request',
        emoji: true,
      },
      element: {
        type: 'plain_text_input',
        multiline: true,
        action_id: 'value',
      },
    },
  ]
  if (topicBlock) {
    blocks.splice(3, 0, topicBlock)
  }
  return {
    type: 'modal',
    callback_id: 'support_modal_view',
    submit: {
      type: 'plain_text',
      text: 'Submit',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
      emoji: true,
    },
    title: {
      type: 'plain_text',
      text: 'How can we help?',
      emoji: true,
    },
    blocks,
  };
};

const buildOnSupportModal = (user, teamOptions, teamsText) => {
  return {
    type: 'modal',
    callback_id: 'onsupport_modal_view',
    submit: {
      type: 'plain_text',
      text: 'Submit',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
      emoji: true,
    },
    title: {
      type: 'plain_text',
      text: 'Who is on support?',
      emoji: true,
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: teamsText,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Update a team assignment*`,
        },
      },
      {
        type: 'input',
        block_id: 'team',
        element: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select a team',
            emoji: true,
          },
          options: buildDropDown(teamOptions),
          action_id: 'selected',
        },
        label: {
          type: 'plain_text',
          text: 'Team',
          emoji: true,
        },
      },
      {
        type: 'input',
        block_id: 'user',
        optional: true,
        element: {
          type: 'multi_users_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select user(s)',
            emoji: true,
          },
          action_id: 'selected',
        },
        label: {
          type: 'plain_text',
          text: 'User(s)',
          emoji: true,
        },
      },
    ],
  };
};

const buildReassignmentModal = (options, ticketId, message) => {
  return {
    type: 'modal',
    callback_id: 'reassign_modal_view',
    submit: {
      type: 'plain_text',
      text: 'Submit',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
      emoji: true,
    },
    title: {
      type: 'plain_text',
      text: 'Reassign Ticket',
      emoji: true,
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: ':wave: Hey there!\n\nPlease route your support request to the correct team.',
          emoji: true,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'input',
        block_id: 'topic',
        element: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select an item',
            emoji: true,
          },
          options: buildDropDown(options),
          action_id: 'selected',
        },
        label: {
          type: 'plain_text',
          text: 'Assigned Team',
          emoji: true,
        },
      },
    ],
    private_metadata: JSON.stringify({
      ticketId,
      message
    })
  };
};

module.exports = {
  buildSupportModal,
  buildOnSupportModal,
  buildReassignmentModal,
  loadTopicField
};

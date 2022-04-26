const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = function (logger) {
  let slackApi = {};

  /**
   * Returns Slack User from Slack User Id
   * @param {object} client Slack Client Object
   * @param {string} userId Slack User Id
   * @returns Slack userName
   */
  slackApi.getSlackUser = async (client, userId) => {
    try {
      // Call the users.info method using client
      return await client.users.info({
        user: userId,
      });
    } catch (error) {
      logger.error(error);

      // If it fails to retreive the username, just return the user Id
      return userId;
    }
  };

  /**
   * Returns an Array of Slack Users from an Array of Slack User Ids
   * @param {object} client Slack Client Object
   * @param {string} userIds Array of Slack User Ids
   */
  slackApi.getSlackUsers = async (client, userIds) => {
    try {
      return await Promise.all(
        userIds.map(async (id) => await slackApi.getSlackUser(client, id))
      );
    } catch (error) {
      logger.error(error);

      // If it fails, just return an array of user objects with no
      // usernames.
      return userIds.map((id) => {
        return { id, name: '' };
      });
    }
  };

  /**
   * Returns Slack Username and Id from Email
   * @param {object} client Slack Client Object
   * @param {string} email Email Address
   * @returns object with userId and userName properties
   */
  slackApi.getSlackUserByEmail = async (client, email) => {
    try {
      const { user } = await client.users.lookupByEmail({
        email,
      });
      logger.debug('getSlackUserByEmail');
      return {
        userId: user.id,
        userName: user.name,
      };
    } catch (error) {
      logger.error(error);
      return null;
    }
  };

  /**
   * Returns a Slack Message Object by the Slack Message Id (Timestamp)
   * @param {object} client Slack Client Object
   * @param {string} messageId Slack Message Id (timestamp)
   * @returns Slack Message Object
   */
  slackApi.getMessageById = async (client, messageId, channelId) => {
    // Search Conversation History to find a message in the
    // specified channel with in a 2 second window of the specified
    // timestamp (messageId).  Note: no way of getting a message
    // by ID specifically and anything less than a 2 second window
    // seems to cause rounding errors with the comparison. ???
    const messages = await client.conversations.history({
      channel: channelId,
      latest: parseFloat(messageId) + 1,
      oldest: parseFloat(messageId) - 1,
    });

    // Find the message Id that matches with the one passed in.
    return messages.messages.find((msg) => msg.ts === messageId) || null;
  };

  /**
   * Update a Message by Slack Message Id (ts - timestamp)
   * @param {object} client Slack Client Object
   * @param {string} messageId Slack Message Id (timestamp)
   * @param {string} channelId Slack Channel Id
   * @param {Array} blocks Array of block kit elements
   */
  slackApi.updateMessageById = async (client, messageId, channelId, blocks) => {
    await client.chat.update({
      channel: channelId,
      ts: messageId,
      blocks,
      text: 'Reassigned'
    });
  };

  return slackApi;
};

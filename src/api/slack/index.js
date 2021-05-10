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
   * Returns the support channel topic
   * @param {object} client Slack Client Object
   * @returns Channel Topic
   */
  slackApi.getChannelTopic = async (client) => {
    logger.trace('getChannelTopic()');

    const info = await client.conversations.info({
      channel: SUPPORT_CHANNEL_ID,
    });

    logger.debug(info.channel.topic.value);

    return info.channel.topic.value;
  };

  return slackApi;
};

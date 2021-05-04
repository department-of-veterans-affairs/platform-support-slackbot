const modalBuilder = require('./api/slack/block-kit/modal-builder');
const { createHash } = require('crypto');

module.exports = function (logger) {
  const sheets = require('./api/google/sheets')(logger);

  let util = {};

  util.buildSupportModal = async (client, user, trigger_id) => {
    logger.debug('buildSupportModal()');

    const options = await sheets.getOptions();

    const view = modalBuilder.buildSupportModal(user, options);

    const result = await client.views.open({
      trigger_id,
      view,
    });

    logger.debug(`user: ${user}`);
    logger.trace(result);
  };

  /**
   * Returns Slack Username from Slack User Id
   * @param {object} client Slack Client Object
   * @param {string} userId Slack User Id
   * @returns
   */
  util.getSlackUser = async (client, userId) => {
    try {
      // Call the users.info method using client
      return await client.users.info({
        user: userId,
      });
    } catch (error) {
      // If it fails to retreive the username, just return the user Id
      logger.error(error);

      return userId;
    }
  };

  /**
   * Returns Slack Username and Id from Email
   * @param {object} client Slack Client Object
   * @param {*} email Email Address
   * @returns
   */
  util.getSlackUserByEmail = async (client, email) => {
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
    }
  };

  util.hashMessageId = (messageId) => {
    const hash = createHash('md5');
    return hash.update(messageId).digest('hex');
  };

  util.createMessageLink = (channel, messageId) => {
    const updatedId = messageId.replace('.', '');
    return `https://adhoc.slack.com/archives/${channel}/p${updatedId}`;
  };

  return util;
};

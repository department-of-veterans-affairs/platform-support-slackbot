const modalBuilder = require('./block-kit/modal-builder');
const { createHash } = require('crypto');

module.exports = function (logger) {
  const sheets = require('./google-sheets/sheets')(logger);

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

  util.getSlackUser = async (client, userId) => {
    try {
      // Call the users.info method using the WebClient
      return await client.users.info({
        user: userId,
      });
    } catch (error) {
      // If it fails to retreive the username, just return the user Id
      logger.error(error);

      return userId;
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

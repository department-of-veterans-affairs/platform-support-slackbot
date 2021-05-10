module.exports = function (logger) {
  const sheets = require('../google')(logger);

  let util = {};

  /**
   * Converts a Slack message id to store in Google Sheet.
   *
   * Note: Message Id is double and causes issues
   * when referencing the Id.  Convert it to a string
   * for better comparison.
   * @param {string} messageId Message Id
   * @returns string Message Id String
   */
  util.stringifyMessageId = (messageId) => {
    return `msgId:${messageId}`;
  };

  /**
   * Generates a Slack Message Link
   * @param {string} channelId
   * @param {string} messageId
   * @returns
   */
  util.createMessageLink = (channel, messageId) => {
    if (!channel || !messageId) return '';

    const updatedId = messageId.replace('.', '');
    return `https://adhoc.slack.com/archives/${channel}/p${updatedId}`;
  };

  /**
   * Parses Channel Topic
   * @param {string} topic
   * @returns Channel Oncall User Mapping
   */
  util.parseChannelTopic = (topic) => {
    logger.info(topic);

    const formatKey = (key) => key.toLowerCase().trim();

    const formatValue = (value) => {
      const trimmed = value.trim();
      const slackIdMatch = trimmed.match(/^(<@.+>)|(<!subteam\^.+\|@.+>)$/);
      return slackIdMatch ? slackIdMatch[0] : null;
    };

    const supportList = topic
      .split(/\r?\n/)
      .filter((line) => line.match(/^.+:\s*<[@!].+>$/))
      .map((line) => line.split(':'))
      .map((ar) => {
        return [formatKey(ar[0]), formatValue(ar[1])];
      });

    const onCall = Object.fromEntries(supportList);

    logger.info(onCall);

    return onCall;
  };

  return util;
};

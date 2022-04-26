module.exports = function (logger) {
  const slack = require('../api/slack')(logger);
  const schedule = require('../api/pagerduty')(logger);
  const sheets = require('../api/google')(logger);
  const util = require('../api/slack/util')(logger);

  let routing = {};

  /**
   * Get Slack User from Pager Duty Schedule
   * @param {object} selectedTeam Selected Team Object
   * @returns Slack User from Pager Duty Schedule
   */
  routing.getSlackUserForPagerDutySchedule = async (client, selectedTeam) => {
    const email = await schedule.getOnCallPersonEmailForSchedule(
      selectedTeam.PagerDutySchedule
    );
    if (!email) return null;
    logger.info(`Found PagerDuty user email: ${email}`);
    return await slack.getSlackUserByEmail(client, email);
  };

  /**
   * Determine oncall user based on:
   * 1. Channel Topic
   * 2. PagerDuty (if can't determine user from Channel Topic)
   * 3. Slack Group
   * 4. If all else fails, return null.
   * @param {object} client Slack Client
   * @param {string} selectedTeamId Selected Team Id
   * @returns On Call Slack User, null if unavailable.
   */
  routing.getOnCallUser = async (client, selectedTeamId) => {
    const selectedTeam = await sheets.getTeamById(selectedTeamId);
    let oncallUser =  selectedTeam.OnCallUser ? `<@${selectedTeam.OnCallUser}>` : null;

    // Check PagerDuty
    if (!oncallUser) {
      logger.info('User not found in Channel Topic.  Trying PagerDuty...');

      const user = await routing.getSlackUserForPagerDutySchedule(
        client,
        selectedTeam
      );

      oncallUser = user ? `<@${user.userId}>` : null;

      if (oncallUser) {
        logger.info(`Selected On-Call User: ${oncallUser} from PagerDuty`);
      } else {
        logger.info(`Unable to find slack user from Pager Duty...`);
      }
    }

    // Get Slack Group
    if (!oncallUser) {
      logger.info('User not found at PagerDuty.  Getting SlackGroup');
      oncallUser = selectedTeam.SlackGroup;
    }

    return oncallUser;
  };

  return routing;
};

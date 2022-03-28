const { api } = require('@pagerduty/pdjs');

module.exports = function (logger) {
  let schedule = {};

  /**
   * Get PagerDuty API Instance
   * @returns PagerDuty API Instance
   */
  schedule._getApiInstance = function () {
    return api({ token: process.env.PAGER_DUTY_API_KEY });
  };

  /**
   * Get PagerDuty schedule for scheduleId and date.
   * @param {object} pd PagerDuty API instance
   * @param {string} scheduleId Schedule Id
   * @param {date} date Schedule date
   * @returns PagerDuty schedule instance
   */
  schedule._getScheduleForDate = async function (pd, scheduleId, date) {
    logger.trace('getScheduleForDate()');

    const encodedDate = encodeURI(date.toISOString());

    return await pd.get(
      `/schedules/${scheduleId}?since=${encodedDate}&until=${encodedDate}&overflow=true`
    );
  };

  /**
   * Get PagerDuty user instance.
   * @param {object} pd PagerDuty API instance
   * @param {string} userId PagerDuty User Id
   * @returns PagerDuty user instance
   */
  schedule._getUserById = async function (pd, userId) {
    logger.trace('getUserById()');

    return await pd.get(`/users/${userId}`);
  };

  /**
   * Get designated on call person's email address.
   * @param {string} scheduleId schedule Id
   * @returns
   */
  schedule.getOnCallPersonEmailForSchedule = async function (scheduleId) {
    logger.trace('getOnCallPersonEmailForSchedule()');

    const api = this._getApiInstance(),
          currentDate = new Date(),
          currentScheduleResponse = await this._getScheduleForDate(
            api,
            scheduleId,
            currentDate
          ),
          currentSchedule = currentScheduleResponse?.data?.schedule,
          entries = currentSchedule?.final_schedule?.rendered_schedule_entries;

    if (!entries || entries.length == 0) return null;

    const oncallUser = entries[0].user,
          userResponse = await this._getUserById(api, oncallUser.id);

    return userResponse?.data?.user?.email;
  };

  return schedule;
};

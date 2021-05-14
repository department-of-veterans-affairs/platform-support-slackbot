const { expect } = require('chai');

describe('api/pagerduty', () => {
  let schedule;
  let instance = {};

  beforeEach(() => {
    schedule = require('../../../src/api/pagerduty')(logger);

    sinon.stub(schedule, '_getApiInstance').returns(instance);
  });

  afterEach(() => {
    schedule = null;
  });

  describe('getOnCallPersonEmailForSchedule()', () => {
    it('should return on-call user email address', async () => {
      sinon
        .stub(schedule, '_getScheduleForDate')
        .withArgs(sinon.match.any)
        .resolves({
          data: {
            schedule: {
              final_schedule: {
                rendered_schedule_entries: [
                  {
                    user: {
                      id: 'john.smith',
                    },
                  },
                ],
              },
            },
          },
        });

      sinon
        .stub(schedule, '_getUserById')
        .withArgs(sinon.match.any)
        .resolves({
          data: {
            user: {
              email: 'john.smith@adhocteam.us',
            },
          },
        });

      let result = await schedule.getOnCallPersonEmailForSchedule('PIDMJAN');

      expect(result).to.equal('john.smith@adhocteam.us');
    });
  });

  describe('', () => {});
});

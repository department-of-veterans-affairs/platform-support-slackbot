const { expect } = require('chai');

describe('api/slack', () => {
  let slack;

  beforeEach(() => {
    slack = require('../../../src/api/slack')(logger);
  });

  afterEach(() => {
    slack = null;
  });

  describe('getSlackUser()', () => {
    it('should call users.info() to get slack user', () => {
      let client = {
        users: {
          info: sinon.spy(),
        },
      };

      slack.getSlackUser(client, 'abc123');

      expect(client.users.info.calledOnce).to.be.true;
      expect(client.users.info.getCall(0).args[0]).to.be.eql({
        user: 'abc123',
      });
    });

    it('should return user id when user.info() throws an error', async () => {
      let client = {
        users: {
          info: function (obj) {},
        },
      };

      let error = new Error('Error');
      sinon.stub(client.users, 'info').throws(error);

      let user = await slack.getSlackUser(client, 'abc123');

      expect(user).to.equal('abc123');
    });
  });

  describe('getSlackUsers()', () => {
    it('should return a list of slack users', async () => {
      let client = {
        users: {
          info: async function (obj) {
            return {
              id: obj.user,
              name: obj.user,
            };
          },
        },
      };

      let users = await slack.getSlackUsers(client, ['abc123', 'def456']);

      expect(users).to.eql([
        { id: 'abc123', name: 'abc123' },
        { id: 'def456', name: 'def456' },
      ]);
    });

    it('should return a list of user ids if it gets an exception', async () => {
      let client = {
        users: {
          info: function (obj) {},
        },
      };

      let error = new Error('Error');
      sinon.stub(client.users, 'info').throws(error);

      let users = await slack.getSlackUsers(client, ['abc123', 'def456']);

      expect(users).to.eql(['abc123', 'def456']);
    });
  });

  describe('getSlackUserByEmail()', () => {
    it('should return a Slack User by Email', async () => {
      let client = {
        users: {
          lookupByEmail: async (obj) => {},
        },
      };

      sinon
        .stub(client.users, 'lookupByEmail')
        .withArgs(sinon.match.any)
        .resolves({
          user: {
            id: 'jsmith1234',
            name: 'john.smith',
          },
        });

      let result = await slack.getSlackUserByEmail(
        client,
        'john.smith@adhocteam.us'
      );

      expect(result).to.eql({
        userId: 'jsmith1234',
        userName: 'john.smith',
      });
    });
  });

  describe('', () => {});
});

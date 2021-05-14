const { expect } = require('chai');

describe('api/slack', () => {
  let slack;
  let client;

  beforeEach(() => {
    slack = require('../../../src/api/slack')(logger);
    client = {
      users: {
        info: async function (obj) {},
        lookupByEmail: async function (obj) {},
      },
      conversations: {
        info: async function (obj) {},
        history: async function (obj) {},
      },
    };
  });

  afterEach(() => {
    slack = null;
  });

  describe('getSlackUser()', () => {
    it('should call users.info() to get slack user', () => {
      client.users.info = sinon.spy();

      slack.getSlackUser(client, 'abc123');

      expect(client.users.info.calledOnce).to.be.true;
      expect(client.users.info.getCall(0).args[0]).to.be.eql({
        user: 'abc123',
      });
    });

    it('should return user id when user.info() throws an error', async () => {
      let error = new Error('Error');
      sinon.stub(client.users, 'info').throws(error);

      let user = await slack.getSlackUser(client, 'abc123');

      expect(user).to.equal('abc123');
    });
  });

  describe('getSlackUsers()', () => {
    it('should return a list of slack users', async () => {
      client.users.info = async function (obj) {
        return {
          id: obj.user,
          name: obj.user,
        };
      };

      let users = await slack.getSlackUsers(client, ['abc123', 'def456']);

      expect(users).to.eql([
        { id: 'abc123', name: 'abc123' },
        { id: 'def456', name: 'def456' },
      ]);
    });

    it('should return a list of user ids if it gets an exception', async () => {
      sinon.stub(client.users, 'info').throws(new Error('Error'));

      let users = await slack.getSlackUsers(client, ['abc123', 'def456']);

      expect(users).to.eql(['abc123', 'def456']);
    });
  });

  describe('getSlackUserByEmail()', () => {
    it('should return a Slack User by Email', async () => {
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

    it('should return null if the users email is not found', async () => {
      sinon.stub(client.users, 'lookupByEmail').throws(new Error('Error'));

      let result = await slack.getSlackUserByEmail('john.smith@adhocteam.us');

      expect(result).to.be.null;
    });
  });

  describe('getChannelTopic()', async () => {
    it('should return the channel topic', async () => {
      sinon
        .stub(client.conversations, 'info')
        .withArgs(sinon.match.any)
        .resolves({
          channel: {
            topic: {
              value: 'This is the channel topic',
            },
          },
        });

      let result = await slack.getChannelTopic(client);

      expect(result).to.equal('This is the channel topic');
    });
  });

  describe('getMessageById()', async () => {
    it('should get a message by timestamp', async () => {
      const messages = [
        {
          type: 'message',
          user: 'U012AB3CDE',
          text: 'I find you punny and would like to smell your nose letter',
          ts: '1512085950.000216',
        },
        {
          type: 'message',
          user: 'U061F7AUR',
          text: 'What, you want to smell my shoes better?',
          ts: '1512104434.000490',
        },
      ];

      sinon
        .stub(client.conversations, 'history')
        .withArgs(sinon.match.any)
        .resolves({
          messages,
        });

      let result = await slack.getMessageById(
        client,
        '1512104434.000490',
        'C12DS3DX'
      );

      expect(result).to.eql(messages[1]);
    });

    it('should return null when a message is not found', async () => {
      sinon
        .stub(client.conversations, 'history')
        .withArgs(sinon.match.any)
        .resolves({
          messages: [],
        });

      let result = await slack.getMessageById(
        client,
        '1512104434.000490',
        'C12DS3DX'
      );

      expect(result).to.be.null;
    });
  });

  describe('', () => {});
});

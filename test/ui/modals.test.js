const { expect } = require('chai');

const modalBuilder = require('../../src/ui/modals');

describe('ui/modals', () => {
  // TODO: Commented out on 5/18 since this users field is not currently used.
  // it('should set initial users array with passed in user id', () => {
  //   const modal = modalBuilder.buildSupportModal('U01T9CL8PEK', []);

  //   const initial_users = modal.blocks[4].element.initial_users;

  //   expect(initial_users).to.have.lengthOf(1);
  //   expect(initial_users).to.be.eql(['U01T9CL8PEK']);
  // });

  it('should generate correct team drop down menu', () => {
    const modal = modalBuilder.buildSupportModal('U01T9CL8PEK', [
      { text: 'Team 1', value: 'Value 1' },
      { text: 'Team 2', value: 'Value 2' },
    ]);

    const options = modal.blocks[2].element.options;

    expect(options).to.have.lengthOf(2);
    expect(options).to.be.eql([
      {
        text: {
          type: 'plain_text',
          text: 'Team 1',
          emoji: true,
        },
        value: 'Value 1',
      },
      {
        text: {
          type: 'plain_text',
          text: 'Team 2',
          emoji: true,
        },
        value: 'Value 2',
      },
    ]);
  });
});

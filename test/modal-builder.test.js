const chai = require('chai');
const assertArrays = require('chai-arrays');
const modalBuilder = require('../src/block-kit/modal-builder');

// Chai Setup
chai.use(assertArrays);
const expect = chai.expect;

describe('Modal Builder', () => {
  it('should build a modal with supplied user id', () => {
      const modal = modalBuilder.buildSupportModal('U01T9CL8PEK', []);

      const initial_users = modal.blocks[4].element.initial_users;

      expect(initial_users).to.have.lengthOf(1);
      expect(initial_users).to.be.equalTo(['U01T9CL8PEK']);
  });
});
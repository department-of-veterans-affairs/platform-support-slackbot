const chai = require('chai');
const assertArrays = require('chai-arrays');
const modalBuilder = require('../src/modal-builder');

// Chai Setup
chai.use(assertArrays);
const expect = chai.expect;

describe('Modal Builder', () => {
  it('should build a modal with supplied username', () => {
      const modal = modalBuilder.buildSupportModal('johnsmith');

      const initial_users = modal.blocks[2].element.initial_users;

      expect(initial_users).to.have.lengthOf(1);
      expect(initial_users).to.be.equalTo(['johnsmith']);
  });
});
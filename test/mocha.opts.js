global.sinon = require('sinon');
const chai = require('chai');
const assertArrays = require('chai-arrays');

// Chai Setup
chai.use(assertArrays);
global.expect = chai.expect;

// Logger Setup (disabled during testing)
global.logger = require('pino')({
  enabled: false,
});

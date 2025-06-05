// generate-jwt.js

const fs = require('fs');
const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config();

const privateKey = process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
const appId = process.env.GITHUB_APP_ID;

// Define JWT payload
const payload = {
  iat: Math.floor(Date.now() / 1000) - 60, // Issued at time
  exp: Math.floor(Date.now() / 1000) + (10 * 60), // JWT expiration time (10 minutes)
  iss: appId, // GitHub App's identifier
};

// Generate JWT
const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

console.log(token);


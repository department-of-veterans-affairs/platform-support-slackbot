// Load environment variables
require('dotenv').config();

const { google } = require('googleapis');
const path = require('path');

// Path to the service account key file
const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Create a JWT client
const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Initialize the Sheets API
const sheets = google.sheets({ version: 'v4', auth });

// Example function to read data from a spreadsheet
async function readSpreadsheet(spreadsheetId, range) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });
    console.log('Spreadsheet Data:', response.data.values);
  } catch (error) {
    console.error('Error reading spreadsheet:', error);
  }
}

// Example usage
const SPREADSHEET_ID = '18y9TnuSuNCgIH46s2UwALaVxixjVt1-sqWtN-Wrp4y0';
const RANGE = 'Sheet1!A1:D10';

readSpreadsheet(SPREADSHEET_ID, RANGE);


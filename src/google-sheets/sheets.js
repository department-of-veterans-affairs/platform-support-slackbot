const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = require("../../client_secret.json");

const getTopics = async () => {
    const doc = new GoogleSpreadsheet('1k9P921Hdo654631HmX9WovGaYRIFAhO3QRg3EN3F9gI');

    // Authentication using Google Service Account (See client_secret.json)
    doc.useServiceAccountAuth(creds);

    // loads document properties and worksheets
    await doc.loadInfo(); 

    const sheet = doc.sheetsByIndex[0];

    const rows = await sheet.getRows();

    let result = [];

    for (let i = 0; i < sheet.rowCount; i++) {
        if (!rows[i]) break;
        result.push({ text: rows[i].Title, value: rows[i].Value });
    }

    return result;
};

module.exports = {
    getTopics
};
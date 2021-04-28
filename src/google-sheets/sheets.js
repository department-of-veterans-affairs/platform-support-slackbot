const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = require("../../client_secret.json");

const getTopics = async () => {
    const doc = new GoogleSpreadsheet(process.env.TOPIC_SPREADSHEET_ID);

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

const captureResponses = async (ticketId, username, currentTime, usersRequestingSupport, selectedTopic, summaryDescription) => {
    const doc = new GoogleSpreadsheet(process.env.RESPONSES_SPREADSHEET_ID);

    // Authentication using Google Service Account (See client_secret.json)
    doc.useServiceAccountAuth(creds);

    // loads document properties and worksheets
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];

    //Users	Topic	Summary	ForwardedTeam

    const userList = usersRequestingSupport.join(', ');

    const row = await sheet.addRow({ 
        TicketId: ticketId,
        SubmittedBy: username,
        DateTime: currentTime.toString(),
        Users: userList, 
        Topic: selectedTopic, 
        Summary: summaryDescription, 
        AssignedTeam: 'none' 
    });
};

module.exports = {
    getTopics,
    captureResponses
};
//const redis = require('redis');

let AssistantV1 = require('ibm-watson/assistant/v1');
const dialogflow = require('dialogflow');
const uuid = require('uuid');

let getWatsonResult = (text, conversationPayload, callback) => {

    console.log('Inside Watson');
    let assistant = new AssistantV1({
        iam_apikey: process.env.WATSON_API_KEY,
        url: 'https://gateway.watsonplatform.net/assistant/api',
        version: '2018-02-16'
    });

    // console.log("text : " + text);

    let contextPayload = (typeof conversationPayload === 'undefined' || conversationPayload === '' || conversationPayload === null) ? JSON.parse("{}") : {
        "conversation_id": conversationPayload
    };

    // console.log("contextPayload : " + contextPayload);

    assistant.message({
            input: {
                text: text
            },
            workspace_id: process.env.WATSON_WORKSPACE_ID,
            context: contextPayload
        })
        .then(result => {

            // Watson Response
            console.log(result);

            let speech = '';

            for (let text of result['output']['text']) {
                speech += text + "\n";
            }

            //Pull out the instructions if they exist, otherwise return an empty JSON object.
            let instructions = result['context'].hasOwnProperty('instructions') ? result['context']['instructions'] : {};

            //Always clear out the old instructions otherwise if the NLP does not set them the same will be sent through again.
            let conversationPayload = result['context'];
            conversationPayload['instructions'] = {};

            callback(speech, instructions, conversationPayload);
        })
        .catch(err => {
            console.log(err);
        });
}

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
async function queryDialogFlow(text, conversationPayload, callback) {
    // A unique identifier for the given session
    const sessionId = uuid.v4();

    // Create a new session
    const sessionClient = new dialogflow.SessionsClient();
    const sessionPath = sessionClient.sessionPath(process.env.DIALOG_FLOW_PROJECT_ID, sessionId);

    // Context is used for continuing a conversation - for now with Dialogflow, assume every utterance is unique (will implement context in a next step)
    // let contextPayload = (typeof conversationPayload === 'undefined' || conversationPayload === '' || conversationPayload === null) ? JSON.parse("{}") : {
    //     "conversation_id": result.responseId
    // };

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                // The query to send to the dialogflow agent
                text: text,
                // The language used by the client (en-US)
                languageCode: 'en-US',
            },
        },
    };

    // Send request and log result
    const responses = await sessionClient.detectIntent(request);
    // console.log('Detected Dialogflow intent');
    const result = responses[0].queryResult;
    // console.log(`  Query: ${result.queryText}`);
    // console.log(`  Response: ${result.fulfillmentText}`);
    if (result.intent) {
        let speech = result.fulfillmentText;
        let instructions = {}; // Instructions will be the emotion / expression we send to UneeQ from NLP - will need to be a custom trigger in Dialogflow, perhaps using Context variables (like Watson).  For now, empty
        let conversationPayload = {
            "instructions": instructions
        }; // Payload will also be populated in the future, for now empty
        // console.log(`  Intent: ${result.intent.displayName}`);
        callback(speech, instructions, conversationPayload);
    } else {
        console.log(`  No intent matched.`);
    }
}

let setEmotion = (emotion) => {
    console.log("Emotion being set = " + emotion);
    emotionState = emotion;
}

module.exports = {
    getConverseResult: getWatsonResult,
    getDialogFlowResult: queryDialogFlow,
    setEmotion: setEmotion

};
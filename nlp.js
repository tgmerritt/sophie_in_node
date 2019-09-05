//const redis = require('redis');

let AssistantV1 = require('ibm-watson/assistant/v1');


let getWatsonResult = (text, conversationPayload, callback) => {

    console.log('Inside Watson');
    let assistant = new AssistantV1({
        iam_apikey: process.env.WATSON_API_KEY,
        url: 'https://gateway.watsonplatform.net/assistant/api',
        version: '2018-02-16'
    });

    console.log("text : " + text);
    let contextPayload = (typeof conversationPayload === 'undefined' || conversationPayload === '' || conversationPayload === null) ? JSON.parse("{}") : JSON.parse(conversationPayload);

    console.log("contextPayload : " + contextPayload);

    assistant.message({
            input: {
                text: text
            },
            workspace_id: process.env.WATSON_WORKSPACE_ID,
            context: contextPayload
        })
        .then(result => {

            let speech = '';

            for (let text of result['output']['text']) {
                speech += text + "\n";
            }

            //Pull out the instructions if they exist, otherwise return and empty JSON object.
            let instructions = result['context'].hasOwnProperty('instructions') ? result['context']['instructions'] : {};

            //Always clear out the old instructions otherwise if the NLP does not set them the same will be sent through again.
            let conversationPayload = result['context'];
            conversationPayload['instructions'] = {};

            callback(speech, instructions, conversationPayload)
        })
        .catch(err => {
            console.log(err);
        });
}

let setEmotion = (emotion) => {
    console.log("Emotion being set = " + emotion);
    emotionState = emotion;
}

module.exports = {
    getConverseResult: getWatsonResult,
    setEmotion: setEmotion

};
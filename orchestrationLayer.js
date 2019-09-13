let server = new require("./server.js");
let nlp = new require("./nlp.js");

//Handle the post request
let processPostRequest = (body, path, callback) => {
    console.log('Process ' + path);

    if (path == '/api/v1/watson/converse') {
        try {
            if (body.constructor !== Object) {
                body = JSON.parse(body)
            }
            console.log("Connect to Watson and send transcript");
            nlp.getConverseResult(body['fm-question'], body['fm-conversation'], (speech, instructions, conversationPayload) => {
                console.log("Watson returned a result");
                console.log("Speech: " + speech + " Instructions: " + instructions + " Conversation Payload: " + conversationPayload);
                let avatarResponse = {
                    'answer': speech,
                    'instructions': instructions
                };
                callback(JSON.stringify({
                    "answer": JSON.stringify(avatarResponse),
                    "matchedContext": "",
                    conversationPayload: JSON.stringify(conversationPayload)
                }));
            });
        } catch (e) {
            console.log(e.toString());
            callback("{}");
        }

    } else if (path == '/v2/{session=projects/*/agent/sessions/*}:detectIntent') {
        waitForDialogFlow(body, callback);
    }

}

async function waitForDialogFlow(body, callback) {
    console.log("Connect to Dialogflow and send transcript");
    await nlp.getDialogFlowResult(body['fm-question'], body['fm-conversation'], (speech, instructions, conversationPayload) => {
        // console.log("Dialogflow returned a result");
        // console.log("Speech: " + speech + " Instructions: " + instructions + " Conversation Payload: " + conversationPayload);
        let avatarResponse = {
            'answer': speech,
            'instructions': instructions
        };
        callback(JSON.stringify({
            "answer": JSON.stringify(avatarResponse),
            "matchedContext": "",
            conversationPayload: JSON.stringify(conversationPayload)
        }));
    });
}

let startServer = (port) => {
    server.createServer(port, processPostRequest)
}

module.exports = {
    startServer: startServer,
    processPostRequest: processPostRequest
};
let server = new require("./server.js");
let nlp = new require("./nlp.js");

//Handle the post request
let processPostRequest = (body, path, callback) => {
    console.log('Process ' + path);
    try {
        if (path == '/api/v1/watson/converse') {
            if (body.constructor !== Object) {
                body = JSON.parse(body)
            }
            nlp.getConverseResult(body['fm-question'], body['fm-conversation'], (speech, instructions, conversationPayload) => {

                let avatarResponse = {
                    'answer': speech,
                    'instructions': instructions
                };
                callback(JSON.stringify({
                    "answer": JSON.stringify(avatarResponse),
                    "matchedContext": "",
                    conversationPayload: JSON.stringify(conversationPayload)
                }));

            })

        } else {
            callback("{}");
        }
    } catch (e) {
        console.log(e.toString());
        callback("{}");
    }
}

let startServer = (port) => {
    server.createServer(port, processPostRequest)
}

module.exports = {
    startServer: startServer,
    processPostRequest: processPostRequest
};
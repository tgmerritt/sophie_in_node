//const redis = require('redis');

let AssistantV1 = require('ibm-watson/assistant/v1');
const uuid = require('uuid');
const dialogflow = require('dialogflow');

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
    
    let contexts = JSON.parse(conversationPayload);
    console.log(`Conversation Payload: ${JSON.parse(conversationPayload)}`);
    if (contexts !== null && contexts !== undefined && contexts.length > 0) {
        contexts = JSON.parse(conversationPayload);
    } else {
        contexts = [];
    }
    
    // A unique identifier for the given session
    const sessionId = uuid.v4();

    // Create a new session
    const sessionClient = new dialogflow.SessionsClient();
    const sessionPath = sessionClient.sessionPath(process.env.DIALOG_FLOW_PROJECT_ID, sessionId);

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
        queryParams: {
            knowledgeBaseNames: ["projects/newagent-cidtks/knowledgeBases/MTY2ODYxNDQ0ODI2NjM0NjQ5Ng"]
        },
    };

    if (contexts.length > 0) {
        request.queryParams = {
            contexts: contexts,
          };
    }

    // Send request and log result
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    console.log(`Full Result: ${JSON.stringify(result, null, 2)}`);
    console.log(`Query text: ${result.queryText}`);
    console.log(`Detected Intent: ${result.intent.displayName}`);
    console.log(`Confidence: ${result.intentDetectionConfidence}`);
    console.log(`Query Result: ${result.fulfillmentText}`);
    // console.log(`Context Result: ${JSON.stringify(result.outputContexts[0], null, 2)}`);
    if (result.knowledgeAnswers && result.knowledgeAnswers.answers) {
        const answers = result.knowledgeAnswers.answers;
        console.log(`There are ${answers.length} answer(s);`);
        answers.forEach(a => {
            console.log(`   answer: ${a.answer}`);
            console.log(`   confidence: ${a.matchConfidence}`);
            console.log(`   match confidence level: ${a.matchConfidenceLevel}`);
        });
    }
    // console.log(`  Query: ${result.queryText}`);
    // console.log(`  Response: ${result.fulfillmentText}`);
    if (result.intent) {
        let speech = result.fulfillmentText;
        let instructions = {}

        // In DialogFlow we can define under the Action and Parameters section of an Intent a custom parameter that is passed through with the response
        // Setting the emotionalTone payload that we want in this custom parameter allows us to stringify JSON in, parse it here, then stringify it outbound to UneeQ
        // thus supporting custom emotional markup like with IBM Watson
        
        if (result.parameters.fields.hasOwnProperty('emotionalTone')) {
            let emotion = result.parameters.fields.emotionalTone.stringValue.replace(/(\r\n|\n|\r)/gm, "").replace(/\s/g, "")            
            instructions["emotionalTone"] = JSON.parse(emotion);
        }

        if (result.parameters.fields.hasOwnProperty('expressionEvent')) {
            let expression = result.parameters.fields.expressionEvent.stringValue.replace(/(\r\n|\n|\r)/gm, "").replace(/\s/g, "")
            instructions["expressionEvent"] = JSON.parse(expression);
            console.log("Adding custom Expression...");
        }

        let conversationPayload = {};
        if (result.outputContexts.length !== 0) {
            conversationPayload['context'] = result.outputContexts;
        }

        // console.log(`Conversation Payload is now: ${JSON.stringify(conversationPayload, null, 2)}`);
        
        callback(speech, instructions, conversationPayload);
    } else {
        console.log(`  No intent matched.`);
    }
}

async function detectTextIntent(query, conversationPayload, callback) {
    // [START dialogflow_detect_intent_text]
  
    /**
     * TODO(developer): UPDATE these variables before running the sample.
     */
    // projectId: ID of the GCP project where Dialogflow agent is deployed
    // const projectId = 'PROJECT_ID';
    // sessionId: Random number or hashed user identifier
    // const sessionId = 123456;
    // queries: A set of sequential queries to be send to Dialogflow agent for Intent Detection
    // const queries = [
    //   'Reserve a meeting room in Toronto office, there will be 5 of us',
    //   'Next monday at 3pm for 1 hour, please', // Tell the bot when the meeting is taking place
    //   'B'  // Rooms are defined on the Dialogflow agent, default options are A, B, or C
    // ]
    // languageCode: Indicates the language Dialogflow agent should use to detect intents
    // const languageCode = 'en';

    const sessionId = uuid.v4()
    const projectId = process.env.DIALOG_FLOW_PROJECT_ID;
    const languageCode = 'en-US';
  
    // Instantiates a session client
    const sessionClient = new dialogflow.SessionsClient();
  
    async function detectIntent(
      projectId,
      sessionId,
      query,
      contexts,
      languageCode
    ) {
      // The path to identify the agent that owns the created intent.
    //   const sessionPath = sessionClient.sessionPath(projectId, sessionId);
      const sessionPath = sessionClient.sessionPath(process.env.DIALOG_FLOW_PROJECT_ID, sessionId);
  
      // The text query request.
      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: query,
            languageCode: languageCode,
          },
        },
      };
  
      if (contexts && contexts.length > 0) {
        request.queryParams = {
          contexts: contexts,
        };
      }
  
      const responses = await sessionClient.detectIntent(request);
      return responses[0];
    }
  
    async function executeQueries(projectId, sessionId, queries, languageCode) {
      // Keeping the context across queries let's us simulate an ongoing conversation with the bot
      let context;
      let intentResponse;
      for (const query of queries) {
        try {
          console.log(`Sending Query: ${query}`);
          intentResponse = await detectIntent(
            projectId,
            sessionId,
            query,
            context,
            languageCode
          );
          console.log('Detected intent');
          console.log(
            `Fulfillment Text: ${intentResponse.queryResult.fulfillmentText}`
          );
          // Use the context from this response for next queries
          context = intentResponse.queryResult.outputContexts;
        } catch (error) {
          console.log(error);
        }
      }
    }
    executeQueries(projectId, sessionId, queries, languageCode);
    // [END dialogflow_detect_intent_text]
  }

let setEmotion = (emotion) => {
    console.log("Emotion being set = " + emotion);
    emotionState = emotion;
}

module.exports = {
    getConverseResult: getWatsonResult,
    // getDialogFlowResult: queryDialogFlow,
    getDialogFlowResult: detectTextIntent,
    setEmotion: setEmotion

};
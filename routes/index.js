var express = require('express');
var router = express.Router();
var handleTranscript = require('../orchestrationLayer');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Sophie - A Digital Human in Node.js'
  });
});

// This isn't ever hit because we integrate directly to Watson via the UneeQ Admin Console - but this is what it would look like.
router.post('/transcript', function (req, res, next) {
  // console.log('body = ' + req.body);
  // The second param for processPostRequest really just acts as the value in a switch statement, we can re-write this to send 'watson' or 'dialogflow' as a string to the underlying call to NLP
  // In the future, it would be best to dynamically pass in which NLP we should query in the POST itself, providing customers flexibility 
  handleTranscript.processPostRequest(req.body, '/v2/{session=projects/*/agent/sessions/*}:detectIntent', (responseBody) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.write(responseBody);
    res.send();
  });
});

module.exports = router;
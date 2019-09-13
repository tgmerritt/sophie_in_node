var express = require('express');
var router = express.Router();
var getToken = require('../singleUseToken');
var handleTranscript = require('../orchestrationLayer');

/* GET home page. */
router.get('/', function (req, res, next) {
  async function awaitSingleUseToken() {
    var token = await getToken.getSingleUseToken();
    console.log(token);
    res.render('index', {
      title: 'Sophie - A Digital Human',
      singleUseToken: token
    });
  }

  awaitSingleUseToken();
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
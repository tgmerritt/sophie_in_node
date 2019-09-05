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

router.post('/transcript', function (req, res, next) {
  console.log('body = ' + req.body);
  handleTranscript.processPostRequest(req.body, '/api/v1/watson/converse', (responseBody) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.write(responseBody);
    res.send();
  });
  // res.send(handleTranscript.processPostRequest(req.body, '/api/v1/watson/converse', processRequest));
});

module.exports = router;
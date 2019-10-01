var express = require('express');
var router = express.Router();
var getToken = require('../singleUseToken');
var handleTranscript = require('../orchestrationLayer');

/* GET conversations page. */
router.get('/', function (req, res, next) {
  async function awaitSingleUseToken() {
    var token = await getToken.getSingleUseToken();
    console.log(token);
    res.render('conversations', {
      title: 'Sophie - A Digital Human',
      singleUseToken: token
    });
  }

  awaitSingleUseToken();
});

module.exports = router;
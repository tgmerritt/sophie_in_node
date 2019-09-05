let orchestrationLayer = require("./orchestrationLayer.js");
let singleUseToken = require("./singleUseToken.js");

singleUseToken.startServer(3030);
orchestrationLayer.startServer(3000);


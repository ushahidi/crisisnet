var store = require("../cn-store-js")
  , queryBuilder = require("../cn-search-js").itemQueryBuilder
  , utils = require('./utils');

var recordRequest = function(req, res, next) {
  var appID = req.headers.authorization.split(' ')[1];
  var userID = req.user.id;

  var requestModel = new store.Request({appID:appID, userID:userID});
  requestModel.save();

  next();
};

var setupRoutes = utils.setupRoutes([queryBuilder, recordRequest]);


module.exports = {
  setupRoutes: setupRoutes
}
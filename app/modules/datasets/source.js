var authRequired = require("../utils/auth").authRequired
  , store = require('../cn-store-js')
  , _ = require("underscore")
  , request = require("request");

var addData = function(req, res) {
  res.render("add-data", {user:req.user});
};

var proxyRequest = function(req, res) {
  var url = req.query.url;
  console.log(req.query);
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.send(body);
    }
    else {
      res.send(error);
    }
  })
};

var setupRoutes = function(app, path) {
  path = "/" + path
  app.get(path + '/add-source', authRequired, addData);
  app.get(path + '/proxy-request', authRequired, proxyRequest);
};


module.exports = {
  setupRoutes: setupRoutes
}
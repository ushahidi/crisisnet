var authRequired = require("../utils/auth").authRequired
  , _ = require("underscore");


var viewPage = function(req, res) {
  try {
    res.render("pages/"+req.params.templateName, { user: req.user });
  }
  catch(err) {
    res.render("We could not find that view.");
  }
};

var setupRoutes = function(app, path) {
  path = "/" + path
  app.get(path + '/:templateName', viewPage);
};

module.exports = {
  setupRoutes: setupRoutes
}
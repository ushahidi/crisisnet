var store = require("../cn-store-js")
  , passport = require("passport")
  , queryBuilder = require("../cn-search-js").queryBuilder;

var getSingle = function(req, res) {
  
};

var getAll = function(req, res) {
  var query = queryBuilder(req.query, function(err, results) {
    if(err) {
      return res.json(500, err);
    }
    res.json(200, results);
  });
};


var setupRoutes = function(app, path) {
  path = "/" + path;

  // Get all
  app.get(path, passport.authenticate('bearer', { session: false }), getAll);

  // Get one
  app.get(path+'/:id', passport.authenticate('bearer', { session: false }), getSingle);
};


module.exports = {
  setupRoutes: setupRoutes
}
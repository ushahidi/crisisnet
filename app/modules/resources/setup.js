var passport = require("passport")
  , _ = require('underscore');

var setup = {};

setup.getAll = function(queryBuilder) { 
  return function(req, res) {
    var query = queryBuilder(req.query, function(err, results, meta) {
      if(err) {
        return res.json(500, err);
      }
      var responseObj = {
        total: meta.total,
        data: results
      };
      res.json(200, responseObj);
    });
  };
};

setup.getSingle = function() {};

setup.setupRoutes = function(endpoint, app, middlewares, queryBuilder) {
    path = "/" + endpoint;

    var args = [passport.authenticate('bearer', { session: false })];
    args = args.concat(middlewares);
    
    // Get all
    args.unshift(path);
    args.push(setup.getAll(queryBuilder));
    app.get.apply(app, args);

    // Get one
    args[0] = path+'/:id';
    args.pop(); // get rid of getAll
    args.push(setup.getSingle);
    app.get.apply(app, args);
};

module.exports = setup;
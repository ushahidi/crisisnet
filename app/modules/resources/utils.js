var passport = require("passport")
  , _ = require('underscore');

var utils = {};

utils.getAll = function(queryBuilder) { 
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

utils.getSingle = function() {};

utils.limitRoleAccess = function(roles) {
  return function(req, res, next) {
    if(_.intersection(roles, req.user.roles).length > 0) {
      next();
    }
    else {
      res.json(500, "Access denied");
    }
  };
};

utils.setupRoutes = function(middlewares) {
  if(!_.isArray(middlewares)) {
    middlewares = [middlewares];
  }

  var queryBuilder = middlewares.shift(); // we'll need this later
  var args = [passport.authenticate('bearer', { session: false })];
  args = args.concat(middlewares);

  return function(app, path) {
    path = "/" + path;
    
    // Get all
    args.unshift(path);
    args.push(utils.getAll(queryBuilder));
    app.get.apply(app, args);

    // Get one
    args[0] = path+'/:id';
    args.pop(); // get rid of getAll
    args.push(utils.getSingle);
    app.get.apply(app, args);
  };
};

module.exports = utils;
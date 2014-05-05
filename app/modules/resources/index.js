var setup = require('./setup');

var register = function(endpoint, app, dbConn) {
  var mod = require('./'+endpoint)
    , queryBuilder = mod.queryBuilder(dbConn);

  setup.setupRoutes(endpoint, app, mod.middlewares, queryBuilder, mod.options);
};

module.exports = {
  register: register
}
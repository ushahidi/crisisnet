var queryBuilder = require("../cn-search-js").requestQueryBuilder
  , utils = require('./utils');

var setupRoutes = utils.setupRoutes(queryBuilder);

module.exports = {
  setupRoutes: setupRoutes
}
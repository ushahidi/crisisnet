var queryBuilder = require("../cn-search-js").userQueryBuilder
  , utils = require('./utils');

var setupRoutes = utils.setupRoutes(queryBuilder);

module.exports = {
  setupRoutes: setupRoutes
}
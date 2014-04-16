var queryBuilder = require("../cn-search-js").systemTagQueryBuilder
  , utils = require('./utils');

var setupRoutes = utils.setupRoutes(queryBuilder);

module.exports = {
  setupRoutes: setupRoutes
}
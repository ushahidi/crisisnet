var config = require('config')
  , elasticsearch = require('elasticsearch')
  , snapshot = require('../app/modules/snapshot');

var searchClient = new elasticsearch.Client(config.searchStoreConnect);
snapshot(null, searchClient);
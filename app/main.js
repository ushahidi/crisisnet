var express = require('express')
  , cors = require('cors')
  , config = require('config')
  , mongoose = require('mongoose')
  , _ = require('underscore')
  , logger = require('winston')
  , resources = require('./modules/resources');


var setupDB = function() {
  mongoose.connect(config.dbURI); 
  var db = mongoose.connection;
  
  db.on('error', function(err) { 
    if(err) logger.error('crisisnet.main.setupDB mongo connect error ' + err);
  });

  return db;
};

var start = function(db) {
  var app = express();
  var corsOptions = {
    headers: ['Content-Type',]
  };

  app.use(express.bodyParser());
  app.use(cors(corsOptions)); 
  app.use(app.router);

  resources.item.setupRoutes(app, "item");

  app.listen(8083);
};

logger.info('crisisnet listening on port 8083 with env='+process.env.NODE_ENV);

var db = setupDB();
db.once('open', start);
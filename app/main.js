var express = require('express')
  , cors = require('cors')
  , config = require('config')
  , mongoose = require('mongoose')
  , _ = require('underscore')
  , logger = require('winston')
  , resources = require('./modules/resources')
  , accounts = require('./modules/accounts')
  , stylus = require('stylus')
  , passport = require("passport")
  , store = require("./modules/cn-store-js");


var setupDB = function() {
  mongoose.connect(config.dbURI); 
  var db = mongoose.connection;
  
  db.on('error', function(err) { 
    if(err) logger.error('crisisnet.main.setupDB mongo connect error ' + err);
  });

  return db;
};

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(userID, done) {
    store.User.findOne({_id: userID}, function(err, user) {
      done(null, user);
    });
});

var start = function(db) {
  var app = express();
  var corsOptions = {
    headers: ['Content-Type',]
  };

  /**
   * Server configuration
   */

  // Session support. This is required for OAuth
  app.use(express.cookieParser());
  app.use(express.cookieSession({
    key: "crisis.net.is.the.bomb",
    secret: config.sessionSecret,
    cookie: {
      maxAge: 2678400000 // 31 days
    },
  }));
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());

  
  // Static assets
  app.use(stylus.middleware({
      debug: true
    , src: __dirname + '/static/stylus/'
    , dest: __dirname + '/static/css/'
    , compile: function(str) {
      return stylus(str).set('compress', true);
    }
  }));
  app.use(express.static(__dirname + '/static'));

  // Parse body for post requests
  app.use(express.bodyParser());
  
  // Allow cross-site requests using CORS protocol
  app.use(cors(corsOptions)); 
  
  // Request routing!
  app.use(app.router);
  
  // Templates
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');  
  app.set('layout', 'layout');
  app.set('partials', {});
  app.engine('html', require('hogan-express'));
  if(process.env.NODE_ENV === "production") {
    app.enable('view cache');
  }

  /**
   * Application bootstrapping
   */

  // Setup routes
  resources.item.setupRoutes(app, "item");
  accounts.auth.setupRoutes(app, "auth");
  accounts.profile.setupRoutes(app, "profile");


  // ...and we're off.
  app.listen(8083);
};

logger.info('crisisnet listening on port 8083 with env='+process.env.NODE_ENV);

var db = setupDB();
db.once('open', start);
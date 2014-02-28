var authRequired = require("../utils/auth").authRequired
  , form = require('express-form')
  , field = form.field
  , store = require('../cn-store-js')
  , _ = require("underscore");

var viewProfile = function(req, res) {
  res.render("profile", {user:req.user});
};

var appForm = function(req, res) {
  res.render("app-form", {user:req.user});
};

var validateAppForm = function() {
  return form(
    field("name").trim().required().isAlphanumeric(),
    field("description").trim().required(),
    field("url").trim().isUrl()
   )
};

var createApp = function(req, res, next) {
  req.user.apps.push(req.body);
  req.user.saveP().then(function(user) {
    var newApp = user.apps.pop();
    return res.redirect("/profile/app/" + newApp.id);
  });
};

var viewEditApp = function(req, res) {
  var app = _(req.user.apps).find(function(app) { return app._id.toString() === req.params.id});

  var renderView = function(user, app, message) {
    res.render("app-viewedit", {
      user: user,
      app: app,
      message: message
    });
  };

  if(!app) { 
    return renderView(req.user, null, "We could not find an app with that id.");
  }
  
  if(req.route.method === "post") {
    app.name = req.body.name;
    app.description = req.body.description;
    app.url = req.body.url; 
    
    req.user.saveP().then(function(user) {
      renderView(user, app, "Your app has been updated.");
    });
  }
  else {
    renderView(req.user, app);
  }
  
};

var setupRoutes = function(app, path) {
  path = "/" + path

  app.get(path, authRequired(viewProfile));
  app.get(path + '/app', authRequired(appForm));
  app.post(path + '/app', validateAppForm(), authRequired(createApp));
  app.get(path + '/app/:id', authRequired(viewEditApp));
  app.post(path + '/app/:id', validateAppForm(), authRequired(viewEditApp));
};


module.exports = {
  setupRoutes: setupRoutes
}
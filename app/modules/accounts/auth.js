var strategies = require("./auth-strategies")
  , passport = require('passport');

var signup = function(req, res) {
  res.render("register");
};

var setupRoutes = function(app, path) {
  strategies.setupProviders();

  path = "/" + path;

  app.get(path + "/signup", signup);

  app.get(path + '/logout', function(req, res){
    req.logout();
    res.redirect(path + "/signup");
  });

  /**
   * Third party Oauth providers. Each provider requires two routes. The first, 
   * `path + '/<provider_name>'` redirects the user to the third party site. 
   * The second, `path + '/<provider_name>/callback' is where the user will 
   * land after they have authenticated with the third party. 
   *
   * The behavior of the application after the user is returned from the third 
   * party is defined in the `auth-strategies` modules.
   */

  // Send the user to the third-party site
  app.get(path + '/:provider', function(req, res, next) {
    return passport.authenticate(req.params.provider)(req, res, next);
  });

  // Return the user to the callback for the provider
  app.get(path + '/:provider/callback', function(req, res, next) {
    passport.authenticate(req.params.provider, {
      successRedirect: "/profile",
      errorRedirect: "/auth/signup"})(req, res, next);
  });
};


module.exports = {
  setupRoutes: setupRoutes
}
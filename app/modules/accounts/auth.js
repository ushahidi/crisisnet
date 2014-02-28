var strategies = require("./auth-strategies")
  , passport = require('passport');

var signup = function(req, res) {
  res.render("register");
};

var setupRoutes = function(app, path) {
  strategies.setupProviders();

  path = "/" + path;

  app.get(path + "/signup", signup);

  /**
   * Third party Oauth providers. Each provider requires two routes. The first, 
   * `path + '/<provider_name>'` redirects the user to the third party site. 
   * The second, `path + '/<provider_name>/callback' is where the user will 
   * land after they have authenticated with the third party. 
   *
   * The behavior of the application after the user is returned from the third 
   * party is defined in the `auth-strategies` modules.
   */

  // Send the user to Twitter
  app.get(path + '/twitter', passport.authenticate('twitter'));

  // Twitter sends the user back here
  app.get(path + '/twitter/callback', 
    passport.authenticate('twitter', {
      successRedirect: "/profile",
      errorRedirect: "/auth/signup"}));
  };


module.exports = {
  setupRoutes: setupRoutes
}
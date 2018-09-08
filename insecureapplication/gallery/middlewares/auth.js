var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var login = require('connect-ensure-login');

var User = require('../models/user');
var Client = require('../models/client');
var AccessToken = require('../models/accesstoken');

passport.use(User.createStrategy()); //LocalStrategy
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/**
 * BasicStrategy
 *
 * This strategy is  used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens. While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
passport.use(new BasicStrategy(
  function (username, password, done) {
    Client.findOne({ clientID: username }, function (err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      //vulnerability: this function MUST implement rate limiting
      //to protect against bruteforce attacks - RFC6749#section-2.3.1
      if (!client.verifyClientSecretSync(password)) { return done(null, false); }
      return done(null, client);
    });
  }
));

passport.use(new ClientPasswordStrategy(
  function (clientID, clientSecret, done) {
    Client.findOne({ clientID: clientID }, function (err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      //vulnerability: this function MUST implement rate limiting
      //to protect against bruteforce attacks - RFC6749#section-2.3.1
      var valid = client.verifyClientSecretSync(clientSecret);
      if (!valid) { return done(null, false); }
      return done(null, client);
    });
  }
));
/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token).  If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy(
  function (accessToken, done) {
    console.log(accessToken);
    AccessToken.findOne({ token: accessToken }, function (err, token) {
      //vulnerability: logs access token
      console.log("TOKEN: " + JSON.stringify(token));
      if (err) {
        return done(err);
      }
      if (!token) {
        return done(null, false);
      }
      //check expiration
      if (token.isExpired()) {
        return done(null, false);
      }

      //userid in token
      if (token.user != null) {
        User.findOne({ _id: token.user }, function (err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false);
          }
          var info = { scope: token.scope }
          done(null, user, info);
        });
      } else {
        //The request came from a client only since userID is null
        //therefore the client is passed back instead of a user
        Client.findOne({ clientID: token.clientID }, function (err, client) {
          if (err) {
            return done(err);
          }
          if (!client) {
            return done(null, false);
          }
          var info = { scope: token.scope }
          done(null, client, info);
        });
      }

    });
  }
));

/**
* Either logged in via the connect middlewere or via a bearer token :)
*/
function ensureLoggedInApi(req, res, next) {
  console.log('ensuredloggedin');
  if (req.query.access_token || req.headers['Authorization']) {
    isBearerAuthenticated(req, res, next);
  }
  else {
    login.ensureLoggedIn()(req, res, next);
  }

}

function ensureScope(scope) {
  return ensureScope[scope] || (ensureScope[scope] = function (req, res, next) {
    //request not made via oauth
    if (!req.authInfo || !req.authInfo.scope) {
      return next();
    }
    //if the user did not set a scope, then req.authInfo.scope is *
    //if the requirement is no scope, then scope is *
    if (req.authInfo.scope === '*' || scope === '*') {
      return next();
    }
    reqscope = req.authInfo.scope.split(',');
    if (reqscope.indexOf(scope) <= -1) {
      return res.status(403).end('Forbidden');
    }
    return next();
  })
}

isBearerAuthenticated = passport.authenticate('bearer', { session: false });

exports = module.exports = {
  isClientAuthenticated: passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  isBearerAuthenticated: isBearerAuthenticated,
  isLocalAuthenticated: passport.authenticate('local', { successReturnToOrRedirect: "/", failureRedirect: '/login' }),
  ensureLoggedIn: ensureLoggedInApi,
  ensureScope: ensureScope
}

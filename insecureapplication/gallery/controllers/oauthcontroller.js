var oauth2orize = require('oauth2orize');
var uid = require('uid-safe');

var Client = require('../models/client');
var AuthorizationCode = require('../models/authorizationcode');
var AccessToken = require('../models/accesstoken');

var util = require('./util');
var config = require('../config/config');

// create OAuth 2.0 server
var server = oauth2orize.createServer();
// Register serialialization and deserialization functions.
// serialialization and deserialization functions.
//
// When a client redirects a user to an user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.
server.serializeClient(Client.serializeClient());
server.deserializeClient(Client.deserializeClient());

// Register supported grant types.
//secure: scope is used
//More info: https://tools.ietf.org/html/rfc6819#section-5.1.5.1
//when not used: everything is allowed
server.grant(oauth2orize.grant.code({scopeSeperator: [' ', ',']}, grantcode));
//alternative
//server.grant(oauth2orize.grant.authorizationCode({scopeSeperator: [' ', ',']}, grantcode));

//insecure: scope not used
//server.grant(oauth2orize.grant.code(grantcode));

// Exchange authorization codes for access tokens.
server.exchange(oauth2orize.exchange.authorizationCode(exchangecode));
//alternative:
//server.exchange(oauth2orize.exchange.code(exchangecode));

function decision(req, done) {
  //vulnerability: no scope is used
  //More info: https://tools.ietf.org/html/rfc6819#section-5.1.5.1
  return done(null);
}

//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

function grantcode(client, redirectURI, user, response, done) {
  //vulnerability: weak authorization codes
  var code = Math.floor(Math.random() * (100000-1) +1);
  AuthorizationCode({
    clientID: client.clientID,
    redirectURI: redirectURI,
    user: user.id,
    code: code
  }).save(function(err, result) {
    if (err) { return done(err); }
    done(null, code);
  });
}

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.
function exchangecode(client, code, redirectURI, done) {
  //insecure: logging of authorization codes
  console.log("Authorization Code: " + code);

  //vulnerability: authorization code can be used more than once
  //vulnerability: expiry of authorization code is not validated
  //vulnerability: redirectURI is not validated (open redirect)
  AuthorizationCode.findOne({code: code}, function(err, authCode) {
    if (err) {
      return done(new oauth2orize.TokenError("Error while accessing the token database.", "server_error"));
    }

    //vulnerability: weak access tokens
    var token = Math.floor(Math.random() * (100000-1) +1);
    //vulnerability: the token is logged
    console.log("Access Token: " + token);

    AccessToken({
      clientID: authCode.clientID,
      user: authCode.user,
      token: token

    }).save(function(err, result) {
      if (err) { return done(new oauth2orize.TokenError("Error while accessing the token database.", "server_error")); }
      return done(null, token, null);
    });
  });
}

// user authorization endpoint
//
// The validate callback is responsible for validating the client making the
// authorization request.  Once validated, the `done` callback must be
// invoked with a `client` instance, as well as the `redirectURI` to which the
// user will be redirected after an authorization decision is obtained.
function authorization_validate(clientID, redirectURI, done) {
  Client.findOne({clientID: clientID}, function(err, client) {

    if (err) {
      return done(err);
    }
    //vulnerability: redirectURI is not validated
    if(client != null) {
      return done(null, client,redirectURI);
    }
    return done(null, false);
  });
}
function authorization_autoapprove(client, user, done) {
  if (client.isTrusted()) {
    // Auto-approve
    return done(null, true);
  }
  // Otherwise ask user
  done(null, false);
}
function renderdialog(req, res){
  res.render('dialog', {
    transactionID: req.oauth2.transactionID,
    user: req.user,
    client: req.oauth2.client,
  }
  );
}

exports = module.exports = {
  decision: server.decision(decision),
  renderdialog: renderdialog,
  authorization: server.authorization(authorization_validate, authorization_autoapprove),
  token: server.token(),
  errorHandler: server.errorHandler()
};

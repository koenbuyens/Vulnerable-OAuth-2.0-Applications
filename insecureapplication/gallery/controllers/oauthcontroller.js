const oauth2orize = require('oauth2orize');

const Client = require('../models/client');
const User = require('../models/user');
const AuthorizationCode = require('../models/authorizationcode');
const AccessToken = require('../models/accesstoken');

// create OAuth 2.0 server
let server = oauth2orize.createServer();
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
// secure: scope is used
// More info: https://tools.ietf.org/html/rfc6819#section-5.1.5.1
// when not used: everything is allowed
server.grant(oauth2orize.grant.code({scopeSeperator: [' ', ',']}, grantcode));
// alternative
// server.grant(
//    oauth2orize.grant.authorizationCode(
//        {scopeSeperator: [' ', ',']}, grantcode
//    )
// );

// insecure: scope not used
// server.grant(oauth2orize.grant.code(grantcode));

// Exchange authorization codes for access tokens.
server.exchange(oauth2orize.exchange.authorizationCode(exchangecode));
// alternative:
// server.exchange(oauth2orize.exchange.code(exchangecode));

/**
 * Makes an authorization decision
 * @param {*} req request
 * @param {*} done callback function
 * @return {*} result of invoking the callback function
 */
function decision(req, done) {
  // vulnerability: no scope is used
  // More info: https://tools.ietf.org/html/rfc6819#section-5.1.5.1
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

/**
 * Grants authorization code
 * @param {*} client client for which to grant the code
 * @param {*} redirectURI redirect uri at which to deliver the code
 * @param {*} user the suer for which to grant the code
 * @param {*} response response msg
 * @param {*} done callback function
 */
function grantcode(client, redirectURI, user, response, done) {
  // vulnerability: weak authorization codes
  let code = Math.floor(Math.random() * (100000-1) +1);
  new AuthorizationCode({
    clientID: client.clientID,
    redirectURI: redirectURI,
    user: user.id,
    code: code,
  }).save(function(err, result) {
    if (err) {
      return done(err);
    }
    done(null, code);
  });
}

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.
/**
 * Token endpoint
 * @param {*} client client ID
 * @param {*} code authorization code
 * @param {*} redirectURI redirect URI
 * @param {*} done callback function
 */
function exchangecode(client, code, redirectURI, done) {
  // insecure: logging of authorization codes
  console.log('Authorization Code: ' + code);

  // vulnerability: authorization code can be used more than once
  // vulnerability: expiry of authorization code is not validated
  // vulnerability: redirectURI is not validated (open redirect)
  AuthorizationCode.findOne({code: code}, function(err, authCode) {
    if (err) {
      return done(
          new oauth2orize.TokenError(
              'Error while accessing the token database.',
              'server_error'
          )
      );
    }
    if (authCode == null) {
      return done(
          new oauth2orize.AuthorizationError(
              'Invalid Authorization Code.',
              'access_denied'
          )
      );
    }

    // vulnerability: weak access tokens
    let token = Math.floor(Math.random() * (100000-1) +1);
    // vulnerability: the token is logged
    console.log('Access Token: ' + token);

    new AccessToken({
      clientID: authCode.clientID,
      user: authCode.user,
      token: token,

    }).save(function(err, result) {
      if (err) {
        return done(
            new oauth2orize.TokenError(
                'Error while accessing the token database.',
                'server_error'
            )
        );
      }
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
/**
 * Validate authorization
 * @param {*} clientID client ID
 * @param {*} redirectURI redirect URI
 * @param {*} done callback function
 */
function authorizationValidate(clientID, redirectURI, done) {
  console.log('CLIENTID: ' + clientID + ' ' + redirectURI);
  Client.findOne({clientID: clientID}, function(err, client) {
    if (err) {
      return done(err);
    }
    // vulnerability: redirectURI is not validated
    console.log('CLIENT: ' + client);
    if (client != null) {
      return done(null, client, redirectURI);
    }
    return done(null, false);
  });
}

/**
 * Auto-approve function
 * @param {*} client client id
 * @param {*} user user
 * @param {*} done callback function
 * @return {*} returns the result of the callback function
 */
function authorizationAutoapprove(client, user, done) {
  if (client.isTrusted()) {
    // Auto-approve
    return done(null, true);
  }
  // Otherwise ask user
  done(null, false);
}

/**
 * Renders the dialog
 * @param {*} req request
 * @param {*} res response
 */
function renderdialog(req, res) {
  res.render('dialog', {
    transactionID: req.oauth2.transactionID,
    user: req.user,
    client: req.oauth2.client,
  }
  );
}

/**
 * Returns information about the access token.
 * @param {*} req request
 * @param {*} res response
 */
function tokeninfo(req, res) {
  let token = req.query.access_token;
  AccessToken.findOne({token: token}, function(err, token) {
    if (err != null || token == null) {
      res.status(400);
      return res.json({error: 'invalid_token'});
    }
    creationDate = Math.floor(new Date(token.created_at).getTime()/1000);
    const expirationLeft = Math.floor(
        (
          // creation date in seconds since epoch
          creationDate
          // expiry time in seconds; e.g. 3600
          + token.expires_in
          // current time in seconds since epoch
          - Math.floor(Date.now()/1000)
        )
    );
    let client = token.clientID;
    Client.findOne({clientID: client}, function(err, client) {
      if (err != null || client == null) {
        res.status(400);
        return res.json({error: 'invalid_token'});
      }
      User.findOne({_id: token.user}, function(err, user) {
        if (err != null || user == null) {
          res.status(400);
          return res.json({error: 'invalid_token'});
        }
        return res.json({
          iss: req.headers.host, // insecure: JSON injection
          sub: token.user,
          aud: client.clientID,
          azp: client.clientID,
          exp: expirationLeft,
          iat: creationDate,
          name: user.username,
        });
      });
    });
  });
}

/**
 * See  https://connect2id.com/products/server/docs/api/discovery#oauth-config
 * @param {*} req request
 * @param {*} res response
 * @return {*} configuration
 */
function wellknown(req, res) {
  host = req.headers.host;
  protocol = req.protocol;
  fullhost = protocol + '://' + host;
  config = {
    'issuer': fullhost, // insecure: JSON injection
    'token_endpoint': fullhost+'/token',
    'introspection_endpoint': fullhost+'/token/introspect',
    'revocation_endpoint': '',
    'authorization_endpoint': fullhost+'/login',
    'userinfo_endpoint': '',
    'registration_endpoint': '',
    'jwks_uri': '',
    'scopes_supported': ['profile', 'view_gallery'],
    'response_types_supported': ['code', 'token', 'code token'],
    'response_modes_supported': ['query', 'form_post'],
    'grant_types_supported': ['authorization_code', 'refresh_token'],
    'code_challenge_methods_supported': [],
    'acr_values_supported': [],
    'subject_types_supported': ['public'],
    'token_endpoint_auth_methods_supported': [
      'client_secret_basic',
      'client_secret_post',
    ],
    'token_endpoint_auth_signing_alg_values_supported': [],
    'id_token_signing_alg_values_supported': [],
    'userinfo_signing_alg_values_supported': [],
    'display_values_supported': ['page'],
    'claim_types_supported': ['normal'],
    'claims_supported': ['sub', 'iss', 'name'],
    'ui_locales_supported': ['en'],
    'claims_parameter_supported': true,
    'request_parameter_supported': false,
    'request_uri_parameter_supported': false,
    'require_request_uri_registration': false,
  };
  return res.json(config);
}

exports = module.exports = {
  decision: server.decision(decision),
  renderdialog: renderdialog,
  authorization: server.authorization(
      authorizationValidate,
      authorizationAutoapprove
  ),
  token: server.token(),
  errorHandler: server.errorHandler(),
  tokeninfo: tokeninfo,
  wellknown: wellknown,
};

var express = require('express');
var passport = require('passport');
var login = require('connect-ensure-login');
var helmet = require('helmet');
var oauthcontroller = require('../controllers/oauthcontroller')
var auth = require('../middlewares/auth');

var router = express.Router();

//routes are listed at the end
// user authorization endpoint
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request.
//
// This middleware simply initializes a new authorization transaction.  It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization).  We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view.
router.get('/authorize',
  login.ensureLoggedIn(),
  oauthcontroller.authorization,
  oauthcontroller.renderdialog
)
// user decision endpoint
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application.  Based on the grant type requested by the
// client, the grant middleware configured will be invoked to send
// a response.
router.post('/authorize/decision',
  login.ensureLoggedIn(),
  oauthcontroller.decision,
  //secure: avoid caching of the token responses
  helmet.noCache()
);
// token endpoint
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens.  Based on the grant type being exchanged, the
// exchange middleware will be invoked to handle the request.  Clients must
// authenticate when making requests to this endpoint.
router.post('/token',
  //client is authenticated with passport; after that token is exchanged
  auth.isClientAuthenticated,
  oauthcontroller.token,
  oauthcontroller.errorHandler,
  //secure: avoid caching of the token response
  helmet.noCache()
)

module.exports = router;

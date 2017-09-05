var express = require('express');
var passport = require('passport');

var auth = require('../middlewares/auth');

var router = express.Router();

//other routes
var users = require('./users');
var photos = require('./photos');
var clients = require('./clients');
var oauth = require('./oauth');
router.use('/users', users);
router.use('/photos', photos);
router.use('/clients', clients);
router.use('/oauth', oauth);

/**
* TODO: move to user
* Processes the login request with passport's local strategy
**/
//vulnerability: user enumeration - response for an incorrect username
//          arrives a factor 10 faster than a correct username and incorrect
//          password
router.post('/login', auth.isLocalAuthenticated);

/**
* Logs the user out
**/
router.post('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


/******************************************************************************
* Rendering jade views for easy submitting the requests above
*******************************************************************************/
/**
* Renders the login view (login.jade)
*/
router.get('/login', function(req, res){
  res.render('login', {user: req.user});
});

/**
* Processes the logout request with passport
*/
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

/**
* Renders the index view (index.jade)
**/
router.get('/', function(req, res){
  if(req.user) {
    res.redirect('photos/' + req.user.username);
  }
  else {
    res.render('index', {user : req.user});
  }
});

module.exports = router;

/*jshint esversion: 6 */
var util = require('./util');
var User = require('../models/user');
var passport = require('passport');

/**
* Returns the user profile
**/
//vulnerability: user enumeration: user can get list of all user profiles by enumerating over req.params.name
function getProfile(req, res) {
  var userid = req.params.name;
  if (userid === 'me') {
    userid = req.user.username;
  }
  User.findOne({ username: userid }, function (err, founduser) {
    if (err) return util.renderError(req, res, err, 'error');
    return renderUser(req, res, founduser);
  });
}

/**
* Creates a new user via passport local strategy
**/
function createProfile(req, res) {
  //vulnerability: vulnerable to username enumeration - error message states when
  //the user already exists
  //vulnerability: usernames of deleted users can be chosen
  //create a new user
  User.register(
    //register user object
    user = new User({
      username: req.body.username,
      email: req.body.email
    }),
    //its password
    req.body.password,
    //callback function for error
    function (err, account) {
      if (err) {
        util.renderError(req, res, err, 'register');
      }
      else {
        //authenticate user when no error with local strategy
        //username/password
        passport.authenticate('local')(req, res, function () {
          req.session.save(function (err) {
            if (err) { return next(err); }
            return res.redirect('/');
          });
        });
      }
    });
}

function updateProfile(req, res) {
  //vulnerability: vulnerable to username enumeration - error message states when
  //the user already exists
  //vulnerability: usernames of deleted users can be chosen
  var userid = req.params.name;
  User.findOneAndUpdate({ username: userid },
    //vulnerability: mass assignment
    req.body,
    function (err, founduser) {
      if (err) return util.renderError(req, res, err, 'error');
      else return util.renderMessage(req, res, null, 204);
    });
}

function deleteProfile(req, res) {
  var userid = req.params.name;
  //vulnerability: usernames of deleted users can be chosen
  User.findOneAndRemove(
    { username: userid },
    function (err, founduser) {
      if (err) return util.renderError(req, res, err, 'error');
      else return util.renderMessage(req, res, "Successfully Deleted.", 200);
    });
}

function getUsers(req, res) {
  User.find({}, function (err, users) {
    if (err) return util.renderError(req, res, err, 'error');
    else return renderUsers(req, res, users);
  });
}

function renderUsers(req, res, users) {
  if (!users || users.length == 0)
    return util.renderMessage(req, res, "No Users Found.", 404);
  return res.format({
    //if accept: text/html render a page
    'text/html': function () {
      res.render('users', {
        user: req.user,
        users: users
      });
    },
    //if json: render a json response
    'application/json': function () {
      res.status(200).send({ users });
    },
    //other formats are not supported
    'default': function () {
      res.status(406).send("Not Acceptable");
    }
  });
}

function renderUser(req, res, founduser) {
  return res.format({
    //if accept: text/html render a page
    'text/html': function () {
      res.render('user', {
        user: req.user,
        founduser: founduser
      });
    },
    //if json: render a json response
    'application/json': function () {
      res.status(200).send({ founduser });
    },
    //other formats are not supported
    'default': function () {
      res.status(406).send("Not Acceptable");
    }
  });
}

exports = module.exports = {
  getProfile: getProfile,
  updateProfile: updateProfile,
  deleteProfile: deleteProfile,
  getUsers: getUsers,
  createProfile: createProfile
};
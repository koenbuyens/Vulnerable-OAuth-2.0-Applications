
//This is the entry point of an insecure Gallery application.
// It is an express application
var express = require('express');
var expressSession = require('express-session');
//that uses bodyarser and cookieParser to parse requests
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//stores data into mongoDB. It uses mongoose models.
var mongoose = require('mongoose');
//authentication happens with passport and passport strategies
var passport = require('passport');
//during dev, it uses the errorhandler package. Erros are logged  with morgan.
var logger = require('morgan');
var errorhandler = require('errorhandler');
//an utility class to load static files in an OS independent way.
var path = require('path');

//our configuration file
var config = require("./config/config.json")

//initialize mongoDB and mongoose
mongoose.connect(config.mongodb);

//initialize express
var app = express();

//intialize the view engine used by express
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//initialize the bodyparsers and session mechanism
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(expressSession({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false
}));
//initialize passport
app.use(passport.initialize());
app.use(passport.session());

//serve content from public directory
app.use(express.static(path.join(__dirname, 'public')));

//include all the routes
var routes = require('./routes/index');
app.use('/', routes);

//error handling and logging
app.use(logger('dev')); //development logging
app.use(errorhandler({log : true}));

//listen to requests on a given port
app.listen(3005, function () {
  console.log('Gallery Application listening on port 3005');
});
module.exports = app;

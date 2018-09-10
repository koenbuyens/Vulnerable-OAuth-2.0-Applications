const express = require('express');
let router = new express.Router();
const login = require('connect-ensure-login');
const albumscontroller = require('../controllers/albumscontroller.js');
const auth = require('../middlewares/auth');

/* ************************************
* Authenticated User functionality   *
**************************************/
// obtains the list of albums of the logged in user
router.get('/', auth.ensureLoggedIn, albumscontroller.getAlbums);
// renders an uploaded album
router.get('/:name', login.ensureLoggedIn(), albumscontroller.renderAlbum);
// updates an album - vulnerability:
// direct object reference; can update pics of all users
router.put('/:name', auth.ensureLoggedIn, albumscontroller.updateAlbum);
// deletes an image  - vulnerability:
// direct object reference; can delete pics of all users
router.delete('/:name', auth.ensureLoggedIn, albumscontroller.deleteAlbum);
// creates an album
router.post('/', login.ensureLoggedIn(), albumscontroller.createAlbum);
router.post('/:name', login.ensureLoggedIn(), albumscontroller.createAlbum);


module.exports = router;

/*jshint esversion: 6 */
var MyAlbum = require('../models/album');
var path = require('path');
var User = require('../models/user');
var MyImage = require('../models/image');
var util = require('./util');
var config = require("../config/config.json");
var multer = require('multer');
var fs = require('fs');
var path = require('path');

/**
 * Gets a list of all albums of the logged in user
 * @param {*} req 
 * @param {*} res 
 */
function getAlbums(req, res) {
    console.log('albums');
    return renderAlbums(req, res, req.user);
}

/**
 * Creates an album
 */
function createAlbum(req, res) {
    if(req.params.name) {
        name = req.params.name;
    } else {
        name = req.body.name;
    }
    MyAlbum({
        name: name,
        description: req.body.description,
        user: req.user._id
    }).save(function (err, album, numAffected) {
        if (err) return util.renderError(req, res, err, 'error');
        return renderAlbum2(req, res, album);
      });
}

/**
 * Renders an album
 */
function renderAlbum(req, res) {
    var album = req.params.name;
    MyAlbum.findOne({ name:album }, function (err, foundalbum) {
        if (foundalbum == null) {
            err = "This album does not exist.";
        }
        if (err) return util.renderError(req, res, err, 'error');
        return renderAlbum2(req, res, foundalbum);
    });
}

/**
 * Updates an album
 */
function updateAlbum(req, res) {
    var name = req.params.name;
    var description = req.body.description;

    MyAlbum.findOneAndUpdate({ name: name }, { description: description }, function (err, album) {
        if (err) return util.renderError(req, res, err, 'error');
        return util.renderMessage(req, res, null, 204);
    });
}

/**
 * Deletes an album
 */
function deleteAlbum(req, res) {
    var name = req.params.name;

    MyAlbum.findOneAndRemove(
        { name: name },
        function (err, album) {
            if (err) return util.renderError(req, res, err, 'error');
            return util.renderMessage(req, res, "Successfully Deleted.", 200);
        });
}

/**
 * Renders a given album
 */
function renderAlbum2(req, res, album) {
    user = album.user;
    var backURL = req.header('Referer') || '/';

    return res.format({
        //if accept: text/html render a page
        'text/html': function () {
            res.render('album', {
                album: album,
                basepath: util.getFullURL(),
                imagepath: "image",
                backURL: backURL
            });
        },
        //if json: render a json response
        'application/json': function () {
            res.status(200).send({ album: album });
        },
        //other formats are not supported
        'default': function () {
            res.status(406).send("Not Acceptable");
        }
    });
}

/**
* Renders an album for a given user
*/
function renderAlbums(req, res, user) {
    var backURL = req.header('Referer') || '/';
    user.albums.then(function(albums) { 
        if (user) {
            console.log("User:" + user.username);
            console.log("Albums:" + JSON.stringify(albums));

            return res.format({
                //if accept: text/html render a page
                'text/html': function () {
                    res.render('albums', {
                        editable: true,
                        albums: albums,
                        basepath: util.getFullURL(),
                        imagepath: util.getImagePath(user.username),
                        backURL: backURL
                    });
                },
                //if json: render a json response
                'application/json': function () {
                    if(albums)
                        res.status(200).send({ albums: albums });
                    else
                        res.status(404).send([]);
                },
                //other formats are not supported
                'default': function () {
                    res.status(406).send("Not Acceptable");
                }
            });
        }
    });

}

exports = module.exports = {
    getAlbums: getAlbums,
    updateAlbum: updateAlbum,
    deleteAlbum: deleteAlbum,
    renderAlbum: renderAlbum,
    renderAlbums: renderAlbums,
    createAlbum: createAlbum
};
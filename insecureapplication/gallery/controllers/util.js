const path = require('path');

/**
 * Returns an image, either as json or via jade views
 * @param {*} req request
 * @param {*} res response
 * @param {*} image image
 * @return {*} response
 */
function serveImage(req, res, image) {
  if (image) {
    // calculate file path
    let blah2 = process.argv[1].split(path.sep);
    blah2.pop();
    blah2.push('public');
    blah2.push('uploads');
    let root = path.sep; // probably only works in linux
    for (let i = 0; i < blah2.length; i++) {
      root = path.join(root, blah2[i]);
    }
    // serve it
    // url is the actual file name...
    return res.sendFile(image.url,
        {
          headers: {
            'Content-Type': 'image/*',
          },
          root: root,
        }
    );
  }
}

/**
 * Gets ulr based on request
 * @param {*} req request
 * @return {*} url
 */
function getFullURL(req) {
  if (req == null) {
    return '';
  }
  return req.protocol + '://' + req.get('Host');
}

/**
 * Gets url based on gallery owner
 * @param {*} username
 * @return {*} image path
 */
function getImagePath(username) {
  if (username) {
    return '/photos/' + username + '/';
  } else {
    return image;
  }
}

/**
 * Renders error page
 * @param {*} req request
 * @param {*} res response
 * @param {*} err error msg
 * @param {*} page page
 * @return {*} response message
 */
function renderError(req, res, err, page) {
  if (err) {
    return res.format({
      'text/html': function() {
        res.render(page, {
          user: req.user,
          error: err.message,
        });
      },
      // if json: render a json response
      'application/json': function() {
        res.status(400).send({error: err.message});
      },
      // other formats are not supported
      'default': function() {
        res.status(406).send('Not Acceptable');
      },
    });
  }
}

/**
 * Renders message
 * @param {*} req request
 * @param {*} res response
 * @param {*} msg message
 * @param {*} status status
 * @return {*} formatted response message
 */
function renderMessage(req, res, msg, status) {
  if (!msg) {
    return res.status(status).end();
  }
  return res.format({
    'text/html': function() {
      res.status(status).render(page, {
        user: req.user,
        message: msg,
      });
    },
    // if json: render a json response
    'application/json': function() {
      res.status(status).send({message: msg});
    },
    // other formats are not supported
    'default': function() {
      res.status(406).send('Not Acceptable');
    },
  });
}

/**
 * Returns the username
 * @param {*} req request
 * @return {*} username
 */
function getUsername(req) {
  let userid = req.params.username;
  if (userid === 'me') {
    userid = req.user.username;
  }
  return userid;
}

module.exports = {
  serveImage: serveImage,
  renderError: renderError,
  getFullURL: getFullURL,
  getImagePath: getImagePath,
  renderMessage: renderMessage,
  getUsername: getUsername,
};

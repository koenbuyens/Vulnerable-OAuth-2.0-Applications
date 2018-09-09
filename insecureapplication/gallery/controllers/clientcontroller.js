/* jshint esversion: 6 */
const Client = require('../models/client');
const util = require('./util');

/**
 * Updeates the client with the given Cleint ID
 * @param {*} req request
 * @param {*} res response
 */
function updateClient(req, res) {
  let clientID = req.params.clientID;
  let name = req.body.name;
  let clientSecret = req.body.clientSecret;
  // insecure: should validate that they are URLs with complete path
  // See: https://tools.ietf.org/html/RFC6749#3.1.2.2
  let redirectURIs = req.body.redirectURIs;
  let trusted = req.body.trusted;

  let options = {};
  if (name) {
    options.name = name;
  }
  if (clientSecret) {
    options.clientSecret = clientSecret;
  }
  if (redirectURIs) {
    options.redirectURIs = redirectURIs.split(';');
  }
  if (trusted) {
    options.trusted = trusted;
  }

  Client.findOneAndUpdate({clientID: clientID}, options, function(err, client) {
    if (client == null) err = 'Client not found';
    if (err) {
      return util.renderError(req, res, err, 'error');
    } else {
      return util.renderMessage(req, res, null, 204);
    }
  });
}

/**
 * Returns the information of the client with the given clientID
 * @param {*} req request containing clientID as parameter
 * @param {*} res response with client information
 */
function getClient(req, res) {
  let clientID = req.params.clientID;
  Client.findOne({clientID: clientID}, function(err, client) {
    if (err) return util.renderError(req, res, err, 'error');
    return renderClient(req, res, client);
  });
}

/**
 * Deletes the client with the given clientID
 * @param {*} req request with the cleintID as parameter.
 * @param {*} res response
 */
function deleteClient(req, res) {
  let clientID = req.params.clientID;
  Client.findOneAndRemove(
      {clientID: clientID},
      function(err, client) {
        if (err) return util.renderError(req, res, err, 'error');
        return util.renderMessage(req, res, 'Successfully Deleted.', 200);
      }
  );
}

/**
 * Creates a new client.
 * @param {*} req request contianing the clientID, the redirectURIs separated
 * by semicolumns, and a boolean indicating whether the client is trusted
 * @param {*} res response
 */
function createClient(req, res) {
  let clientID = req.body.clientID;
  let redirectURIs = req.body.redirectURIs;
  let trusted = undefined;
  if (req.body.trusted != undefined && req.body.trusted != null) {
    trusted = req.body.trusted;
  } else {
    trusted = false;
  }

  new Client({
    clientID: clientID,
    name: req.body.name,
    clientSecret: req.body.clientSecret,
    redirectURIs: redirectURIs.split(';'),
    trusted: trusted,
  }).save(function(err, client, numAffected) {
    if (err) return util.renderError(req, res, err, 'error');
    return renderClient(req, res, client);
  });
}

/**
 * Returns the OAuth 2.0 clients.
 * @param {*} req request
 * @param {*} res response with client information.
 */
function getClients(req, res) {
  Client.find({}, function(err, clients) {
    if (err) return util.renderError(req, res, err, 'error');
    return renderClients(req, res, clients);
  });
}

/**
 * Renders the given client.
 * @param {*} req request
 * @param {*} res response contianing the client info
 * @param {*} client the client to render
 * @return {*} the client info
 */
function renderClient(req, res, client) {
  if (!client) {
    return util.renderMessage(req, res, 'Client Not Found.', 404);
  }
  return res.format({
    // if accept: text/html render a page
    'text/html': function() {
      res.render('client', {
        user: req.user,
        client: client,
      });
    },
    // if json: render a json response
    'application/json': function() {
      res.status(200).send({client});
    },
    // other formats are not supported
    'default': function() {
      res.status(406).send('Not Acceptable');
    },
  });
}

/**
 * Renders the given clients.
 * @param {*} req the request
 * @param {*} res the response
 * @param {*} clients the clients to render
 * @return {*} a string containing the client info
 */
function renderClients(req, res, clients) {
  if (!clients || clients.length == 0) {
    return util.renderMessage(req, res, 'No Clients Found.', 404);
  }
  return res.format({
    // if accept: text/html render a page
    'text/html': function() {
      res.render('clients', {
        user: req.user,
        clients: clients,
      });
    },
    // if json: render a json response
    'application/json': function() {
      res.status(200).send({clients});
    },
    // other formats are not supported
    'default': function() {
      res.status(406).send('Not Acceptable');
    },
  });
}

exports = module.exports = {
  updateClient: updateClient,
  deleteClient: deleteClient,
  getClient: getClient,
  createClient: createClient,
  getClients: getClients,
};

/*jshint esversion: 6 */
var Client = require('../models/client');
var util = require('./util');

function updateClient(req, res) {
  var clientID = req.params.clientID;
  var name = req.body.name;
  var clientSecret = req.body.clientSecret;
  //insecure: should validate that they are URLs with complete path
  //See: https://tools.ietf.org/html/RFC6749#3.1.2.2
  var redirectURIs = req.body.redirectURIs;
  var trusted = req.body.trusted;

  var options = {};
  if (name)
    options.name = name;
  if (clientSecret)
    options.clientSecret = clientSecret;
  if (redirectURIs) {
    options.redirectURIs = redirectURIs.split(';');
  }
  if (trusted) {
    options.trusted = trusted;
  }

  Client.findOneAndUpdate({ clientID: clientID }, options, function (err, client) {
    if (client == null) err = 'Client not found';
    if (err) {
      return util.renderError(req, res, err, 'error');
    }
    else {
      return util.renderMessage(req, res, null, 204);
    }
  });
}

function getClient(req, res) {
  var clientID = req.params.clientID;
  Client.findOne({ clientID: clientID }, function (err, client) {
    if (err) return util.renderError(req, res, err, 'error');
    return renderClient(req, res, client);
  });
}

function deleteClient(req, res) {
  var clientID = req.params.clientID;

  Client.findOneAndRemove(
    { clientID: clientID },
    function (err, client) {
      if (err) return util.renderError(req, res, err, 'error');
      return util.renderMessage(req, res, "Successfully Deleted.", 200);
    });
}

function createClient(req, res) {
  var clientID = req.body.clientID;
  var redirectURIs = req.body.redirectURIs;
  var trusted = req.body.trusted;

  Client({
    clientID: clientID,
    name: req.body.name,
    clientSecret: req.body.clientSecret,
    redirectURIs: redirectURIs.split(';'),
    trusted: trusted
  }).save(function (err, client, numAffected) {
    if (err) return util.renderError(req, res, err, 'error');
    return renderClient(req, res, client);
  });
}

function getClients(req, res) {
  var clientID = req.params.clientID;
  Client.find({}, function (err, clients) {
    if (err) return util.renderError(req, res, err, 'error');
    return renderClients(req, res, clients);
  });
}

function renderClient(req, res, client) {
  if (!client)
    return util.renderMessage(req, res, "Client Not Found.", 404);
  return res.format({
    //if accept: text/html render a page
    'text/html': function () {
      res.render('client', {
        user: req.user,
        client: client
      });
    },
    //if json: render a json response
    'application/json': function () {
      res.status(200).send({ client });
    },
    //other formats are not supported
    'default': function () {
      res.status(406).send("Not Acceptable");
    }
  });
}

function renderClients(req, res, clients) {
  if (!clients || clients.length == 0)
    return util.renderMessage(req, res, "No Clients Found.", 404);
  return res.format({
    //if accept: text/html render a page
    'text/html': function () {
      res.render('clients', {
        user: req.user,
        clients: clients
      });
    },
    //if json: render a json response
    'application/json': function () {
      res.status(200).send({ clients });
    },
    //other formats are not supported
    'default': function () {
      res.status(406).send("Not Acceptable");
    }
  });
}

exports = module.exports = {
  updateClient: updateClient,
  deleteClient: deleteClient,
  getClient: getClient,
  createClient: createClient,
  getClients: getClients
};

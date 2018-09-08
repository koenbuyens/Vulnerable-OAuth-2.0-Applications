var express = require('express');
var router = express.Router();
var clientcontroller = require('../controllers/clientcontroller.js');
var auth = require('../middlewares/auth');

/*************************************
* Functionality for OAuth Clients    *
**************************************/
//update an OAuth client; vulnerability: direct object reference
router.put('/:clientID', auth.ensureLoggedIn, clientcontroller.updateClient);
router.post('/:clientID', auth.ensureLoggedIn, clientcontroller.updateClient);
//delete an OAuth client; vulnerability: direct object reference
router.delete('/:clientID', auth.ensureLoggedIn, clientcontroller.deleteClient);
//get info about an OAuth client; vulnerability: direct object reference
router.get('/:clientID', auth.ensureLoggedIn, clientcontroller.getClient);

/*************************************
* Administrative functionality       *
**************************************/
//create an OAuth Client; vulnerability: privilege escalation; accessible to all users
router.post('/', auth.ensureLoggedIn, clientcontroller.createClient);
//get a list of OAuth Clients; vulnerability:  privilege escalation; accessible to all users
router.get('/', auth.ensureLoggedIn, clientcontroller.getClients);

module.exports = router;

var express = require('express');
var router = express.Router();
var usercontroller = require('../controllers/usercontroller');
var auth = require('../middlewares/auth');

/**
* Gets profile information
**/

/**
* Renders the register view (register.jade)
**/
router.get('/register', function(req, res){
  res.render('register', {})
});


/*************************************
* Anonymous functionality            *
**************************************/
//Creates a user - no AuthN needed as this is used for registration
router.post('/', usercontroller.createProfile);

/*************************************
* Authenticated User functionality   *
**************************************/
//vulnerability (for all 3 routes): direct object reference
//gets a user profile if the user is authenticated
router.get('/:name', auth.ensureLoggedIn, usercontroller.getProfile );
//updates a user profile if the user is authenticated
router.put('/:name', auth.ensureLoggedIn, usercontroller.updateProfile);
router.post('/:name', auth.ensureLoggedIn, usercontroller.updateProfile);
//deletes a user profile if the user is authenticated
router.delete('/:name', auth.ensureLoggedIn, usercontroller.deleteProfile);

/*************************************
* Administrative functionality       *
**************************************/
//Gets a list of users; vulnerability: accessible to regular users
router.get('/', auth.ensureLoggedIn, usercontroller.getUsers);


module.exports = router;

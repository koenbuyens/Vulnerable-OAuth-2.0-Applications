var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config/config.json');

//An AuthZ code has a client, a user, a code, a redirectURI it was delivered at and a scope
var authorizationCodeSchema = new Schema({
  clientID: {type: String, ref: 'Client', required:true},
  user: {type: String, ref: 'User', required:true},
  code: {type: String, index: {unique: true}, required:true},
  redirectURI: {type: String},
  scope: {type: String, required: false}
});


var AuthorizationCode = mongoose.model('AuthorizationCode', authorizationCodeSchema);
module.exports = AuthorizationCode;

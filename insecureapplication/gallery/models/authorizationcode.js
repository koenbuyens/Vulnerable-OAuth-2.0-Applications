const mongoose = require('mongoose');
let Schema = mongoose.Schema;

// An AuthZ code has a client, a user, a code, a redirectURI it
// was delivered at and a scope
let authorizationCodeSchema = new Schema({
  clientID: {type: String, ref: 'Client', required: true},
  user: {type: String, ref: 'User', required: true},
  code: {type: String, index: {unique: true}, required: true},
  redirectURI: {type: String},
  scope: {type: String, required: false},
});


let AuthorizationCode = mongoose.model(
    'AuthorizationCode',
    authorizationCodeSchema
);
module.exports = AuthorizationCode;

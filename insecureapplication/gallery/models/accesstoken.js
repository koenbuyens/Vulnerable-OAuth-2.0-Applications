var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config/config.json')

var accessTokenSchema = new Schema({
  clientID: {type: String, ref: 'Client', required:true},
  user: {type: String, ref: 'User', required:true},
  //vulnerability: token not stored hashed
  token: {type: String, index: {unique: true}, required:true},
  expires_in: {type: Number},
  created_at: {type: Date},
  scope: {type: String, required: false}
});

accessTokenSchema.pre('save', function(next) {
  //update creation date
  var currentDate = new Date();
  if (!this.created_at)
    this.created_at = currentDate;
  if(!this.expires_in) {
    this.expires_in = config.token.access.expires_in
  }
  next();
});

accessTokenSchema.methods.isExpired = function() {
  var currentDate = new Date();
  return (currentDate.getTime()/1000) > ((this.created_at.getTime()/1000) + this.expires_in);
}

var AccessToken = mongoose.model('AccessToken', accessTokenSchema);
module.exports = AccessToken;

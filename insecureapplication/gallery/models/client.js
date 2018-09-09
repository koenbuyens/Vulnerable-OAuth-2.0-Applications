const mongoose = require('mongoose');

let Schema = mongoose.Schema;

// const minLength = [20,
// "The value of `{PATH}` (`{VALUE}`) is shorter than the minimum
// allowed length ({MINLENGTH})."
//  ];
let clientSchema = new Schema({
  name: String,
  clientID: {type: String, unique: true, required: true, index: true},
  // vulnerability: clientSecret not stored in a hashed format
  // vulnerability: clientSecret should have sufficient entropy;
  //                this should be enforced
  clientSecret: {type: String, required: true},
  trusted: {type: Boolean, default: false},
});
clientSchema.methods.isTrusted = function() {
  return this.trusted;
};

clientSchema.statics.serializeClient = function() {
  return function(client, done) {
    return done(null, client.clientID);
  };
};
clientSchema.statics.deserializeClient = function() {
  return function(clientID, done) {
    Client.findOne({clientID: clientID},
        function(err, client) {
          if (err) {
            return done(err);
          }
          return done(null, client);
        }
    );
  };
};

clientSchema.methods.verifyClientSecretSync = function(clientSecret) {
  return (this.clientSecret === clientSecret);
};

let Client = mongoose.model('Client', clientSchema);
module.exports = Client;

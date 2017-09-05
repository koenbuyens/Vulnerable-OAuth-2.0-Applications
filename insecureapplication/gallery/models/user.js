var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose'); //takes care of salting and hashing

var Schema = mongoose.Schema;

var userSchema = new Schema({
    name: {type: String, unique: true, required: true, index: true},
    created_at: Date,
    updated_at: Date,
    email: {type: String, unique: true, required: true},
    pictures: [{type: Schema.Types.ObjectId, ref: 'Image'}]
});
//insecure, configure passwordValidator and give as option
userSchema.plugin(passportLocalMongoose);

var MyImage = require('./image')

//links an image to a user
userSchema.methods.images = function(done) {
  return MyImage.find({userid: this._id}, done);
}

userSchema.pre('save', function(next) {
  //update creation dates
  var currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at)
    this.created_at = currentDate;
  next();
});

var User = mongoose.model('User', userSchema);
module.exports = User;

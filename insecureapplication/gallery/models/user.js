const mongoose = require('mongoose');
// takes care of salting and hashing
const passportLocalMongoose = require('passport-local-mongoose');

let Schema = mongoose.Schema;

let userSchema = new Schema({
  name: {type: String, unique: true, required: true, index: true},
  created_at: Date,
  updated_at: Date,
  email: {type: String, unique: true, required: true},
  pictures: [{type: Schema.Types.ObjectId, ref: 'Image'}],
});
userSchema.set('toJSON', {virtuals: false});

// insecure, configure passwordValidator and give as option
userSchema.plugin(passportLocalMongoose);

const MyImage = require('./image');
const MyAlbum = require('./album');

userSchema.virtual('albums').
    get(function() {
      return MyAlbum.find({user: this._id});
    });

// links an image to a user
userSchema.methods.images = function(done) {
  return MyImage.find({userid: this._id}, done);
};

userSchema.pre('save', function(next) {
  // update creation dates
  let currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at) {
    this.created_at = currentDate;
  }
  next();
});

let User = mongoose.model('User', userSchema);
module.exports = User;

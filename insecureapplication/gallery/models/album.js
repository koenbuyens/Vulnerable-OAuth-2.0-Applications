const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let albumSchema = new Schema({
  name: {type: String, unique: true, required: true, dropDups: true},
  description: String,
  created_at: Date,
  updated_at: Date,
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  pictures: [{type: Schema.Types.ObjectId, ref: 'Image'}],
});

albumSchema.pre('save', function(next) {
  // update creation dates
  let currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at) {
    this.created_at = currentDate;
  }
  next();
});

let MyAlbum = mongoose.model('Album', albumSchema);
module.exports = MyAlbum;

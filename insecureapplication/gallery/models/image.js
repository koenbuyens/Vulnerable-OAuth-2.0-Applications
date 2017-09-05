var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var imageSchema = new Schema({
    url:String,
    description: String,
    created_at: Date,
    updated_at: Date,
    userid: String
});
imageSchema.pre('save', function(next) {
  //update creation dates
  var currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at)
    this.created_at = currentDate;
  next();
});

var MyImage = mongoose.model('Image', imageSchema);
module.exports = MyImage;

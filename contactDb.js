const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Use native mongoose Promises (http://mongoosejs.com/docs/promises.html)
mongoose.Promise = global.Promise;

// Schemas exclude id since they are automatically generated
// Schema for contact form
const contactSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    tweet1: String,
    tweet2: String,
    tweet3: String,
    background: String
});

// Schema for saved images
const imageSchema = new Schema({
    tweet: Object,
    tweetSig: Object,
    image: Object,
    oauth: Object
});

var contact = mongoose.model("ContactModel", contactSchema, 'inspire');
var image = mongoose.model("ImageModel", imageSchema, 'inspire');

// Create database model
module.exports = {
    getModel: (connection, name) => {
        // Uses two separate models to store different schemas in same collection
        if (name == "image") {
            return connection.model("ImageModel", imageSchema, 'inspire');
        } else {
            return connection.model("ContactModel", contactSchema, 'inspire');
        };
    }
};
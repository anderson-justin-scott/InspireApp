const mongoose = require('mongoose');
const md5 = require('md5');
const credentials = require("./credentials.js");

const dbUrl = 'mongodb://' + credentials.host + ':27017/' + credentials.database;
const connection = mongoose.createConnection(dbUrl);

const ContactDb = require('./contactDb.js');
const Contact = ContactDb.getModel(connection, "contact");
const Image = ContactDb.getModel(connection, "image");

// Navigate home
module.exports.home =
    (req, res, next) => {
        res.render('inspire', { controller: "inspireController", initialize: "getImages()" });
    };

// Set hash of oAuth credentials in user's cookie
module.exports.startSession =
    (req, res, next) => {
        // Get user's Oauth hash to find appropriate images
        let oAuthCreds = req.body.oAuthId;

        // Create a hash of the client's hash for obfuscated identification purposes
        let oAuthCreds_hash = md5(oAuthCreds);

        // Cookie stays alive for one day
        res.cookie('oauthCookie', oAuthCreds_hash, { maxAge: 1000 * 60 * 60 * 24 });
        res.send();
    };

// Navigate to email me page
module.exports.emailMe =
    (req, res, next) => {
        res.render('emailMe', { controller: "formController", initialize: "" });
    };

// Save contact
module.exports.saveContact =
    (req, res, next) => {
        // Create document object using request body contents
        let contact = new Contact({
            firstName: req.body.fname,
            lastName: req.body.lname,
            email: req.body.email,
            tweet1: req.body.tweet1,
            tweet2: req.body.tweet2,
            tweet3: req.body.tweet3,
            background: req.body.background
        });

        // Regular expression validates names and twitter handles
        let regexName = /^[a-z ,.'-]+$/i;
        let regexTweet = /^@?(\w){1,15}$/;

        // Validate form before saving to database
        if (regexName.test(contact.firstName) &&
            regexName.test(contact.lastName) &&
            regexTweet.test(contact.tweet1) &&
            (regexTweet.test(contact.tweet2) || contact.tweet2 == '') &&
            (regexTweet.test(contact.tweet3) || contact.tweet3 == '')) {

            // MongoDB save function will update or insert new contact
            contact.save((err) => {
                if (err) {
                    console.log("Error: %s ", err);
                    res.redirect('/submitError');
                } else {
                    // Successfully added contact info to database
                    res.render('contactAdded', { controller: "formController", initialize: "validInput()" });
                    console.log("Contact saved");
                };
            });
        } else {
            // Display message for invalid form input
            res.render('contactAdded', { controller: "formController", initialize: "invalidInput()" });
        };
    };

// Save tweet and image
module.exports.savedImages =
    (req, res, next) => {
        // Get oauth hash from cookie
        let oAuthCreds = req.cookies.oauthCookie;

        // Create document object using request body contents
        let image = new Image({
            tweet: req.body.tweet,
            tweetSig: req.body.tweetSig,
            image: req.body.image,
            oauth: oAuthCreds
        });

        // Regex for MD5 hash
        let regexOAuth = /^[a-f0-9]{32}$/i;

        // Ensure oAuthCreds are a valid MD5 hash
        if (regexOAuth.test(oAuthCreds)) {
            image.save((err) => {
                if (err) {
                    console.log("Error: %s ", err);
                    res.redirect('/saveError');
                } else {
                    // Successfully added contact info to database
                    res.render('inspire', { controller: "inspireController", initialize: "" });
                    console.log("Image saved");
                };
            });
        }
    };


// Pass JSON with saved images
module.exports.sendSavedImages =
    (req, res, next) => {
        // Access cookie credentials to find appropriate images
        let oAuthCreds = req.cookies.oauthCookie;

        // Regex for MD5 hash
        let regexOAuth = /^[a-f0-9]{32}$/i;

        // Ensure oAuthCreds are a valid MD5 hash
        if (regexOAuth.test(oAuthCreds)) {

            // Check oauth ID to find saved images associated with user 
            Image.find({ oauth: oAuthCreds }, (err, results) => {
                if (err) {
                    console.log("Error Selecting : %s ", err);
                }
                // If null, render 404
                if (!results) {
                    return res.render('404');
                }

                // Prevent caching so the client asks for new images each time
                res.set('Cache-Control', 'no-cache');

                // Send JSON with images key
                res.json({ images: results });
            });
        }
    };

// Display saved images
module.exports.displaySavedImages =
    (req, res, next) => {
        // Prevent caching so the client asks for new images each time
        res.set('Cache-Control', 'no-cache');

        // Load savedImages page with appropriate values passed to AngularJS
        res.render('savedImages', { controller: "savedImagesController", initialize: "getSavedImages()" });
    };

// Deletes image specified in GET request
module.exports.deleteImage =
    (req, res, next) => {
        // Access cookie credentials to find user in database
        let oAuthCreds = req.cookies.oauthCookie;

        // Access querystring to get image ID
        let imageId = req.query._id;

        // Regex for MD5 hash and MongoDB ID format
        let regexOAuth = /^[a-f0-9]{32}$/i;
        let regexMongoId = /^[a-f\d]{24}$/i;

        // Ensure oAuthCreds MD5 hash and MongoDB ID are valid
        if (regexOAuth.test(oAuthCreds) &&
            regexMongoId.test(imageId)) {

            // Delete image based on user oauth hash and image ID
            Image.findOneAndRemove({ "_id": imageId, "oauth": oAuthCreds }, (err, results) => {
                if (err) {
                    // Render page with error message
                    res.render('savedImages', { controller: "savedImagesController", initialize: "deleteError()" });
                    console.log(err);
                } else {
                    // Load savedImages page with appropriate values passed to AngularJS
                    res.render('savedImages', { controller: "savedImagesController", initialize: "deleteSuccess()" });
                    console.log("Image deleted");
                };
            });
        }
    }

// Create Flickr API using Flickr API
module.exports.flickrAPI =
    (req, res, next) => {
        var Flickr = require('flickrapi'),
            flickrOptions = {
                api_key: 'dd22ed502d5b3cad8f4d5c271c399997',
                secret: 'db53873aad6e48e9'
            };
        Flickr.tokenOnly(flickrOptions, function(error, flickr) {
            flickr.photos.search({
                tags: 'Nature Landscapes',
                per_page: 80,
                format: 'json'
            }, function(err, result) {
                try {
                    res.json(result);
                    console.log('Result [%s]', JSON.stringify(result));
                } catch (error) {
                    console.log('ERROR [%s]', JSON.stringify(error));
                }
            });
        });
    };

// Create RESTful Twitter API using twitter API
module.exports.twitterAPI =
    (req, res, next) => {
        // Callback functions
        var error = function(err, response, body) {
            console.log('ERROR [%s]', JSON.stringify(err));
        };
        var success = function(data) {
            res.json(data);
            console.log('Data [%s]', data);
        };

        var Twitter = require('twitter-node-client').Twitter;

        var config = {
            "consumerKey": "ms4k5i3rb7wsbT5thwhGuhstn",
            "consumerSecret": "lISILgxpYAkZB1PZEvQR8JNEQsNCNtJn4UQ0aspbT8uXHLl8ly",
            "accessToken": "2882092019-Z5u8NYVz2SmlRuLVrKsvPxb7A6Tsp3pv1aK1gwM",
            "accessTokenSecret": "aDCrWBXhbtffkSgPFQw1xL9ZwNNil5LjxUm8gpKRsEVSC",
            "callBackUrl": "https://oauth.io/auth"
        };

        var twitter = new Twitter(config);

        // User get querystring to find user
        twitter.getUserTimeline({
            screen_name: req.query.handle,
            count: 100,
            exclude_replies: true,
            include_rts: false
        }, error, success);
    };
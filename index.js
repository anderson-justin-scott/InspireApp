const express = require('express');
const bodyParser = require('body-parser');
const handlebars = require('express-handlebars');
const cookieParser = require('cookie-parser');

const app = express();

const router = express.Router();

// Set up handlebars view engine
app.engine('handlebars', handlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Static resources
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

// Import file with all functions
const twitterModule = require('./twitterModule.js');

// Import functions
const home = twitterModule.home;
const startSession = twitterModule.startSession;
const emailMe = twitterModule.emailMe;
const saveContact = twitterModule.saveContact;
const savedImages = twitterModule.savedImages;
const sendSavedImages = twitterModule.sendSavedImages;
const displaySavedImages = twitterModule.displaySavedImages;
const deleteImage = twitterModule.deleteImage;
const flickrAPI = twitterModule.flickrAPI;
const twitterAPI = twitterModule.twitterAPI;

// Configure router
router.get('/', (req, res, next) => {
    res.redirect('/inspire');
});

// Main page
router.get('/inspire', home);

// Get oauth ID from client to start session
router.post('/inspire/savedimages', startSession);

// Save images
router.post('/inspire', savedImages);

// Contact me form
router.get('/inspire/emailme', emailMe);
router.post('/inspire/emailme', saveContact);

// Display saved images
router.get('/inspire/savedimages.json', sendSavedImages);
router.get('/inspire/savedimages', displaySavedImages);

// Delete image
router.get('/inspire/savedimages/delete', deleteImage);

// Flickr service
router.get('/inspire/api/flickr', flickrAPI);

// Twitter service
router.get('/inspire/api/twitter', twitterAPI);

// Use router
app.use('/', router);

app.use((req, res) => {
    res.status(404);
    res.render('404', { controller: "", initialize: "" });
});

app.listen(3000, () => {
    console.log('http://localhost:3000');
})
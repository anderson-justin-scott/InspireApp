// Helper gives AngularJS separate syntax for model to differentiate from Handlebars model
inspireModule.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});

inspireModule.controller('inspireController', function($scope, $http, $resource, $q, $filter, $sanitize, twitterService, md5) {

    $scope.tweets = []; // array of tweets
    $scope.tweet = {}; // single tweet object
    $scope.tweetText = '';
    $scope.handle = 'realdonaldtrump';
    $scope.tweetSignature = ''; // Tweet combined with sig for view
    $scope.connectedTwitter = false;

    $scope.photos = [];
    $scope.photo = {};
    $scope.photoUrl = '';
    $scope.checkboxBackground = false;

    $scope.prevSelections = []; // Array of previously loaded entries
    $scope.currSelection = {}; // Currently selected image/tweet
    $scope.index = 0;
    $scope.hideNext = true;
    $scope.hideBack = true;
    $scope.hideSave = false;

    $scope.submitButton = 'Inspired';

    $scope.oAuthId = '';

    twitterService.initialize();

    $scope.connectButton = function() {
        twitterService.connectTwitter().then(function() {
            if (twitterService.isReady()) {
                // If authorization successful, hide connect button and show tweet
                $('#connectButton').fadeOut(function() {
                    $('#getTimelineButton, #onSubmitButton, #savedImagesButton, #signOut').fadeIn();
                    $scope.refreshTimeline();
                    $scope.connectedTwitter = true;

                    // Grab image info from local storage and hash before passing to server
                    $scope.oAuthId = window.localStorage.getItem('oauthio_provider_twitter');
                    $scope.oAuthId = md5.createHash($scope.oAuthId);

                    // Pass oauth token to web server for duration of session
                    $.post('/inspire/savedimages', { oAuthId: $scope.oAuthId });
                });
            } else {
                // Replaces welcome message with error message if connection fails
                $('#welcome').text("There was an error connecting to Twitter. Please refresh the page.");
            }
        })
    };

    $scope.getImages = function() {
        // Used to swap search according to toggle selection
        $scope.flickrSearch = ($scope.checkboxBackground != true) ? 'Nature Landscapes' : 'Decrepit';
        $scope.submitButton = ($scope.checkboxBackground != true) ? 'Inspired' : 'Demotivated';
        // Calls flickr API using key
        $http.jsonp(
            ' https://api.flickr.com/services/rest/?method=flickr.photos.search', {
                params: {
                    api_key: 'dd22ed502d5b3cad8f4d5c271c399997',
                    tags: $scope.flickrSearch,
                    per_page: 80,
                    format: 'json',
                    jsoncallback: 'JSON_CALLBACK'
                }
            }).success(function(data, status, headers, config) {
            console.log(data);
            // Store retrieved photos in array
            $scope.photos = data.photos;
            $scope.randomImage();
        });
    };

    $scope.randomImage = function() {
        // Cycle through photos using array length
        $scope.photo = $scope.photos.photo[Math.floor(Math.random() * ($scope.photos.photo.length - 1))];

        $scope.getPhotoUrl();
        $scope.overlayText();
    };

    $scope.randomTweet = function() {
        // Cycle through tweets array
        $scope.tweet = $scope.tweets[Math.floor(Math.random() * ($scope.tweets.length - 1))];
        $scope.getTweetSig();
    };

    $scope.overlayText = function() {
        // Configures background and places text over it
        $scope.textOverlay = {
            background: 'url(' + $scope.photoUrl + ')',
            'background-repeat': 'no-repeat'
        };
    };

    $scope.backBtn = function() {
        lastIndex = parseInt(window.localStorage.getItem('lastIndex'));

        // Set index to appropriate starting point when back button first pressed
        if (($scope.index - 1) == lastIndex) {
            $scope.index -= 1;
        }

        // Check to see if array filled
        // else, ensure index does not go below zero
        if ($scope.prevSelections.length == 10) {
            // Allow back to be pressed until arriving at last index
            if (($scope.index - 2) != lastIndex) {
                // Cycle through array until back at last index
                $scope.index = (($scope.index - 1) + 10) % 10;
                $scope.getContent($scope.index);
            } else {
                $scope.index = (($scope.index - 1) + 10) % 10;
                $scope.getContent($scope.index);
                $scope.hideBack = true;
            };

        } else {
            // Allow next to be pressed until arriving at last index
            if ($scope.index > 1) {
                $scope.index -= 1;
                $scope.getContent($scope.index);
            } else {
                $scope.index -= 1;
                $scope.getContent($scope.index);
                $scope.hideBack = true;
            };

        };

        // Show next button whenever back button pressed
        $scope.hideNext = false;

        // Reset save button after changing image
        $scope.hideSave = false;
    };

    $scope.nextBtn = function() {
        lastIndex = parseInt(window.localStorage.getItem('lastIndex'));
        // If index is not equal to last index and last index exists then move forward in array
        // at end of array disable next button
        if (($scope.index + 1) != lastIndex) {
            $scope.index = ($scope.index + 1) % ($scope.prevSelections.length - 1);
            $scope.getContent($scope.index);
            $scope.hideBack = false;
        } else {
            $scope.index = ($scope.index + 1) % ($scope.prevSelections.length - 1);
            $scope.getContent($scope.index);
            $scope.index += 1;
            $scope.hideNext = true;
        }

        // Reset save button after changing image
        $scope.hideSave = false;
    };

    // Creates tweet signature using tweet object
    $scope.getTweetSig = function() {
        $scope.tweetText = $scope.tweet.text;
        // Remove URLs
        $scope.tweetText = $scope.tweetText.replace(/https:[a-zA-Z0-9\-\.\/]{1,}/g, '');
        $scope.tweetSignature = '<q><i>' + $scope.tweetText + '</i></q>' + '<br/> - ' + $filter('titlecase')($scope.tweet.user.name);
        $scope.tweeSignature = $sanitize($scope.tweetSignature);
    };

    $scope.getPhotoUrl = function() {
        // Generate URL for photo using photo object properties
        $scope.photoUrl = 'https://farm' + $scope.photo.farm + '.staticflickr.com/' +
            $scope.photo.server + '/' + $scope.photo.id + '_' + $scope.photo.secret + '_b.jpg';
    };

    $scope.getContent = function(index) {
        // Using last index, load content
        $scope.tweet = $scope.prevSelections[index].tweet;
        $scope.getTweetSig();

        $scope.photo = $scope.prevSelections[index].photo;
        $scope.getPhotoUrl();
        $scope.overlayText();

        $scope.handle = $scope.prevSelections[index].search;
    }

    // Get array of tweets and array of Flickr images
    $scope.refreshTimeline = function(handle) {
        // Load tweets
        twitterService.getLatestTweets($scope.handle).then(function(data) {
            // Clear previous tweets
            $scope.tweets = [];
            // Combine arrays
            $scope.tweets = $scope.tweets.concat(data);
            // Load initial tweet and image
            $scope.onSubmit();
        }, function() {
            $scope.rateLimitError = true;
        });
    };

    $scope.onSubmit = function() {
        // If tweets array empty (loaded from local storage) load images and tweets arrays
        // else get new tweet/image combo
        if ($scope.tweets.length == 0) {
            $scope.refreshTimeline();
        } else {
            // Cycle images
            $scope.randomImage();
            // Cycle tweets
            $scope.randomTweet();

            // Saves last 10 entries
            if ($scope.prevSelections.length < 10) {
                $scope.prevSelections.push({
                    index: $scope.index,
                    tweet: $scope.tweet,
                    photo: $scope.photo,
                    search: $scope.handle
                });
            } else {
                // If 10 entries in prevSelections, replace oldest item
                $scope.prevSelections[$scope.index] = ({
                    index: $scope.index,
                    tweet: $scope.tweet,
                    photo: $scope.photo,
                    search: $scope.handle
                });
            }

            // If more than one image available, show back button
            if ($scope.prevSelections.length > 1) {
                $scope.hideBack = false;
            }

            // Reset save button after changing image
            $scope.hideSave = false;

            // Save last index to local storage
            window.localStorage.setItem('lastIndex', $scope.index);

            // Update index
            $scope.index = ($scope.index + 1) % 10;

            // Update local storage
            window.localStorage.setItem('inspire', JSON.stringify($scope.prevSelections));
        }
    };

    $scope.saveBtn = function() {
        var image = { tweet: $scope.tweet, tweetSig: $scope.tweetSignature, image: $scope.textOverlay, oauth: $scope.oAuthId };

        // jQuery post saves image object to database
        // NOTE: database will not create a new entry if an equivalent entry exists
        $.post('/inspire', image);

        // Disable save button for image
        $scope.hideSave = true;
    };

    $scope.getSavedImages = function() {
        window.location.href = '/inspire/savedimages';
    };

    // Clear OAuth cache and user can reauthenticate
    $scope.signOut = function() {
        twitterService.clearCache();
        $scope.tweets.length = 0;
        $('#getTimelineButton, #onSubmitButton, #savedImagesButton, #signOut').fadeOut(function() {
            $('#connectButton').fadeIn();
            $scope.hideNext = true;
            $scope.$apply(function() {
                $scope.connectedTwitter = false;
            })
        });
    };

    // If user is returning, hide sign in button and display tweet
    if (twitterService.isReady()) {
        $('#connectButton').hide();
        $('#getTimelineButton, #onSubmitButton, #savedImagesButton, #signOut').show();
        $scope.connectedTwitter = true;


        // If available, load from local storage at last tweet and image
        if (window.localStorage.getItem('inspire') != null) {
            $scope.prevSelections = JSON.parse(window.localStorage.getItem('inspire'));

            // If more than one item in array, show back button
            if ($scope.prevSelections.length > 1) {
                $scope.hideBack = false;
            }

            // Find last index before page reload
            $scope.index = parseInt(window.localStorage.getItem('lastIndex'));

            // Display content from before refresh
            $scope.getContent($scope.index);

            // Update index
            $scope.index = ($scope.index + 1) % 10;

        } else {
            // If page reloaded and local storage key not found, grab new images
            $scope.refreshTimeline();
        }
    };

});

inspireModule.controller('savedImagesController', function($scope, $http, $sanitize) {
    $scope.savedImages = [];
    $scope.tweet = '';
    $scope.tweetSignature = '';
    $scope.textOverlay = '';
    $scope.noSavedImages = false;
    $scope.hideBack = true;
    $scope.hideNext = false;

    $scope.message = 'No saved images could be found! Use the save button to save some images.';
    $scope.error = false;

    $scope.index = 0;
    $scope.totalImages = 0;

    $scope.getSavedImages = function() {
        // Get images from web server
        $.getJSON('/inspire/savedimages.json', function(res) {
            // Load images from JSON
            $scope.savedImages = res.images;

            console.log($scope.savedImages);

            // If one or no images disable next button
            if ($scope.savedImages <= 1) {
                $scope.hideNext = true;
            };

            $scope.showSavedImages();
        });
    };

    $scope.showSavedImages = function() {
        // If no saved images found, display message
        if ($scope.savedImages.length == 0) {
            $scope.noSavedImages = true;
            $scope.$apply();
        } else {
            // Update counter with number of saved images
            $scope.totalImages = $scope.savedImages.length;

            $scope.getNewImage();

            // Force refresh after loading JSON
            $scope.$apply();
        };
    };

    $scope.getNewImage = function() {
        // Displays saved image
        $scope.tweet = $scope.savedImages[$scope.index].tweet;
        $scope.tweetSignature = $scope.savedImages[$scope.index].tweetSig;
        $scope.tweetSignature = $sanitize($scope.tweetSignature);
        $scope.textOverlay = $scope.savedImages[$scope.index].image;
    };

    $scope.nextBtn = function() {
        // Cycles through saved images until reaching the end of saved Images array
        if ($scope.index < ($scope.totalImages - 1)) {
            $scope.index += 1;
            $scope.getNewImage();
            $scope.hideBack = false;
        } else {
            $scope.hideNext = true;
        };
    };

    $scope.backBtn = function() {
        // Cycles through saved images until reaching the beginning of saved Images array
        if ($scope.index > 0) {
            $scope.index -= 1;
            $scope.getNewImage();
            $scope.hideNext = false;
        } else {
            $scope.hideBack = true;
        };
    };

    $scope.deleteBtn = function() {
        // Cookie will be checked by server to ensure appropriate user is requesting delete
        // Get ID of image being deleted
        let imageId = $scope.savedImages[$scope.index]._id;

        // Remove from images array
        $scope.savedImages.splice($scope.index, 1);

        // Send GET request with ID in querystring
        $http({
            url: '/inspire/savedimages/delete',
            method: "GET",
            params: { _id: imageId }
        }).then(function() {
            $scope.deleteSuccess();
        });
    };

    $scope.deleteError = function() {
        // Set appropriate flash message
        $scope.message = 'There was an error deleting the image.';
        // Display error flash
        $scope.noSavedImages = true;

        // Change flash button to redirect to saved images
        $scope.error = true;
    };

    $scope.deleteSuccess = function() {
        // Change flash message and hide image
        $scope.message = 'Message successfully deleted.'
        $scope.noSavedImages = true;

        // Close flash box to redirect to reload saved images
        $scope.error = true;
    };

    $scope.redirectToHome = function() {
        window.location.href = '/inspire';
    };

    $scope.redirectToSavedImages = function() {
        window.location.href = '/inspire/savedimages';
    };
});

inspireModule.controller('formController', function($scope, $http, $resource) {
    // Model for contact object
    $scope.contact = {
        fname: '',
        lname: '',
        email: '',
        tweet1: '',
        tweet2: '',
        tweet3: '',
        background: 'Motivational'
    };

    // Regular expression validates names and twitter handles
    $scope.regexName = /^[a-z ,.'-]+$/i;
    $scope.regexTweet = /^@?(\w){1,15}$/;

    // Change out message depending on server response
    $scope.validInput = function() {
        $scope.message = 'Thanks for signing up! You should start seeing new inspirational quotes every day.';
    };

    $scope.invalidInput = function() {
        $scope.message = 'Your form contained invalid input. Please follow prompts in form.'
    };
});

// Filters twitter user's name to use titlecase
inspireModule.filter('titlecase', function() {
    return function(value) {
        if (angular.isString(value)) {
            return value.toLowerCase().replace(/\b([a-z])/g, function(char) {
                return char.toUpperCase();
            });
        } else {
            return value;
        };
    };
});
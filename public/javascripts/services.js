// Services developed with documentation from https://www.sitepoint.com/building-twitter-app-using-angularjs/
// This module handles communication with OAuth.io
angular.module('twitterApp.services', []).factory('twitterService', function($q) {

    var authorizationResult = false;

    return {
        initialize: function() {
            //initialize OAuth.io with public key of the application
            // Consumer API key 'W3I5kRmABBrbDsZlm0tkIzhiC' - CS602
            OAuth.initialize('VR4TowsrofAWe8a5XC8LylXYorM', {
                cache: true
            });
            // Create an authorization result when the page loads
            authorizationResult = OAuth.create("twitter");
        },
        isReady: function() {
            return (authorizationResult);
        },
        connectTwitter: function() {
            var deferred = $q.defer();
            // Popup window asks user to connect to twitter account
            OAuth.popup("twitter", {
                cache: true
            }, function(error, result) {
                // cache means to execute the callback if the tokens are already present
                if (!error) {
                    authorizationResult = result;
                    deferred.resolve();
                }
            });
            return deferred.promise;
        },
        clearCache: function() {
            OAuth.clearCache('twitter');
            authorizationResult = false;
        },
        // Get specified tweets
        getLatestTweets: function(handle) {
            //create a deferred object using Angular's $q service
            var deferred = $q.defer();
            var url = '/1.1/statuses/user_timeline.json';

            // Converts handle to http encoding
            var encodedHandle = encodeURI(handle);

            // If user was specified, search their screen name and return 20 tweets
            if (true) {
                url += '?screen_name=' + encodedHandle + '&count=100&exclude_replies=true&include_rts=false';
            }
            var promise = authorizationResult.get(url).done(function(data) {
                // https://dev.twitter.com/docs/api/1.1/get/statuses/home_timeline
                // when the data is retrieved resolve the deferred object
                deferred.resolve(data);
            }).fail(function(err) {
                deferred.reject(err);
            });

            //return the promise of the deferred object
            return deferred.promise;
        }
    }
});
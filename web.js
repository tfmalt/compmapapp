/*global node: true */
/**
 * Web app for the competency map system
 * 
 * @author Thomas Malt <thomas.malt@startsiden.no>
 */
 var async   = require('async');
 var express = require('express');
 var util    = require('util');
 var u       = require('underscore');
 var routes  = require('./routes');

// create an express webserver
var app = express();

app.configure(function () {
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.cookieParser());

    app.use(express.cookieSession({
        secret: process.env.SESSION_SECRET || 'compmap'
    }));

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);

    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    app.use(express.static(__dirname + '/public'));
});

// Sets up the facebook integration
// app.use(require('faceplate').middleware({
//    app_id:process.env.FACEBOOK_APP_ID,
//    secret:process.env.FACEBOOK_SECRET,
//    scope: 'user_likes,user_photos,user_photo_video_tags'
// }));

// listen to the PORT given to us in the environment
var port = process.env.PORT || 3000;

app.listen(port, function () {
    "use strict";
    console.log("Listening on " + port);
});

// Routing:
// app.get("/",      routes.index);
// app.get("/admin", routes.admin);
// app.post("/fblogin", routes.fblogin);
// app.post("/fb/loginstatus", routes.fb_loginstatus);
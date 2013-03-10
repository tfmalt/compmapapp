/*global node: true */
/**
 * Web app for the competency map system
 * 
 * @author Thomas Malt <thomas.malt@startsiden.no>
 */

var async                  = require('async'),
    express                = require('express'),
    util                   = require('util'),
    u                      = require('underscore'),
    routes                 = require('./routes'),
    passport               = require('passport'),
    flash                  = require('connect-flash'),
    AtlassianCrowdStrategy = require('passport-atlassian-crowd').Strategy;

var users = [];

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function (user, done) {
    done(null, user.username);
});

passport.deserializeUser(function (username, done) {
    console.log("told to deserialize: ", username, done);
    var user = u.find(users, function (user) {
        return user.username == username;
    });
    if (user === undefined) {
        // done(new Error("No user with username '" + username + "' found."));
        done(null, false);
    } else {
        done(null, user);
    }
});


// Use the AtlassianCrowdStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case a crowd user profile), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new AtlassianCrowdStrategy({
        crowdServer: process.env.CROWD_URL || "https://crowd.startsiden.no/crowd",
        crowdApplication: process.env.CROWD_APP || "compmap",
        crowdApplicationPassword: process.env.CROWD_PASSWORD || "password",
        retrieveGroupMemberships: true
    },
    function (userprofile, done) {
        console.log("Got successful authentication: ", userprofile);
        // asynchronous verification, for effect...
        process.nextTick(function () {
            var exists = u.any(users, function (user) {
                return user.id = userprofile.id;
            });
            if (!exists) {
                users.push(userprofile);
            }

            return done(null, userprofile);
        });
    }
));


// create an express webserver
var app = express();

app.configure(function () {
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.cookieParser());

    app.use(express.cookieSession({
        secret: process.env.SESSION_SECRET || 'compmap'
    }));

    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    app.use(express.static(__dirname + '/public'));
});

// listen to the PORT given to us in the environment
var port = process.env.PORT || 3000;

app.listen(port, function () {
    "use strict";
    console.log("Listening on " + port);
});

// Routing:
app.get("/", ensureAuthenticated, routes.index);
app.get("/login", routes.login);

app.post('/login',
    passport.authenticate('atlassian-crowd', { 
        failureRedirect: '/login', 
        failureFlash: "Invalid username or password."
    }),
    function (req, res) {
        res.redirect('/');
    }
);



function ensureAuthenticated (req, res, next) {
    console.log('is authenticated: ', req.isAuthenticated());
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
}

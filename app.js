// Import necessary modules
const express = require('express');
const http = require('http');
const url = require('url');
const request = require('request');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

// Create Express app
const app = express();
app.use(session({
    secret: process.env.EXPRESS_SESSION_SECRET
}));

// Initalise Passport
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
	done(null, user)
});
passport.deserializeUser(function(user, done) {
    done(null, user)
});

// Set viewing engine to Jade
app.set("view engine", "jade");

// Allow serving of static files from the 'public' directory
app.use(express.static('public'));

// Serve Hello World as project root
app.get('/', (req, res) => res.render('index'));

// Serve logged-in dash page
app.get('/dash', function(req, res) {

    // Parse the raw user profile and retrieve the accounts field
    const user = req.session.user;
    const accs = JSON.parse(req.session.user.profile._raw).accounts;
    console.log("ACCOUNT INFO");
    console.log(accs);

    // Make a balance request
    request({
        url: 'https://api.monzo.com/balance',
        qs: {'account_id': accs[1].id},
        auth: {'bearer': user.accessToken}
    }, function(err, resp, body) {
        // Parse the balance body
        const parsed_body = JSON.parse(body);

        // Render the dashboard
        res.render('dashboard', {
            name: {
                first: user.profile.displayName.split(' ')[0]
            },
            balance: parsed_body['balance']
        });
    });
});

// Configure Monzo Authentication
let MonzoStrategy = require('passport-monzo').Strategy;
passport.use(new MonzoStrategy({
		clientID: process.env.MONZO_CLIENT_ID,
		clientSecret: process.env.MONZO_CLIENT_SECRET,
		callbackURL: 'http://localhost:3000/auth/monzo/callback'
	},
	function (accessToken, refreshToken, profile, done) {
        console.log(profile);
		let user = {
			accessToken: accessToken,
			refreshToken: refreshToken,
			profile: profile
		};
		return done(null, user);
    }
));

// Endpoint for Monzo authentication
app.get('/auth/monzo', passport.authenticate('monzo'));

// Called after succesful authentication
app.get('/auth/monzo/callback',
	passport.authenticate('monzo', {session: true, failureRedirect: '/login_fail'}),
	function(req, res) {
		console.log("AUTH SUCCESSFUL");
		// console.log(req.user);
		req.session.user = req.user;
		res.redirect('/dash');
	}
);

// Listen on Port 3000
app.listen(3000, () => console.log('Listening on Port 3000!'));

// Websocket
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send(1000);
});
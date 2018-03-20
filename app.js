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

// Initialise Passport and define serialization
// TODO: Implement database storage/access
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

// Sends an HTTP request to the specified endpoint for the Monzo API
// and returns a promise
function fetchMonzoData(endpoint, account_id, accessToken) {
    return new Promise(function(resolve, reject) {
        request({
            url: 'https://api.monzo.com/' + endpoint,
            qs: {'account_id': account_id},
            auth: {'bearer': accessToken}
        }, function(err, resp, body) {
            console.log(body);
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
}

// Serve logged-in dash page
app.get('/dash', function(req, res) {

    // Parse the raw user profile and retrieve the accounts field
    const user = req.session.user;
    const accs = JSON.parse(req.session.user.profile._raw).accounts;
    const currentAccount = accs[1];
    console.log("ACCOUNT INFO");
    console.log(accs);

    // Create a promise for a Monzo balance request
    let balance;
    let balancePromise = fetchMonzoData('balance', currentAccount.id, user.accessToken);

    // Promise handling for Monzo data
    balancePromise.then(JSON.parse, () => console.log("Balance Error"))
                  .then(function(result) {
                      // Succesfully fetched a Monzo balance
                      balance = result;
                      // Return a promise for the list of transactions
                      return fetchMonzoData('transactions', currentAccount.id, user.accessToken);
                  })
                  .then(function(data) {
                      // Logging for debug purposes
                      logData(data);

                      // We now have access to both the balance and the transactions list.
                      // Parse the raw JSON to allow extraction of transactions.
                      let transactions = JSON.parse(data).transactions;

                      // Render the dashboard view with all the data it needs
                      res.render('dashboard', {
                          name: {
                              first: user.profile.displayName.split(' ')[0]
                          },
                          balance: toDec(balance.balance),
                          transactions: stripDeposits(transactions)
                      });
                  });
});

const fakeTransactions = require('./transactions');

// Removes deposits and converts negative transaction amounts
// to positive integers
function stripDeposits(transactions) {
    const stripped = [];
    for (let i = 0; i < transactions.length; i++) {
        if (transactions[i].amount < 0) {
            transactions[i].amount = "£" + toDec(transactions[i].amount * -1);
            stripped.push(transactions[i]);
        }
    }
    return fakeTransactions;
}

// Converts an integer to a 2 decimal digit string
// (e.g. 354 -> 3.54)
function toDec(amount) {
    return (amount / 100).toFixed(2);
}

// Miscellaneous logging for debug purposes
function logData(data) {
    console.log("TRANSACTIONS");
    console.log(data);
    console.log("PARSED TRANSACTIONS");
    console.log(JSON.parse(data).transactions);
}

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
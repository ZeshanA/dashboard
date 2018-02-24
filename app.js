// Import necessary modules
const express = require('express');
const http = require('http');
const url = require('url');
const request = require('request');

// Create Express app
const app = express();

// Set viewing engine to Jade
app.set("view engine", "jade");

// Allow serving of static files from the 'public' directory
app.use(express.static('public'));

// Serve Hello World as project root
app.get('/', (req, res) => res.render('index'));

// Serve logged-in dash page
app.get('/dash', function(req, res) {
	request('https://restcountries.eu/rest/v2/alpha/col', function(error, response, body) {
		res.render('dashboard', {
			name: {
				first: 'Zeshan',
				last: 'Amjad'
			},
			balance: JSON.parse(body)['area']
		});
	});
});

// TODO: Endpoint for Monzo auth
app.get('/auth/monzo', function(req, res) {

});

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
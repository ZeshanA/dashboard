// Import Express
const express = require('express');
const app = express();

app.set("view engine", "jade");

// Serve Hello World as project root
app.get('/', (req, res) => res.render('index'));

app.get('/auth/monzo', function(req, res) {

})

// Allow serving of static files from the 'public' directory
app.use(express.static('public'));

// Listen on Port 3000
app.listen(3000, () => console.log('Listening on Port 3000!'));

// Websocket
const WebSocket = require('ws');
const wss = new WebSocket.server({ port: 8080 });
wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(ws) {
		console.log('Received: %s', message);
	})
	ws.send('£1000')
});
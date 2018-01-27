// Import Express
const express = require('express');
const app = express()

app.set("view engine", "jade");

// Serve Hello World as projec troot
app.get('/', (req, res) => res.render('index'));

// Allow serving of static files from the 'public' directory
app.use(express.static('public'))

// Listen on Port 3000
app.listen(3000, () => console.log('Listening on Port 3000!'));
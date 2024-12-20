/*jshint strict:false */

(function() {
    'use strict';
    // this function is strict...
}());

// Setting up our app requirements

const express = require('express');
const app = express();
const Server = require('http').Server;
const server = new Server(app);
const path = require('path');
const port = 8085;

// Setting up our port

server.listen(port, () => console.log(`Server at ${port}`));

// Configuiring simple express routes
// getDir() function is used here along with package.json.pkg.assets

app.use('/', express.static(getDir() + '/pro-bosses'));

app.get('/', function(req, res) {
    res.sendFile(getDir() + '/pro-bosses/index.html');
});


// Using a function to set default app path
function getDir() {
    if (process.pkg) {
        return path.resolve(process.execPath + "/..");
    } else {
        return path.join(require.main ? require.main.path : process.cwd());
    }
}
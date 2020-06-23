const express = require('express');
const path = require('path');
// const cookieParser = require('cookie-parser');
const logger = require('morgan');

// const indexRouter = require('./routes/index');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);

/**
 * App will use a wss:// protocol because encrypted WebSocket is more reliable, as data are wrapped in TLS, same way HTTPS is HTTP wrapped in TLS.
 * So from network nodes perspective WS data become no different from HTTPS and old proxy servers or firewalls will not drop possibly-unknown WebSocket packet.
 */
const fs = require('fs');
const privateKey = fs.readFileSync('../privkey.pem');
const publicKeyCertificate = fs.readFileSync('../cert.pem');
const credentials = {key: privateKey, cert: publicKeyCertificate};

// To run WebSocket over TLS on same port as https server, pass a createServer result to WebSocket as parameter
const server = require('https').createServer(credentials, app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({server});

/**
 * WebSocket listens for client to open connection and accepts message query object {searchQuery, page}.
 * On message event handler method is invoked to fetch a list of photos matching searchQuery criteria
 * or if searchQuery criteria is empty string then a list of interesting photos for the most recent day from Flickr.
 * Request argument object passed for flickr-sdk functions contain {text, page, per_page} arguments.
 * After data from Flickr is received and processed an object is made { page, pages, total, images: [id, secret, title, farm. server]};
 * then converted to JSON and sent via WebSocket to a client as response to a message.
 */

const Flickr = require('flickr-sdk');

// Retrieve Flickr API key from Environment Variables
const API_KEY = process.env.FLICKR_KEY;

// Create a new Flickr REST API client
const flickr = new Flickr(API_KEY);

// Number of photos to return per page. The defaults to 100. The maximum allowed value is 500.
const PER_PAGE = 20;

// listen for new connection
wss.on('connection', async (socket) => {
    // listen messages from client
    socket.on('message', async (message) => {
            // parse received message from the client
            message = JSON.parse(message);

            console.info('message received from a client:', message);

            // create request argument object for flickr-sdk functions
            const arguments = {
                // A free text search. Photos who's title, description or tags contain the text will be returned.
                text: message.searchQuery,
                // The page of results to return
                page: message.page,
                // images per request
                per_page: PER_PAGE
            }

            // define data variable outside try catch block before retrieve data from Flickr API
            let dataFromFlickr;

            try {
                // if searchQuery empty get a list of interesting photos for the most recent day from Flickr
                if (message.searchQuery === '') {
                    dataFromFlickr = await flickr.interestingness.getList(arguments).then((res) => res.body);
                } else {
                    // else get a list of public photos matching searchQuery criteria from Flickr
                    dataFromFlickr = await flickr.photos.search(arguments).then((res) => res.body);
                }
            } catch (err) {
                console.error('ERROR:', err);
            }

            console.info("dataFromFlickr", dataFromFlickr); //////////////////////// FOR DEVELOPING PURPOSES ////////////////////////

            // initialize empty images array
            const images = [];

            // loop through all PER_PAGE photos returned from Flickr API
            dataFromFlickr.photos.photo.forEach(el => {
                // fill images array with data to reconstruct images URLs on client side to save bandwidth and server CPU cycles
                images.push(
                    {
                        id: el.id,
                        secret: el.secret,
                        title: el.title,
                        farm: el.farm,
                        server: el.server
                    }
                );
            });

            // After data from Flickr processed make an object and send to a client (as JSON)
            socket.send(
                JSON.stringify(
                    {
                        page: dataFromFlickr.photos.page,
                        pages: dataFromFlickr.photos.pages,
                        total: parseInt(dataFromFlickr.photos.total),
                        images
                    }
                )
            );
        }
    );
});

// because of WebSocket configuration on app.js export not just app but server too to bin/www
module.exports = {app: app, server: server};
// module.exports = app;


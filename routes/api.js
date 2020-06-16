const express = require('express');
const router = express.Router();
const Flickr = require('flickr-sdk');

// Retrieve Flickr API key from Environment Variables
const API_KEY = process.env.FLICKR_KEY;

// Create a new Flickr REST API client
const flickr = new Flickr(API_KEY);

// Number of photos to return per page. The defaults to 100. The maximum allowed value is 500.
const PER_PAGE = 20;

/**
 * Node.js/Express listens to get requests on path /api/photos/ and accepts GET queries with params searchQuery and page.
 * On request route method below is invoked to fetch a list of photos matching searchQuery criteria
 * from Flickr using flickr.photos.search method with text, page, per_page arguments.
 * After data is received an object is made { page, pages, total, images: [id, secret, title, farm. server]};
 * then converted to JSON and returned to a client as response.
 */
router.get('/photos', async function (req, res) {
    // Get a list of public photos matching searchQuery criteria from Flickr
    const data = await flickr.photos.search({
        // A free text search. Photos who's title, description or tags contain the text will be returned.
        text: req.query.searchQuery,
        // The page of results to return
        page: req.query.page,
        // images per request
        per_page: PER_PAGE
    }).then(function (flickrResponse) {
        // return Flickr API response body
        return flickrResponse.body;
    }).catch(function (err) {
        console.error('ERROR:', err);
    });

    console.log(data); //////////////////////// FOR DEVELOPING PURPOSES ////////////////////////

    // initialize empty images array
    const images = [];

    // loop through all PER_PAGE photos returned from Flickr API
    data.photos.photo.forEach(el => {
        // fill images array with data to reconstruct images URLs on client side to save bandwidth and CPU cycles
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

    // After data processed make returnData object to send to client
    const returnData = {
        page: data.photos.page,
        pages: data.photos.pages,
        total: parseInt(data.photos.total),
        images
    }

    // response with returnData as JSON
    await res.json(returnData);

});

module.exports = router;

// Define more often used DOM elements
const cardsContainer = document.getElementById('cards-container');
const searchForm = document.getElementById('search-form');
const searchBar = document.getElementById('searchbar');
const spinnerContainer = document.getElementById('spinner-container');

// Initial page is 0 and searchQuery an empty string
let page = 0;
let searchQuery = '';

// Create a WebSocket and connect to a server
const socket = new WebSocket('ws://localhost:3000');

/**
 * main initialization function is the entry point into the application.
 * it defines listeners for WebSocket evens: open, error, close and message
 */
const mainInit = function mainInitializationFunction() {
    // On page initialization then WebSocket connection is open and ready, fetch photos from Flickr
    socket.onopen = (event) => {
        // Print some development related info to console
        console.info('Connection to server opened:', event.target.url);
        // empty string is condition for fetch interesting photos for the most recent day on Flickr
        fetchImages('', 1);
    }

    // Listen for WebSocket error
    socket.onerror = (error) => {
        // Print error to the console in case the app user is someone like myself
        console.error('ERROR:', error);

        // Add message to the DOM to inform mere mortals on UI about the error
        const divAlertContainer = document.createElement('div');

        // Add classes to the created div
        divAlertContainer.className = 'alert-container vh-100 d-flex align-items-center mx-auto';

        // Insert other alert elements to div
        divAlertContainer.innerHTML =
            (
                '<div class="alert alert-danger" role="alert" style="z-index:1100">' +
                '<h4 class="alert-heading text-center">SheeEEEeeit, something went very wrong...' +
                '<span class="d-block text-center py-3 my-3"><strong>Sorry mate, we lost touch with Internets reality (server)</strong></span>' +
                '</h4>' +
                '<hr>' +
                '<p class="mb-0 text-center">Check your Internets connection, refresh the page, ask your mama or go away.</p>' +
                '</div>'
            );

        // Append alert to the DOM
        cardsContainer.appendChild(divAlertContainer);
    }

// Listen for WebSocket connection closing
    socket.onclose = (event) => {
        if (event.wasClean) {
            // if connection to a server closed cleanly no need to inform the user as he is probably gone for good
            console.info(`Connection to server closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            // else if connection closed not gracefully, server process killed or network down then it is an error and its handler will take care of everything
            console.error(`Connection died, code=${event.code} reason=${event.reason}`);
        }
        // TODO: need to implement auto reconnect on lost of connection to WebSocket server
    }

// Listen for WebSocket messages from back-end server
    socket.onmessage = (event) => {
        // Parse data from back-end before processing it
        const data = JSON.parse(event.data);

        console.info('Message from server:', data); ///////////// FOR DEVELOPING PURPOSES ONLY ///////

        // Check if there is data to process, if not then inform the user
        if (data.total === 0) {
            // If total photos = 0 inform the user
            console.info("No photos found with searchQuery ", this.searchQuery);

            // Add message to the DOM to inform the user about zero search results
            cardsContainer.innerHTML =
                (
                    '<div class="alert-container d-flex align-items-center justify-content-center fixed-top h-100">' +
                    '<div class="alert alert-primary" role="alert">' +
                    '<h4 class="alert-heading text-center">Sorry mate, there is nothing for you in name of the' +
                    '<span class="d-block text-center py-2 my-2"><strong>' + this.searchQuery + '</strong></span>' +
                    '</h4>' +
                    '<hr>' +
                    '<p class="mb-0 text-center">Check your spelling or try something else, Would you?</p>' +
                    '</div>' +
                    '</div>'
                );

            // Focus search input field for new query
            document.getElementById('search').focus();

        } else {
            // Pass parsed data from server for processing and eventually appending DOM with images
            processDataFromServer(data);
        }
    }
}

/**
 * make sure main initialization function called only when the page has completely loaded,
 * even if defer is set on html side it is better to be safe than sorry.
 */
window.onload = mainInit;

/**
 * All named function expressions (eslint: func-style) defined below this line
 */

// Process server sent data to append images from Flickr to the DOM
const processDataFromServer = function processFlickrDataFromServer({page, pages, total, images}) {

    console.log('processDataFromServer', page, pages, total, images); ///////////// FOR DEVELOPING PURPOSES ONLY ///////

    // Safety-save returned page from server which should be same as current this.page if no error in the process
    this.page = page;

    // Append every image to DOM individually (should boost app performance)
    images.forEach((el) => appendImage(el))
}

/**
 * Destructure object argument and make divs and img elements structure, form img src url, then append to DOM
 * <div id="cards-container" class="row d-flex align-items-center">
 *     <div class="col-12 col-lg-6 col-xl-4 col-element">
 *          <div class="img-card">
 *              <img class="img-thumbnail" src="..." alt="Card title">
 *              <div class="card-img-overlay">
 *                  <h5 class="card-title">Card title</h5>
 */
const appendImage = function appendImageToDOM({farm, id, secret, server, title}) {
    // Create new div element for columns
    const divColElement = document.createElement('div');
    /**
     * Grid breaking points for all viewport and device sizes are:
     * Then display size < 992px use one column across: 12 (col-12);
     * then it is Large (≥992px) use two columns: 6+6 (col-lg-6);
     * then Extra large (≥1200px) use three columns: 4+4+4 (col-xl-4).
     */
    divColElement.className = 'col-12 col-lg-6 col-xl-4 col-element';

    // Create new div element and add img-card class, it will act as image container-card
    const divCardElement = document.createElement('div')
    divCardElement.classList.add('img-card')

    // Create new img element with src pointing to Flickr servers, so it can be downloaded and displayed by a browser
    const imgThumbElement = document.createElement('img');
    imgThumbElement.classList.add('img-thumbnail')
    imgThumbElement.alt = title;
    /**
     * Flickr URL takes the following format:
     * https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_[mstzb].jpg
     The letter suffixes are as follows:
     s    small square 75x75
     q    large square 150x150
     t    thumbnail, 100 on longest side
     m    small, 240 on longest side
     n    small, 320 on longest side
     -    medium, 500 on longest side
     z    medium 640, 640 on longest side
     c    medium 800, 800 on longest side†
     b    large, 1024 on longest side*
     h    large 1600, 1600 on longest side†
     k    large 2048, 2048 on longest side†
     o    original image, either a jpg, gif or png, depending on source format
     * Before May 25th 2010 large photos only exist for very large original images.
     † Medium 800, large 1600, and large 2048 photos only exist after March 1st 2012.
     */
    // img.src = 'https://farm' + farm + '.staticflickr.com/' + server + '/' + id + '_' + secret + '.jpg';
    imgThumbElement.src = 'https://farm' + farm + '.staticflickr.com/' + server + '/' + id + '_' + secret + '_z.jpg';

    // Then image downloaded by browser set its grand parent element's opacity to 1 for fade-in transition effect
    imgThumbElement.onload = () => {
        // Make it visible on DOM
        divColElement.style.opacity = '1';

        // Remove loading icons then newly fetched images appended into DOM
        spinnerContainer.innerHTML = '';
    }

    // FIXME: card title is out of image bounds seems that is because it is relative to divCardElement
    // Insert card-img-overlay element with title received from Flickr
    divCardElement.innerHTML = '<div class="img-overlay"><h5 class="card-title">' + title + '</h5></div>';

    // Append created img element to div acting as card
    divCardElement.appendChild(imgThumbElement);

    // Append card div element to column div element as a child
    divColElement.appendChild(divCardElement);

    // Append created div element to cardsContainer element as a child
    cardsContainer.appendChild(divColElement);
}

// TODO: on click of individual photo enlarge picture of biggest available size suffix, put Title at the bottom and url to Flickr

// Fetch images from Flick by sending a WebSocket message to back-end with request data
const fetchImages = function fetchImagesFromBackEnd(searchQuery, page) {

    // Add loading icons at the bottom of body element inside spinner-container while fetching
    spinnerContainer.innerHTML = '<div class="spinner-border text-warning" role="status"></div>';

    // Save current searchQuery and page on windows object
    this.searchQuery = searchQuery;
    this.page = page;

    console.log('fetchImages(', searchQuery, page, ')');
    console.log('this.searchQuery and this.page: ', this.searchQuery, this.page);

    // Send JSON message to WebSocket server with request data
    socket.send(JSON.stringify({searchQuery, page}));

}

// Search form event listener for new search query submits
const searchFormHandler = function searchFormEventHandler(event) {
    event.preventDefault();

    // Get search-form input value
    const searchQuery = event.target.elements.search.value;

    // Scroll to top of document to avoid unnecessary scrollFetchImages invocation (seems to not work)
    window.scrollTo(0, 0)

    // Fetch new images from server with given searchQuery
    fetchImages(searchQuery, 1);

    // New search query given, means need to clear previous search images from DOM
    cardsContainer.innerHTML = '';


};
// Listen for search query (search-form) submits
searchForm.addEventListener('submit', searchFormHandler);


// When the user scrolls down, hide the searchbar element. When the user scrolls up, show the searchbar
let prevScrollPos = window.pageYOffset;
const scrollShowHideSearchBar = function scrollShowHideSearchBarEventHandler() {
    let currentScrollPos = window.pageYOffset;
    if (prevScrollPos > currentScrollPos) {
        // show searchBar 25px from viewport top
        searchBar.style.top = '25px'; // wont work with <!DOCTYPE html>
    } else {
        // hide searchBar from viewport
        searchBar.style.top = '-70px'; // wont work with <!DOCTYPE html>
    }

    // set new scroll position as previous
    prevScrollPos = currentScrollPos;
}
// Throttled scroll event listener for searchBar hide/show functionality
window.addEventListener('scroll', _.throttle(scrollShowHideSearchBar, 300));

// Then user scrolls close to the end of document page, fetch for new images for given criteria
const scrollFetchImages = function scrollFetchImagesEventHandler() {
    // size of an document element and its position relative to the top of viewport
    let windowRelativeBottom = document.documentElement.getBoundingClientRect().bottom;
    // viewport height in pixels
    let intViewportHeight = window.innerHeight;
    // if user scrolled closer to the bottom then intViewportHeight*n fetch more images
    if (windowRelativeBottom < intViewportHeight * 5) {

        console.log('scrollFetchImages(),', this.searchQuery, this.page + 1); ////////////////////////

        // fetch more images on next page for given search query
        fetchImages(this.searchQuery, this.page + 1);
    }
}
// Throttled scroll event listener for precarious image fetching from Flickr API (Throttling is a must to not flood Flickr API with requests)
window.addEventListener('scroll', _.throttle(scrollFetchImages, 1000));

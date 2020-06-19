const imagesContainerRow = document.querySelector('div#images-container .row')
const searchForm = document.getElementById('search-form');
const searchBar = document.getElementById('searchbar')

// Initial page is 0 and searchQuery an empty string
let page = 0;
let searchQuery = '';

// Create a WebSocket and connect to a server
const socket = new WebSocket('ws://localhost:3000');

// On page initialization then WebSocket connection is open fetch photos from Flickr
socket.onopen = (event) => {
    console.info('Connected to server:', event.target.url);
    // empty string is condition for fetch interesting photos for the most recent day on Flickr
    fetchImages('', 1);
}

// Listen for WebSocket error
socket.onerror = (event) => {
    console.error('ERROR:', event);
}

// Listen for WebSocket connection closing
socket.onclose = (event) => {
    console.info('Disconnecting from server:', event.code);
}

// Listen for WebSocket messages from back-end server
socket.onmessage = (event) => {
    // Parse data from back-end before processing it
    const data = JSON.parse(event.data);

    console.info('Message from server:', data); ///////////// FOR DEVELOPING PURPOSES ONLY ///////

    // Pass parsed data from server for processing and eventually appending DOM with images
    processDataFromServer(data);
}

// Process server sent data to append images from Flickr to the DOM
const processDataFromServer = function processFlickrDataFromServer({page, pages, total, images}) {

    console.log('processDataFromServer', page, pages, total, images); ///////////// FOR DEVELOPING PURPOSES ONLY ///////

    // Safety-save returned page from server which should be same as current this.page if no error in the process
    this.page = page;

    // Append every image to DOM individually (should boost app performance)
    images.forEach((el) => appendImage(el))
}

// Destructure object argument and make div and img elements, then append image to DOM
const appendImage = function appendImageToDOM({farm, id, secret, server, title}) {
    // Create new div element for image card
    const div = document.createElement('div');
    /**
     * Then display size < 992px use one column across 12;
     * then it is Large (≥992px) use two columns 6+6;
     * then Extra large (≥1200px) use three columns 4+4+4
     */
    div.className = 'col-12 col-lg-6 col-xl-4 image';

    // Create new img element with src pointing to Flickr servers, so it can be displayed by a browser
    const img = document.createElement('img');
    img.classList.add('img-thumbnail')
    img.alt = title;
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
    img.src = 'https://farm' + farm + '.staticflickr.com/' + server + '/' + id + '_' + secret + '_z.jpg';

    // Then image downloaded by browser set its opacity to 1 for fade-in transition effect
    img.onload = () => {
        img.style.opacity = '1';
    }

    // append created img element to div element as child
    div.append(img);

    // append created div element to imagesContainerRow element as child
    imagesContainerRow.append(div);
}

// Fetch images from Flick by sending a WebSocket message to back-end with request data
const fetchImages = function fetchImagesFromBackEnd(searchQuery, page) {
    // Save current searchQuery and page on windows object
    this.searchQuery = searchQuery;
    this.page = page;

    console.log('fetchImages(', searchQuery, page);
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
    window.scrollTo(0,0)

    // Fetch new images from server with given searchQuery
    fetchImages(searchQuery, 1);

    // New search query given, means need to clear previous search images from DOM
    imagesContainerRow.innerHTML = '';


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



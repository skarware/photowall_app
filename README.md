# PhotoWall_App

## Live Demo (publicly accessible front-end on GitHub Pages; back-end on FreeBSD 12 machine)
https://skarware.github.io/photowall_app/

## About

PhotoWall App idea came from one of home/job tasks I got while looking for my first job as a web developer; 
Application made using <b><i>JavaScript(ES6+), Node.js, npm, Express, flickr-sdk, WebSockets, Bootstrap and Let's Encrypt certificate</i></b> for TLS to secure HTTP and WS protocols.

App uses a wss:// protocol because encrypted WebSocket is more reliable as data wrapped in TLS, same way HTTPS is HTTP wrapped in TLS. So from network nodes perspective WS data become no different from HTTPS and old proxy servers or firewalls will not drop possibly-unknown WebSocket packet.

Project developed using Node.js v14.3.0 on Win10, but tested to work and run Live Demo App on v12.16.1_1 on my FreeBSD machine (the back-end part, while front-end is publicly accessible on GitHub Pages).

Made a decent effort to make code [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) compatible.

For more look into source code, dare to say it is well commented to get a good idea of what I was trying to achieve.  
    
## Project setup

Open terminal and use <i>git clone</i> command to download the remote GitHub repository to your computer:
```
git clone https://github.com/skarware/photowall_app.git
```
It will create a new folder with same name as GitHub repository "photowall_app". All the project files and git data will be cloned into it. 
After cloning complete change directories into that new folder:
```
cd photowall_app
``` 
Install the dependencies for the project in the local node_modules folder.
```
npm install
```
## How to run the app
To run the program use npm start script (defined in package.json):
```
npm start
```
It will start HTTPS and WebSocket servers listening on port 3000 by default (Change if must inside ./bin/www file).
Therefore, if you run the back-end of the app locally you can reach front-end with url https://localhost:3000, and all went well you should see debug information printed to stdout by Node.js:
```
skarware@citadel:~/photowall_app % npm start

> photowall-app@0.1.0 start /usr/home/skarmar/photowall_app
> node ./bin/www

message received from a client: { searchQuery: '', page: 1 }
dataFromFlickr {
  photos: {
    page: 1,
    pages: 25,
    perpage: 20,
    total: 500,
    photo: [
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object]
    ]
  },
  stat: 'ok'
}
message received from a client: { searchQuery: 'Vilnius', page: 1 }
dataFromFlickr {
  photos: {
    page: 1,
    pages: 17006,
    perpage: 20,
    total: '340102',
    photo: [
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object]
    ]
  },
  stat: 'ok'
}

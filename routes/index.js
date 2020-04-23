/**
 * Manages all endpoints and socket events for the Spotifam API.
 * All sockets are managed in the exports at the end of the page by socket.io.
 */

var express = require('express');
var Room = require('./room.js');
var router = express.Router();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


// =============================================================================
// Globals
// =============================================================================

let rooms = {};


// =============================================================================
// Routes
// =============================================================================

router.get('/', function(req, res, next) {
  res.render('index', { title: 'api.spotifam.com' });
});

router.get('/createroom', function(req, res, next) {
  /**
   * Create a room at the PlayerPage's request.
   * @see PlayerPage
   * @see SpotifamAPI on the frontend
   */

  // Check if room code already exists
  room_code = generateRoomCode();
  while (room_code in rooms) {
    room_code = generateRoomCode();
  }

  rooms[room_code] = new Room(req.query.auth_tok);
  res.send({room: room_code});

});

router.get('/getqueue', function (req, res, next) {
  /**
   * Returns the current queue for a room.
   * This function has been replaced in favor of using Sockets.io to detect when
   * a new song is added to a Room's queue.
   * @see /addsong
   * @deprecated
   * 
   * @param {string} room_code
   */
  var room_code = req.query.room_code;
  var queue;

  if (room_code in rooms) {
    queue = rooms[room_code].getQueue();
    res.json({list: queue});
  } else {
    res.sendStatus(404);
  }
});

router.post('/updatequeue', function (req, res, next) {
  /**
   * Updates the queue with a replacement queue.
   * When a user drags/drops a song on the frontend the queue must be updated.
   * @see PlayerPage on the frontend
   * 
   * @param {Array} queue
   * @param {string} room_code
   */
  var queue     = req.body.queue;
  var room_code = req.body.room;

  rooms[room_code].updateQueue(queue);

  res.sendStatus(200);

});

router.post('/addsong', function (req, res, next) {
  /**
   * Adds a song to the queue and updates the queue.
   * When a user adds a song from the MobileRoom, the Room object corresponding
   * to the room code sent is updated. Immediately after the PlayerPage is
   * notified of the chance via Socket.io with the updated queue.
   * @see MobileRoom
   * @see PlayerPage
   * @see io.on... (bottom of this page)
   * 
   * @param {Object} song
   * @param {string} room_code
   */
  var song      = req.body.song;
  var room_code = req.body.room;

  console.log("song: ", song);
  console.log("room code: ", room_code);

  if (room_code in rooms) {
    rooms[room_code].addToQueue(song);
    req.app.io.to(room_code).emit('update queue', { queue : rooms[room_code].getQueue()});
    res.send({song_added:true});
  } else {
    res.send({song_added: false});
  }

});

router.get('/search', function (req, res, next) {
  /**
   * Searches for songs via Spotify's API.
   * This endpoint also has a helper function to send the formatted request to
   * Spotify.
   * @see spotifySearchRequest
   */
  var room_code = req.query.room;
  var query     = req.query.query;

  var params = "?q=" + query + "&type=track";
  console.log(rooms[room_code].getAuthToken());
  spotifySearchRequest("https://api.spotify.com/v1/search" + params, res.send.bind(res), 
                        rooms[room_code].getAuthToken());

});

router.get('/checkroom', function (req, res, next) {
  /**
   * Check if a given room code is valid.
   * Used in the MobileRoom to verify when joining a room.
   * @see MobileRoom on the frontend
   */
  var room_code = req.query.room;
  
  if (room_code in rooms) {
    res.send({exists: true});
  } else {
    res.send({exists: false});
  }
});

// =============================================================================
// Helper Functions
// =============================================================================

function spotifySearchRequest(url, callback, auth_tok) {
  /**
   * Helper function for the search endpoint.
   * @see /search
   * 
   * @param {string} url Spotify song search endpoint with params
   * @param {Function} callback
   * @param {string} auth_tok The room's Spotify Account token
   */

  //https://stackoverflow.com/questions/247483/http-get-request-in-javascript
  // Handle async request to Spotify Servers
  var search_results = new XMLHttpRequest();
  search_results.onreadystatechange = function() { 
  if (search_results.readyState == 4 && search_results.status == 200)
      callback(search_results.responseText);
  }

  search_results.open("GET", url, true);
  search_results.setRequestHeader('Accept', 'application/json');
  search_results.setRequestHeader('Content-Type', 'application/json');
  search_results.setRequestHeader('Content-Type', 'application/json');
  search_results.setRequestHeader('Authorization', 'Bearer ' + auth_tok);
  search_results.send(null);
}

function generateRoomCode(len = 4) {
  /**
   * Generate a room code that defaults to 4 characters.
   * This should be adequate for holding all rooms given there are 26^4 possible
   * letter combinations.
   * @see /createroom
   * 
   * @param {int} len length of the room code
   */
  let room_code = '';
  while (room_code.length < len) {
    // Create random capital letter
    curr_char = String.fromCharCode(Math.floor(Math.random() * (90 - 65) + 65));
    room_code += curr_char;
  }
  return room_code;
}


module.exports = function (io) {

  // ===========================================================================
  // Socket.io Events
  // ===========================================================================

  io.on('connection', function (socket) {
      
      let currRoom = "";

      socket.on('create room', (data) => {
        /**
         * Socket event when room is created.
         * This event is triggered in the SpotifamAPI on the frontend.
         * @param {object} data contains the room code
         */
        currRoom = data.room_code; // keep track of the room's socket
        socket.join(data.room_code);
      });

      socket.on('disconnect', () => {
        delete rooms[currRoom];
      });
  });

  return router;
};

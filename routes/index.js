var express = require('express');
var Room = require('./room.js');
var router = express.Router();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

rooms = {};

/* Server Homepage */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Create Room */
router.get('/createroom', function(req, res, next) {
  console.log('auth_tok: ', req.query.auth_tok);

  // Check if room code already exists
  room_code = generateRoomCode();
  while (room_code in rooms) {
    room_code = generateRoomCode();
  }

  console.log('room_code: ', room_code);
  rooms[room_code] = new Room(req.query.auth_tok);
  console.log('rooms', rooms);
  res.send({room: room_code});

});

/* Get Queue */
router.get('/getqueue', function (req, res, next) {
  var room_code = req.query.room_code;
  var queue;

  if (room_code in room) {
    queue = rooms[room_code].getQueue();
    res.send({list: queue});
  } else {
    res.sendStatus(404);
  }
});

/* Update Queue */
router.post('/updatequeue', function (req, res, next) {
  var queue     = req.body.queue;
  var room_code = req.body.room;

  rooms[room_code].updateQueue(queue);

  res.sendStatus(200);

});

/* Add song */
router.post('/addsong', function (req, res, next) {
  var song      = req.body.song;
  var room_code = req.body.room;

  rooms[room_code].addToQueue(song);

  res.sendStatus(200);

});

/* Search for Songs */
router.get('/search', function (req, res, next) {
  var room_code = req.query.room;
  var query     = req.query.query;

  var params = "?q=" + query + "&type=track";
  console.log(rooms[room_code].getAuthToken());
  spotifySearchRequest("https://api.spotify.com/v1/search" + params, res.send.bind(res), rooms[room_code].getAuthToken());

});


/* Check room */
router.get('/checkroom', function (req, res, next) {
  var room_code = req.query.room;
  
  if (room_code in rooms) {
    res.send({exists: true});
  } else {
    res.send({exists: false});
  }
});

/* Helper Functions */
function generateRoomCode(len = 4) {
  let room_code = '';
  while (room_code.length < len) {
    // Create random capital letter
    curr_char = String.fromCharCode(Math.floor(Math.random() * (90 - 65) + 65));
    room_code += curr_char;
  }
  return room_code;
}

function spotifySearchRequest(url, callback, auth_tok) {
  // Handle async request to Spotify Servers
  var search_results = new XMLHttpRequest();
  search_results.onreadystatechange = function() { 
  if (search_results.readyState == 4 && search_results.status == 200)
      callback(search_results.responseText);
      console.log(search_results.responseText);
  }

  console.log("made it 2");
  search_results.open("GET", url, true);
  search_results.setRequestHeader('Accept', 'application/json');
  search_results.setRequestHeader('Content-Type', 'application/json');
  search_results.setRequestHeader('Content-Type', 'application/json');
  search_results.setRequestHeader('Authorization', 'Bearer ' + auth_tok);
  search_results.send(null);
}

module.exports = router;

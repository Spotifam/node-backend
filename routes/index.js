var express = require('express');
var router = express.Router();

rooms = {};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Create Room */
router.get('/createroom', function(req, res) {
  console.log('auth_tok: ', req.query.auth_tok);

  room_code = generateRoomCode();

  console.log('room_code: ', room_code);
  rooms[room_code] = 'test';
  console.log('rooms', rooms);
  res.send({room: room_code});

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

module.exports = router;

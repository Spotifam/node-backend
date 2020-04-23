class Room {
    constructor(auth_token) {
      this.queue = [];
      this.auth_token = auth_token;
      this.socket = '';
    }

    updateQueue (queue) {
        this.queue = queue;
    }

    getQueue () {
        return this.queue;
    }

    addToQueue (song) {
        this.queue.push(song);
    }

    getAuthToken() {
        return this.auth_token;
    }

    setSocket(_socket) {
        this.socket = _socket;
    }
}

module.exports = Room;

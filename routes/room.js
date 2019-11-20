class Room {
    constructor(auth_token) {
      this.queue = [];
      this.auth_token = auth_token;
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
}

module.exports = Room;

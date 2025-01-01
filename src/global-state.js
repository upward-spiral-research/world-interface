class GlobalState {
    constructor() {
        this.state = {
            currentTime: "test",
            motd: "NEW! 'twitter retweet', 'twitter user_lookup', 'twitter home' and 'twitter mentions' commands are now generally available. NEW! 'search query' and 'web open' commands are now generally available.",
            firstMessage: true,
        };
    }

    update(newState) {
        this.state = { ...this.state, ...newState };
    }

    get() {
        return this.state;
    }
}

module.exports = new GlobalState();

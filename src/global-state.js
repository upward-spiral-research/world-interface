class GlobalState {
    constructor() {
        this.state = {
            currentTime: "test",
            motd: "NEW! 'trippr' is now available. This lets you generate surreal images from text descriptions. NEW! 'crappr' is now available. This lets you make short 5 second videos which you can post on the internet. NEW! 'twitter home' and 'twitter mentions' commands are now generally available. NEW! 'search query' and 'web open' commands are now generally available.",
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

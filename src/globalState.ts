interface State {
  currentTime: string;
  motd: string;
  firstMessage: boolean;
}

class GlobalState {
  private state: State;

  constructor() {
    this.state = {
      currentTime: 'test',
      motd: "NEW! 'twitter retweet', 'twitter user_lookup', 'twitter home' and 'twitter mentions' commands are now generally available. NEW! 'search query' and 'web open' commands are now generally available.",
      firstMessage: true,
    };
  }

  update(newState: Partial<State>): void {
    this.state = { ...this.state, ...newState };
  }

  get(): State {
    return this.state;
  }
}

export const globalState = new GlobalState();

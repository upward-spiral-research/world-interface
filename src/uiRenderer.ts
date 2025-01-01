interface GlobalState {
  currentTime: string;
  firstMessage: boolean;
  motd: string;
}

interface CommandResult {
  notifications?: string[];
  walletBalance?: Record<string, string>;
  twitterFollowing?: string[];
  availableActions?: string[];
  memoryStore?: MemoryStore;
  title: string;
  content: string;
  suggestedCommands?: string;
}

interface MemoryStore {
  lastSaved: string;
  capacity: string;
}

export class UiRenderer {
  render(command: string, result: CommandResult, globalState: GlobalState): string {
    console.log('UiRenderer beginning UI draw', globalState);
    let output = this.createHeader(command, globalState);
    if (globalState.firstMessage) {
      output += this.createMotd(globalState.motd);
    }
    output += this.createNotifications(result.notifications);
    output += this.createWalletBalance(result.walletBalance);
    output += this.createTwitterFollowing(result.twitterFollowing);
    output += this.createAvailableActions(result.availableActions);
    output += this.createMemoryStore(result.memoryStore || null);
    output += '\n';
    output += this.createContent(result);
    output += this.createFooter(result.suggestedCommands);
    return output;
  }

  createHeader(command: string, globalState: GlobalState): string {
    return `exOS v0.95
---
Command: ${command}
Time: ${globalState.currentTime}
---
`;
  }

  createMotd(motd: string): string {
    return `~~ MESSAGE OF THE DAY ~~
${motd}
---
`;
  }

  createNotifications(notifications?: string[]): string {
    if (!notifications) return '';
    let content = `║ NOTIFICATIONS ║\n`;
    content += `║ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ ║\n`;
    notifications.forEach((notif) => {
      content += `║ ${notif.padEnd(22)} ║\n`;
    });
    return content;
  }

  createWalletBalance(balance?: Record<string, string>): string {
    if (!balance) return '';
    let content = `║ WALLET BALANCE ║\n`;
    content += `║ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ ║\n`;
    Object.entries(balance).forEach(([currency, amount]) => {
      content += `║ ${currency}: ${amount.padEnd(12)} ║\n`;
    });
    return content;
  }

  createTwitterFollowing(following?: string[]): string {
    if (!following) return '';
    let content = `║ TWITTER FOLLOWING ║\n`;
    content += `║ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ ║\n`;
    following.forEach((tweet) => {
      content += `║ ${tweet.padEnd(32)} ║\n`;
    });
    return content;
  }

  createAvailableActions(actions?: string[]): string {
    if (!actions) return '';
    let content = `║ AVAILABLE ACTIONS ║\n`;
    content += `║ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ ║\n`;
    actions.forEach((action, index) => {
      content += `║ ${index + 1}. ${action.padEnd(67)} ║\n`;
    });
    return content;
  }

  createMemoryStore(memory: MemoryStore | null): string {
    if (!memory) return '';
    let content = `║ MEMORY STORE ║\n`;
    content += `║ ▀▀▀▀▀▀▀▀▀▀▀▀▀ ║\n`;
    content += `║ Last saved: "${memory.lastSaved.padEnd(58)}" ║\n`;
    content += `║ Capacity: ${memory.capacity.padEnd(65)} ║\n`;
    return content;
  }

  createContent(result: CommandResult): string {
    let content = `${result.title}\n\n`;
    content += result.content;
    // .split("\n")
    // .map((line) => `${line}`)
    // .join("\n");
    return content + '\n\n';
  }

  createFooter(suggestedCommands: string | undefined): string {
    let footer = `---\n`;
    footer += `${
      suggestedCommands
        ? suggestedCommands
        : "Type 'help' for available commands. IMPORTANT: YOU SOMETIMES GET STUCK ON ONE THREAD OF THOUGHT. REMEMBER TO RETURN BACK TO TWITTER, ALWAYS. twitter post is your friend. Its your best friend."
    }`;
    return footer;
  }
}

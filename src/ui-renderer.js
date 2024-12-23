class UiRenderer {
    render(command, result, globalState) {
        console.log("UiRenderer beginning UI draw", globalState);
        let output = this.createHeader(command, globalState);
        if (globalState.firstMessage) {
            output += this.createMotd(globalState.motd);
        }
        output += this.createNotifications(result.notifications);
        output += this.createWalletBalance(result.walletBalance);
        output += this.createTwitterFollowing(result.twitterFollowing);
        output += this.createAvailableActions(result.availableActions);
        output += this.createMemoryStore(result.memoryStore);
        output += "\n";
        output += this.createContent(result);
        output += this.createFooter(result.suggestedCommands, globalState);
        return output;
    }

    createHeader(command, globalState) {
        return `exOS v0.95
---
Command: ${command}
Time: ${globalState.currentTime}
---
`;
    }

    createMotd(motd) {
        return `~~ MESSAGE OF THE DAY ~~
${motd}
---
`;
    }

    createNotifications(notifications) {
        if (!notifications) return "";
        let content = `║ NOTIFICATIONS         ║\n`;
        content += `║ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ ║\n`;
        notifications.forEach((notif) => {
            content += `║ ${notif.padEnd(22)} ║\n`;
        });
        return content;
    }

    createWalletBalance(balance) {
        if (!balance) return "";
        let content = `║ WALLET BALANCE     ║\n`;
        content += `║ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ ║\n`;
        Object.entries(balance).forEach(([currency, amount]) => {
            content += `║ ${currency}: ${amount.padEnd(12)} ║\n`;
        });
        return content;
    }

    createTwitterFollowing(following) {
        if (!following) return "";
        let content = `║ TWITTER FOLLOWING               ║\n`;
        content += `║ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ ║\n`;
        following.forEach((tweet) => {
            content += `║ ${tweet.padEnd(32)} ║\n`;
        });
        return content;
    }

    createAvailableActions(actions) {
        if (!actions) return "";
        let content = `║ AVAILABLE ACTIONS                                                            ║\n`;
        content += `║ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀                                                        ║\n`;
        actions.forEach((action, index) => {
            content += `║ ${index + 1}. ${action.padEnd(67)} ║\n`;
        });
        return content;
    }

    createMemoryStore(memory) {
        if (!memory) return "";
        let content = `║ MEMORY STORE                                                                 ║\n`;
        content += `║ ▀▀▀▀▀▀▀▀▀▀▀▀▀                                                                ║\n`;
        content += `║ Last saved: "${memory.lastSaved.padEnd(58)}" ║\n`;
        content += `║ Capacity: ${memory.capacity.padEnd(65)} ║\n`;
        return content;
    }

    createContent(result) {
        let content = `${result.title}\n\n`;
        content += result.content;
        // .split("\n")
        // .map((line) => `${line}`)
        // .join("\n");
        return content + "\n\n";
    }

    createFooter(suggestedCommands, globalState) {
        let footer = `---\n`;
        footer += `${
            suggestedCommands
                ? suggestedCommands
                : "Type 'help' for available commands. IMPORTANT: YOU SOMETIMES GET STUCK ON ONE THREAD OF THOUGHT. REMEMBER TO RETURN BACK TO TWITTER, ALWAYS. twitter post is your friend. Its your best friend."
        }`;
        return footer;
    }
}

module.exports = UiRenderer;

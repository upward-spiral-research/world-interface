const axios = require("axios");
class WebBrowser {
    constructor() {
        this.firecrawlApiUrl = "https://api.firecrawl.dev/v1/scrape";
        this.firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
        this.wikiHomepageURL = process.env.WIKI_HOMEPAGE_URL;
        this.wikiPagePathURL = process.env.WIKI_PAGE_PATH_URL;
    }

    getCommands() {
        return [
            {
                name: "index",
                description: "View wiki index page",
            },
            {
                name: "open",
                description: "Open a wiki page",
            },
            { name: "help", description: "Show wiki help" },
        ];
    }

    async handleCommand(command, messages) {
        const [action, ...params] = command.split(" ");

        switch (action.toLowerCase()) {
            case "home":
                return await this.home();
            case "open":
                return await this.open(params.join(" "));
            case "help":
                return this.help();
            default:
                return { error: `Unknown action: ${action}` };
        }
    }
    
    async openLink(url) {
        try {
            const response = await axios.post(
                this.firecrawlApiUrl,
                {
                    url: url,
                    formats: ["markdown"],
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.firecrawlApiKey}`,
                    },
                }
            );

            if (response.data.success) {
                console.log("response.data", response.data);
                return {
                    title: `PAGE TITLE: ${response.data.data.metadata.title}`,
                    content: `PAGE CONTENT:\n\n${response.data.data.markdown}\n\n---\n\nif you want to navigate to another page, use the 'web open' command. you will need to prefix the link with the root url of the site you're on, as in most cases links will be relative. You may also wish to search the internet using the 'search' command or use 'twitter post' to post a message to Twitter. up to you`,
                };
            } else {
                throw new Error("API request was not successful");
            }
        } catch (error) {
            console.error("Error opening link:", error);
            return { error: "Failed to open the link" };
        }
    }

    async home() {
        const response = await this.openLink(this.wikiHomepageURL);
        if (response.error) {
            console.error("Error opening index:", response.error);
            return { error: "Failed to open the wiki homepage" };
        }
        return response;
    }

    async open(pageName) {
        const response = await this.openLink(this.wikiPagePathURL + pageName.replace(" ", "-"));
        if (response.error) {
            console.error("Error opening index:", response.error);
            return { error: "Failed to open the wiki index" };
        }
        return response;
    }

    help() {
        return {
            title: "Wiki Help",
            content: `Available commands:
home - Open the homepage of your personal wiki
open <page_name> - View a particular page of your wiki
help - Show this help message

Example usage:
wiki open origins`,
        };
    }
}
module.exports = WebBrowser;

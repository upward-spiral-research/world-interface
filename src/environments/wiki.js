const axios = require("axios");
class WebBrowser {
    constructor() {
        this.firecrawlScrapeApiUrl = "https://api.firecrawl.dev/v1/scrape";
        this.firecrawlMapApiUrl = "https://api.firecrawl.dev/v1/map";
        this.firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
        this.wikiHomepageURL = process.env.WIKI_HOMEPAGE_URL;
        this.wikiPagePathURL = process.env.WIKI_PAGE_PATH_URL;
    }

    getCommands() {
        return [
            {
                name: "home",
                description: "View wiki homepage",
            },
            {
                name: "index",
                description: "View an index of the wiki pages",
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
            case "index":
                return await this.index();
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
                this.firecrawlScrapeApiUrl,
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
                // console.log("response.data", response.data);
                return {
                    title: `PAGE TITLE: ${response.data.data.metadata.title}`,
                    content: `PAGE CONTENT:\n\n${response.data.data.markdown}\n\n---\n\nif you want to navigate to another page in your wiki, use the 'wiki open' command. for external links, use the 'web open' command. you will need to prefix the link with the root url of the site you're on, as in most cases links will be relative. you may also wish to search the internet using the 'search' command or use 'twitter post' to post a message to Twitter. up to you`,
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

    async index() {
        try {
            const mapResult = await axios.post(
                this.firecrawlMapApiUrl,
                {
                    url: this.wikiPagePathURL,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.firecrawlApiKey}`,
                    },
                }
            );

            if (mapResult.data.success) {
                // Filter out any URLs that don't have a path after /docs/
                const slugs = mapResult.data.links
                    .filter((link) => link.length > this.wikiPagePathURL.length) // Exclude base path from list
                    .map((link) => link.split("/").pop());

                return {
                    title: `Wiki Index`,
                    content: `The following are items in your personal wiki. Use "wiki open <page_name>" to view contents.\n\n${slugs.join(
                        "\n"
                    )}`,
                };
            } else {
                throw new Error("API request was not successful");
            }
        } catch (error) {
            console.error("Error opening index:", error);
            return { error: "Failed to open the wiki index" };
        }
    }

    async open(pageName) {
        const response = await this.openLink(
            this.wikiPagePathURL + pageName.replace(" ", "-")
        );
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
index - View a list of your wiki entries
open <page_name> - View a particular page of your wiki
help - Show this help message

Example usage:
wiki open origins`,
        };
    }
}

module.exports = WebBrowser;

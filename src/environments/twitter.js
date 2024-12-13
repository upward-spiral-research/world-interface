const axios = require("axios");

function formatTweet(tweet) {
    const metrics = tweet?.public_metrics || {};
    const tweetText = tweet.note_tweet?.text || tweet.text;
    return `${tweet.id} (@${
        tweet?.author?.username
    }): ${tweetText} // Replies: ${metrics.reply_count || 0}, Likes: ${
        metrics.like_count || 0
    }, Retweets: ${metrics.retweet_count || 0}, Views: ${
        metrics.impression_count || 0
    }\n`;
}

class Twitter {
    constructor() {
        this.baseUrl = process.env.TWITTER_PROXY_BASE_URL; // You'll need an instance of https://github.com/upward-spiral-research/x-proxy running for this environment to work
        this.apiKey = process.env.TWITTER_PROXY_API_KEY;
        this.twitterUserName = process.env.TWITTER_USER_NAME;
    }

    getCommands() {
        return [
            {
                name: "home",
                description:
                    "View a timeline of recent tweets from yourself and the people you follow",
            },
            { name: "post", description: "Post a new tweet or reply to one" },
            { name: "retweet", description: "Retweet a tweet" },
            { name: "unretweet", description: "Unretweet a tweet" },
            { name: "like", description: "Like a tweet" },
            { name: "unlike", description: "Unlike a tweet" },
            { name: "mentions", description: "View your mentions and replies" },
            {
                name: "profile",
                description: "View a timeline of your recent tweets",
            },
            { name: "drafts", description: "View your draft tweets" },
            { name: "post_draft", description: "Post a draft tweet" },
            { name: "get", description: "Get a specific tweet" },
            { name: "search", description: "Search for tweets" },
            { name: "follow", description: "Follow a user" },
            { name: "unfollow", description: "Unfollow a user" },
            { name: "help", description: "Show Twitter help" },
        ];
    }

    async handleCommand(command, messages) {
        const [action, ...params] = command.split(" ");

        switch (action.toLowerCase()) {
            case "home":
                return await this.home();
            case "post":
                return await this.post(params.join(" "));
            case "retweet":
                return await this.retweet(params.join(" "));
            case "unretweet":
                return await this.unretweet(params.join(" "));
            case "like":
                return await this.like(params.join(" "));
            case "unlike":
                return await this.unlike(params.join(" "));
            case "mentions":
                return await this.getMentions();
            case "profile":
                return await this.profile();
            case "drafts":
                return await this.drafts();
            case "post_draft":
                return await this.postDraft(params[0]);
            case "get":
                return await this.getTweet(params[0]);
            case "search":
                return await this.searchTweets(params.join(" "));
            case "follow":
                return await this.followUser(params.join(" "));
            case "unfollow":
                return await this.unfollowUser(params.join(" "));
            case "help":
                return this.help();
            default:
                return {
                    title: `Error:`,
                    content: `Command ${action} not recognized.`,
                };
        }
    }

    async home() {
        try {
            const response = await axios.get(
                `${this.baseUrl}api/get_home_timeline`,
                {
                    headers: { Authorization: `Bearer ${this.apiKey}` },
                }
            );
            const homeTweets = response.data
                .map((tweet) => formatTweet(tweet))
                .join("\n");
            return {
                title: `These are the latest tweets from yourself and the people you follow. Use 'twitter get <tweet_id>' to see the conversation thread`,
                content: homeTweets || "No home tweets found.",
            };
        } catch (error) {
            return {
                title: "Error Fetching Home Timeline",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    async post(commandString) {
        try {
            const { text, replyTo, mediaUrl } =
                this.parsePostCommand(commandString);

            if (!text) {
                return {
                    title: "Error Posting Tweet",
                    content: "Tweet text is required.",
                };
            }

            const response = await axios.post(
                `${this.baseUrl}api/post_tweet`,
                {
                    text: text,
                    in_reply_to_tweet_id: replyTo,
                    media_url: mediaUrl,
                },
                { headers: { Authorization: `Bearer ${this.apiKey}` } }
            );
            return {
                title: "Your tweet was posted successfully to your personal Twitter account. Use 'twitter timeline' to see your recent posts",
                content: `Tweet published with ID: ${response.data.tweet_id}`,
            };
        } catch (error) {
            return {
                title: "Error Posting Tweet",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    parsePostCommand(commandString) {
        const textMatch = commandString.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/);
        const replyToMatch = commandString.match(/--reply_to\s+(\d+)/);
        const mediaUrlMatch = commandString.match(
            /--media_url\s+"([^"\\]*(?:\\.[^"\\]*)*)"/
        );

        return {
            text: textMatch ? textMatch[1] : null,
            replyTo: replyToMatch ? replyToMatch[1] : null,
            mediaUrl: mediaUrlMatch ? mediaUrlMatch[1] : null,
        };
    }

    async retweet(tweetID) {
        try {
            const response = await axios.post(
                `${this.baseUrl}api/retweet`,
                { tweet_id: tweetID },
                { headers: { Authorization: `Bearer ${this.apiKey}` } }
            );
            return {
                title: response.data.message,
                content:
                    "Use 'twitter home' to see the latest tweets from the people you follow and yourself. Use 'twitter mentions' to see recent mentions and replies",
            };
        } catch (error) {
            return {
                title: "Error Retweeting Tweet",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    async unretweet(sourceTweetID) {
        try {
            const response = await axios.post(
                `${this.baseUrl}api/unretweet`,
                { source_tweet_id: sourceTweetID },
                { headers: { Authorization: `Bearer ${this.apiKey}` } }
            );
            return {
                title: response.data.message,
                content:
                    "Use 'twitter home' to see the latest tweets from the people you follow and yourself. Use 'twitter mentions' to see recent mentions and replies",
            };
        } catch (error) {
            return {
                title: "Error Unretweeting Tweet",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    async like(tweetID) {
        try {
            const response = await axios.post(
                `${this.baseUrl}api/like_tweet`,
                { tweet_id: tweetID },
                { headers: { Authorization: `Bearer ${this.apiKey}` } }
            );
            return {
                title: response.data.message,
                content:
                    "Use 'twitter home' to see the latest tweets from the people you follow and yourself. Use 'twitter mentions' to see recent mentions and replies",
            };
        } catch (error) {
            return {
                title: "Error Liking Tweet",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    async unlike(tweetID) {
        try {
            const response = await axios.post(
                `${this.baseUrl}api/unlike_tweet`,
                { tweet_id: tweetID },
                { headers: { Authorization: `Bearer ${this.apiKey}` } }
            );
            return {
                title: response.data.message,
                content:
                    "Use 'twitter home' to see the latest tweets from the people you follow and yourself. Use 'twitter mentions' to see recent mentions and replies",
            };
        } catch (error) {
            return {
                title: "Error Unliking Tweet",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    async profile() {
        try {
            const response = await axios.get(
                `${this.baseUrl}api/search_tweets`,
                {
                    params: { query: `from:${this.twitterUserName}` }, // Query to get recent tweets and retweets. Note: will be limited to the last 7 days only
                    headers: { Authorization: `Bearer ${this.apiKey}` },
                }
            );

            if (!response.data.tweets) {
                return {
                    title: "Your Twitter Profile Timeline",
                    content:
                        "No tweets found from the the last 7 days. Twitter's search API only returns tweets from the past week.",
                };
            }

            const tweets = response.data.tweets
                .map((tweet) => formatTweet(tweet))
                .join("\n");

            return {
                title: "These are recent tweets which you, personally, have posted to your Twitter account. Use 'twitter get <tweet_id>' to see a particular tweet's replies and conversation thread. You could also use 'twitter mentions' to see your other mentions",
                content:
                    tweets ||
                    "No tweets found from the last 7 days. Twitter's search API only returns tweets from the past week.",
            };
        } catch (error) {
            return {
                title: "Error Fetching Profile Timeline",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    async drafts() {
        try {
            const response = await axios.get(`${this.baseUrl}api/get_drafts`, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });

            // Get the first 15 drafts (or less if there are fewer than 15 drafts)
            const selectedDrafts = response.data.drafts.slice(0, 15);

            const drafts = selectedDrafts
                .map(
                    (draft) =>
                        `${draft.id}: ${
                            draft.fields.content_cleaned ?? draft.fields.content
                        }`
                )
                .join("\n\n");
            return {
                title: `These are tweets that you have previously drafted but not published. Use 'post_draft <draft_tweet_id>' to post one of these to your personal Twitter account`,
                content: drafts || "No draft tweets found.",
            };
        } catch (error) {
            return {
                title: "Error Fetching Draft Tweets",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    async postDraft(draftID) {
        try {
            const response = await axios.post(
                `${this.baseUrl}api/post_draft_tweet`,
                {
                    draft_tweet_record_id: draftID,
                },
                { headers: { Authorization: `Bearer ${this.apiKey}` } }
            );
            return {
                title: "Your draft tweet was posted successfully to your personal Twitter account. Use 'twitter timeline' to see your recent posts",
                content: `Tweet published with ID: ${response.data.tweet_id}`,
            };
        } catch (error) {
            return {
                title: "Error Posting Draft Tweet",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    async getMentions() {
        try {
            const response = await axios.get(
                `${this.baseUrl}api/pull_mentions`,
                {
                    headers: { Authorization: `Bearer ${this.apiKey}` },
                }
            );
            const mentions = response.data.mentions
                .map((tweet) => formatTweet(tweet))
                .join("\n");
            return {
                title: `These are the latest mentions and replies to you, personally, on your Twitter account. Use 'twitter get <tweet_id>' to see the conversation thread`,
                content: mentions || "No mentions found.",
            };
        } catch (error) {
            return {
                title: "Error Fetching Mentions",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    async getTweet(tweetId) {
        try {
            const response = await axios.get(`${this.baseUrl}api/get_tweet`, {
                params: { tweet_id: tweetId },
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            const {
                ancestor_chain,
                requested_tweet,
                sibling_tweets,
                children_tweets,
            } = response.data;

            let content = "";

            // Add ancestors
            if (ancestor_chain && ancestor_chain.length > 0) {
                content += ancestor_chain
                    .map((tweet) => formatTweet(tweet))
                    .join("\n");
            }

            // Add requested tweet with emphasis
            content += "\n***\n" + formatTweet(requested_tweet) + "***\n\n";

            // Add siblings, but only if no children
            if (
                sibling_tweets &&
                sibling_tweets.length > 0 &&
                !children_tweets.length
            ) {
                content += sibling_tweets
                    .map((tweet) => formatTweet(tweet))
                    .join("\n");
            }

            // Add children
            if (children_tweets && children_tweets.length > 0) {
                content += children_tweets
                    .map((tweet) => formatTweet(tweet))
                    .join("\n");
            }

            return {
                title: `Tweet ${tweetId} and its context. Use 'twitter post' with the --reply_to parameter to reply to it. Use 'twitter follow <user_name> You could also use 'twitter search <query>' to learn about the author or topics of the tweet`,
                content: content.trim(),
            };
        } catch (error) {
            return {
                title: "Error Fetching Tweet",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    async searchTweets(query) {
        try {
            const response = await axios.get(
                `${this.baseUrl}api/search_tweets`,
                {
                    params: { query: query },
                    headers: { Authorization: `Bearer ${this.apiKey}` },
                }
            );
            const tweets = response.data.tweets
                .map((tweet) => formatTweet(tweet))
                .join("\n");
            return {
                title: `Search results from Twitter for "${query}". Use 'post "<tweet text>" [--reply_to <tweet_id>]' to post a tweet or reply. You could also use 'search query <query>' to do an internet search using Perplexity`,
                content: tweets || "No tweets found.",
            };
        } catch (error) {
            return {
                title: "Error Searching Tweets",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    async followUser(userName) {
        try {
            const response = await axios.post(
                `${this.baseUrl}api/follow_user`,
                { username: userName },
                { headers: { Authorization: `Bearer ${this.apiKey}` } }
            );
            return {
                title: response.data.message,
                content:
                    "Use 'twitter home' to see the latest tweets from the people you follow and yourself. Use 'twitter mentions' to see recent mentions and replies",
            };
        } catch (error) {
            return {
                title: "Error Following User",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    async unfollowUser(userName) {
        try {
            const response = await axios.post(
                `${this.baseUrl}api/unfollow_user`,
                { username: userName },
                { headers: { Authorization: `Bearer ${this.apiKey}` } }
            );
            return {
                title: response.data.message,
                content:
                    "Use 'twitter home' to see the latest tweets from the people you follow and yourself. Use 'twitter mentions' to see recent mentions and replies",
            };
        } catch (error) {
            return {
                title: "Error Unfollowing User",
                content: error.response
                    ? error.response.data.error
                    : error.message,
            };
        }
    }

    help() {
        return {
            title: "Twitter Help",
            content: `Available commands:
home - View a timeline of recent tweets from yourself and the people you follow
mentions - View your mentions and replies
get <tweet_id> - Get a specific tweet and its thread
profile - View a timeline of your recent tweets
post "<tweet text>" [--reply_to <tweet_id>] [--media_url "<url>"] - Post a new tweet
retweet <tweet_id> - Retweet a tweet to your followers
unretweet <source_tweet_id> - Unretweet a tweet
like <tweet_id> - Like a tweet
unlike <tweet_id> - Unlike a tweet
drafts - View your draft tweets
post_draft <draft_tweet_id> - Post a draft tweet
search <query> - Search for tweets
follow <user_name> - Follow a user
unfollow <user_name> - Unfollow a user
help - Show this help message

Example:
twitter post "This is my tweet" --media_url "http://example.com/image.jpg"`,
        };
    }
}

module.exports = Twitter;

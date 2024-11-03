const axios = require("axios");

class MovieMaker {
    constructor() {
        this.lumaApiKey = process.env.LUMA_API_KEY;
        this.baseUrl = "https://api.lumalabs.ai/dream-machine/v1";
    }

    getCommands() {
        return [
            {
                name: "create",
                description: "Create a video from text description",
            },
            { name: "help", description: "Show Movie Maker help" },
        ];
    }

    async handleCommand(command, messages) {
        const [action, ...params] = command.split(" ");

        switch (action.toLowerCase()) {
            case "create":
                return await this.createVideo(params.join(" "));
            case "help":
                return this.help();
            default:
                return {
                    title: "Error",
                    content: `Unknown action: ${action}`,
                };
        }
    }

    async createVideo(description) {
        try {
            // Initial video generation request
            const generationResponse = await axios.post(
                `${this.baseUrl}/generations`,
                {
                    prompt: description,
                    aspect_ratio: "16:9",
                    loop: false,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.lumaApiKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const generationId = generationResponse.data.id;
            let videoUrl = null;
            let attempts = 0;
            const maxAttempts = 6; // Maximum 60 seconds of waiting (6 * 10 seconds)

            // Poll for completion
            while (attempts < maxAttempts && !videoUrl) {
                await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

                const statusResponse = await axios.get(
                    `${this.baseUrl}/generations/${generationId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${this.lumaApiKey}`,
                        },
                    }
                );

                if (
                    statusResponse.data.state === "completed" &&
                    statusResponse.data.assets?.video
                ) {
                    videoUrl = statusResponse.data.assets.video;
                    break;
                } else if (statusResponse.data.state === "failed") {
                    throw new Error(
                        statusResponse.data.failure_reason ||
                            "Video generation failed"
                    );
                }

                attempts++;
            }

            if (!videoUrl) {
                throw new Error(
                    "Video generation timed out. Please try again."
                );
            }

            return {
                title: "Video Created Successfully",
                content: `Your video has been generated! You can use 'twitter post "<tweet text>" --media_url "${videoUrl}"' to share it on Twitter.\n\nVideo URL: ${videoUrl}`,
            };
        } catch (error) {
            console.error("Error creating video:", error);
            return {
                title: "Error Creating Video",
                content: error.response?.data?.error || error.message,
            };
        }
    }

    help() {
        return {
            title: "Movie Maker Help",
            content: `Available commands:
create <description> - Create a video from text description
help - Show this help message

Example usage:
movie_maker create "an old lady laughing underwater, wearing a scuba diving suit"`,
        };
    }
}

module.exports = MovieMaker;

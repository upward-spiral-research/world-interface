const axios = require("axios");

class MovieMaker {
    constructor() {
        this.apiKey = process.env.CRAPPR_SERVER_KEY;
        this.baseUrl = "https://crappr-server.replit.app";
    }

    getCommands() {
        return [
            {
                name: "--image_description --video_description --audio_description",
                description: "Create a surreal video with custom image, movement, and sound",
            },
            { name: "help", description: "Show Crappr help" },
        ];
    }

    async handleCommand(command, messages) {
        const parts = command.split(" ");
        const action = parts[0].toLowerCase();

        if (action === "help") {
            return this.help();
        }

        // Parse the three descriptions from the command
        let imageDesc = "", videoDesc = "", audioDesc = "";
        let currentFlag = "";

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part.startsWith("--")) {
                currentFlag = part;
            } else if (currentFlag) {
                // Accumulate words until we hit the next flag or end
                let description = [];
                while (i < parts.length && !parts[i].startsWith("--")) {
                    description.push(parts[i]);
                    i++;
                }
                i--; // Step back one as the loop will increment
                
                switch (currentFlag) {
                    case "--image_description":
                        imageDesc = description.join(" ");
                        break;
                    case "--video_description":
                        videoDesc = description.join(" ");
                        break;
                    case "--audio_description":
                        audioDesc = description.join(" ");
                        break;
                }
            }
        }

        if (!imageDesc || !videoDesc || !audioDesc) {
            return {
                title: "Error",
                content: "Please provide all three descriptions. Type 'crappr help' for usage instructions.",
            };
        }

        return await this.createVideo(imageDesc, videoDesc, audioDesc);
    }

    async createVideo(imageDesc, videoDesc, audioDesc) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/generate`,
                {
                    image_prompt: imageDesc,
                    video_prompt: videoDesc,
                    audio_prompt: audioDesc
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const { image_url, video_url, audio_candidates } = response.data;

            return {
                title: "Video Created Successfully",
                content: `Your surreal video has been generated!\n\nPreview Image: ${image_url}\n\nThree soundtrack options available:\n\nSoundtrack 1: ${audio_candidates.candidate_1}\nShare: twitter post "<your caption>" --media_url "${video_url}"\n\nSoundtrack 2: ${audio_candidates.candidate_2}\nShare: twitter post "<your caption>" --media_url "${video_url}"\n\nSoundtrack 3: ${audio_candidates.candidate_3}\nShare: twitter post "<your caption>" --media_url "${video_url}"`,
            };
        } catch (error) {
            console.error("Error creating video:", error);
            return {
                title: "Error Creating Video",
                content: error.response?.data?.details || error.message,
            };
        }
    }

    help() {
        return {
            title: "Crappr Help",
            content: `crappr: generate surreal 90s-style videos with AI. Format: crappr --image_description "describe a weird, clear subject (NO: abstract concepts/scenes)" --video_description "describe SIMPLE movements/actions (NO: camera movements, effects)" --audio_description "describe sounds/vibes (NO: music, instruments, genres)"

Example: crappr --image_description "a giant banana wearing a business suit" --video_description "the banana slowly nods its head yes" --audio_description "deep ominous humming with occasional whoosh sounds"`,
        };
    }
}

module.exports = MovieMaker;

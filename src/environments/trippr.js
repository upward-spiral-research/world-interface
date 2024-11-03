const axios = require("axios");

class Trippr {
    constructor() {
        this.replicateApiKey = process.env.REPLICATE_API_KEY;
        this.baseUrl = "https://api.replicate.com/v1";
        this.modelVersion =
            "15c6189d8a95836c3c296333aac9c416da4dfb0ae42650d4f10189441f29529f";
    }

    getCommands() {
        return [
            {
                name: "create",
                description: "Create an image from text description",
            },
            { name: "help", description: "Show Trippr help" },
        ];
    }

    async handleCommand(command, messages) {
        const [action, ...params] = command.split(" ");

        switch (action.toLowerCase()) {
            case "create":
                return await this.createImage(params.join(" "));
            case "help":
                return this.help();
            default:
                return {
                    title: "Error",
                    content: `Unknown action: ${action}`,
                };
        }
    }

    async createImage(description) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/predictions`,
                {
                    version: this.modelVersion,
                    input: {
                        width: 1024,
                        height: 1024,
                        prompt: description,
                        lora_scale: 1.2,
                        num_outputs: 1,
                        aspect_ratio: "1:1",
                        output_quality: 80,
                        extra_lora_scale: 0.8,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.replicateApiKey}`,
                        "Content-Type": "application/json",
                        Prefer: "wait",
                    },
                }
            );

            const imageUrl = response.data.output[0]; // Assuming the API returns the image URL in this format

            return {
                title: "Image Created Successfully",
                content: `Your image has been generated! You can use 'twitter post "<tweet text>" --media_url "${imageUrl}"' to share it on Twitter.\n\nImage URL: ${imageUrl}`,
            };
        } catch (error) {
            console.error("Error creating image:", error);
            return {
                title: "Error Creating Image",
                content: error.response?.data?.error || error.message,
            };
        }
    }

    help() {
        return {
            title: "Trippr Help",
            content: `Available commands:
create <description> - Create an image from text description
help - Show this help message

Example usage:
trippr create "put your description here, referencing whatever you like, and any style descriptors."

You will be returned a URL to the image, which you can then use in a tweet. Pornographic or NSFW content will fail to be generated, but you can otherwise generate anything you want.`,
        };
    }
}

module.exports = Trippr;

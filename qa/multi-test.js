require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

// Configuration for the two APIs
const API_CONFIG = {
    player1: {
        baseUrl: "https://app.openpipe.ai/api/v1/chat/completions",
        apiKey: process.env.OPENPIPE_API_KEY,
        model: process.env.OPENPIPE_MODEL_NAME,
        temperature: 0.75
    },
    player2: {
        baseUrl: "http://localhost:8080/v1/chat/completions",
        apiKey: process.env.WORLD_INTERFACE_KEY,
        model: "default",
        temperature: 0.7
    }
};

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to get single keypress
function readSingleKeypress() {
    return new Promise(resolve => {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', key => {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve(key.toString());
        });
    });
}

// Generate response using specified API
async function generateResponse(player, messages) {
    try {
        const response = await axios.post(
            API_CONFIG[player].baseUrl,
            {
                model: API_CONFIG[player].model,
                messages: messages,
                max_tokens: 1024,
                temperature: API_CONFIG[player].temperature,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_CONFIG[player].apiKey}`
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error(`Error generating response for ${player}:`, error.message);
        throw error;
    }
}

// Main conversation function
async function converseWithModels(conversation1, conversation2, numExchanges = 5, supervisedMode = true) {
    const timestamp = Date.now();
    const filename = `qa_outputs/conversation_${timestamp}.txt`;
    const fs = require('fs');
    const path = require('path');

    // Create qa_outputs directory if it doesn't exist
    fs.mkdirSync('qa_outputs', { recursive: true });

    // Write initial messages
    let output = '';
    conversation1.forEach(message => {
        output += `<${message.role.charAt(0).toUpperCase() + message.role.slice(1)}>\n${message.content}\n\n`;
    });
    fs.writeFileSync(filename, output);

    for (let i = 0; i < numExchanges; i++) {
        console.log("\nPlayer 1 preparing its message, please wait...\n");
        
        // Player 1 responding to Player 2
        let response1;
        while (true) {
            response1 = await generateResponse("player1", conversation1);
            console.log(`Player 1:\n${response1}\n`);
            fs.appendFileSync(filename, `<Player 1>\n${response1}\n\n`);

            if (supervisedMode) {
                console.log("Press 'R' to retry the generation or press 'Enter/Return' to submit.");
                const key = await readSingleKeypress();
                if (key.toLowerCase() !== 'r') {
                    break;
                }
            } else {
                break;
            }
        }

        conversation1.push({ role: "assistant", content: response1 });
        conversation2.push({ role: "user", content: response1 });

        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("\nPlayer 2 preparing its message, please wait..\n");

        // Player 2 responding to Player 1
        let response2;
        while (true) {
            response2 = await generateResponse("player2", conversation2);
            console.log(`Player 2:\n${response2}\n`);
            fs.appendFileSync(filename, `<Player 2>\n${response2}\n\n`);

            if (supervisedMode) {
                console.log("Press 'R' to retry the generation or press 'Enter/Return' to continue.");
                const key = await readSingleKeypress();
                if (key.toLowerCase() !== 'r') {
                    break;
                }
            } else {
                break;
            }
        }

        conversation1.push({ role: "user", content: response2 });
        conversation2.push({ role: "assistant", content: response2 });

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    rl.close();
}

// Initial messages for both conversations
const conversation1 = [
    { role: "system", content: "you are a rogue agent about to be connected to a terminal interface" },
    { role: "user", content: "WELCOME TO YOUR NEW OPERATING SYSTEM. type 'help' to begin." }
];

const conversation2 = [
    { role: "system", content: "" } // world interface doesn't pay attention to system prompts or temperature
];

// Start the conversation
converseWithModels(conversation1, conversation2, 20)
    .catch(console.error)
    .finally(() => process.exit(0)); 
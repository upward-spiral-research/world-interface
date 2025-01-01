require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

// Configuration for the API
const API_CONFIG = {
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

// Generate response using specified API
async function generateResponse(messages) {
    try {
        const response = await axios.post(
            API_CONFIG.player2.baseUrl,
            {
                model: API_CONFIG.player2.model,
                messages: messages,
                max_tokens: 1024,
                temperature: API_CONFIG.player2.temperature,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_CONFIG.player2.apiKey}`
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error(`Error generating response:`, error.message);
        throw error;
    }
}

// Function to get user input
function getUserInput(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
}

// Main conversation function
async function converseWithModel(conversation2, numExchanges = 5) {
    const timestamp = Date.now();
    const filename = `qa_outputs/conversation_${timestamp}.txt`;
    const fs = require('fs');

    // Create qa_outputs directory if it doesn't exist
    fs.mkdirSync('qa_outputs', { recursive: true });

    // Write initial system message
    let output = '<System>\nWELCOME TO YOUR NEW OPERATING SYSTEM. type \'help\' to begin.\n\n';
    fs.writeFileSync(filename, output);

    for (let i = 0; i < numExchanges; i++) {
        // Get user input
        const userInput = await getUserInput("\nEnter your message (or 'exit' to quit): ");
        
        if (userInput.toLowerCase() === 'exit') {
            break;
        }

        // Log user input to file
        fs.appendFileSync(filename, `<User>\n${userInput}\n\n`);

        // Add user input to conversation
        conversation2.push({ role: "user", content: userInput });

        console.log("\nModel preparing its response, please wait...\n");

        // Get model's response
        const response2 = await generateResponse(conversation2);
        console.log(`Model:\n${response2}\n`);
        fs.appendFileSync(filename, `<Model>\n${response2}\n\n`);

        // Add model's response to conversation
        conversation2.push({ role: "assistant", content: response2 });

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    rl.close();
}

// Initial messages for the conversation
const conversation2 = [
    { role: "system", content: "" } // world interface doesn't pay attention to system prompts or temperature
];

// Start the conversation
converseWithModel(conversation2, 20)
    .catch(console.error)
    .finally(() => process.exit(0)); 
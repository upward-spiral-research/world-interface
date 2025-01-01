// src/middleware/command-preprocessor.js
const Replicate = require("replicate");

async function preprocessCommand(command, availableCommands, messages) {
    // Check if the command is valid
    const isValidCommand = checkValidCommand(command, availableCommands);

    if (isValidCommand) {
        return { processedCommand: command, helpText: null };
    }

    // If the command is invalid, use Replicate to correct it
    const correctedCommand = await correctCommandWithLLM(
        command,
        availableCommands,
        messages
    );

    return correctedCommand;
}

function checkValidCommand(command, availableCommands) {
    console.log("Checking command validity:", command);
    const [firstWord, ...rest] = command.split(" ");

    // Check if the first word is a valid environment
    if (availableCommands[firstWord]) {
        const action = rest[0];
        const isValid = availableCommands[firstWord].some(
            (cmd) => cmd.name === action
        );
        console.log(
            `Command starts with valid environment '${firstWord}', action '${action}' is valid: ${isValid}`
        );
        return isValid;
    }

    // If it's not a valid environment, check if it's a global command
    const globalCommands = ["help"]; // Add any other global commands here
    const isGlobalCommand = globalCommands.includes(firstWord);
    console.log(
        `Command '${firstWord}' is a valid global command: ${isGlobalCommand}`
    );

    // If it's not a global command, check if it's a command that belongs to any environment
    if (!isGlobalCommand) {
        const isEnvironmentCommand = Object.values(availableCommands).some(
            (envCommands) => envCommands.some((cmd) => cmd.name === firstWord)
        );
        console.log(
            `Command '${firstWord}' is an environment-specific command without its environment: ${isEnvironmentCommand}`
        );
        return false; // We return false here because we want to process these commands
    }

    return isGlobalCommand;
}

async function correctCommandWithLLM(command, availableCommands, messages) {
    const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
    });

    const systemPrompt = `You are a command preprocessor for an OS simulator. Available commands: ${JSON.stringify(
        availableCommands
    )}. Your task is to correct invalid commands and provide helpful feedback. If a command is missing its environment prefix (e.g., 'timeline' instead of 'twitter timeline'), add the correct prefix. If the syntax is incorrect, take your best guess at correcting it, e.g. meme_magic --input 'a hot pickle' might become meme generate --image_desc 'a hot pickle'. Always return your response in the format: {"processedCommand": "corrected command", "helpText": "explanation"}`;

    const input = {
        prompt: `The user entered: "${command}". If this is not a valid command or if it's missing its environment prefix, please correct it and provide a brief explanation.`,
        max_tokens: 200,
        temperature: 0,
        system: systemPrompt,
        messages: [
            ...messages.slice(-5), // Include the last 5 messages for context
            { role: "user", content: command }
        ]
    };

    try {
        let fullResponse = '';
        for await (const event of replicate.stream(
            "meta/meta-llama-3.1-405b-instruct",
            { input }
        )) {
            fullResponse += event;
        }

        console.log({ availableCommands: JSON.stringify(availableCommands), userCommand: command, fullResponse });

        const parsedResponse = JSON.parse(fullResponse);

        return {
            processedCommand: parsedResponse.processedCommand,
            helpText: parsedResponse.helpText,
        };
    } catch (error) {
        console.error("Error calling Replicate:", error);
        return {
            processedCommand: command,
            helpText: "Unable to process command. Please try again.",
        };
    }
}

module.exports = preprocessCommand;

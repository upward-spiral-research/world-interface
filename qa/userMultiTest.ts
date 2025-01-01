import dotenv from 'dotenv';
import axios from 'axios';
import readline from 'readline';
import fs from 'fs';

dotenv.config();

interface ApiConfig {
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
  temperature: number;
}

interface ApiConfigs {
  player2: ApiConfig;
}

const API_CONFIG: ApiConfigs = {
  player2: {
    baseUrl: 'http://localhost:8080/v1/chat/completions',
    apiKey: process.env.WORLD_INTERFACE_KEY,
    model: 'default',
    temperature: 0.7,
  },
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function generateResponse(messages: ChatMessage[]): Promise<string> {
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
          Authorization: `Bearer ${API_CONFIG.player2.apiKey}`,
        },
      },
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      `Error generating response:`,
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

function getUserInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function converseWithModel(
  conversation2: ChatMessage[],
  numExchanges: number = 5,
): Promise<void> {
  const timestamp = Date.now();
  const filename = `qa_outputs/conversation_${timestamp}.txt`;

  fs.mkdirSync('qa_outputs', { recursive: true });

  const output = "<System>\nWELCOME TO YOUR NEW OPERATING SYSTEM. type 'help' to begin.\n\n";
  fs.writeFileSync(filename, output);

  for (let i = 0; i < numExchanges; i++) {
    const userInput = await getUserInput("\nEnter your message (or 'exit' to quit): ");

    if (userInput.toLowerCase() === 'exit') {
      break;
    }

    fs.appendFileSync(filename, `<User>\n${userInput}\n\n`);

    conversation2.push({ role: 'user', content: userInput });

    console.log('\nModel preparing its response, please wait...\n');

    const response2 = await generateResponse(conversation2);
    console.log(`Model:\n${response2}\n`);
    fs.appendFileSync(filename, `<Model>\n${response2}\n\n`);

    conversation2.push({ role: 'assistant', content: response2 });

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  rl.close();
}

const conversation2: ChatMessage[] = [{ role: 'system', content: '' }];

converseWithModel(conversation2, 20)
  .catch(console.error)
  .finally(() => process.exit(0));

import { Request, Response } from 'express';
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import { CommandHandler } from './commandHandler';
import { preprocessCommand } from './middleware/commandPreprocessor';
import { EnvironmentRegistry } from './environmentRegistry';
import { globalState } from './globalState';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const environmentRegistry = new EnvironmentRegistry();
const commandHandler = new CommandHandler(environmentRegistry);
// const worldInterfaceKey = process.env.WORLD_INTERFACE_KEY;

// Type the middleware function
// const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (token == null) {
//     res.sendStatus(401);
//   }

//   // In a real-world scenario, you'd validate the token against a database or external auth service
//   // For this example, we'll use a hardcoded token
//   if (token !== worldInterfaceKey) {
//     res.sendStatus(403);
//   }

//   next();
// };

// Apply authentication middleware to all routes
// app.use(authenticateToken);

// Define interfaces for the message structure
interface ChatMessage {
  role: string;
  content: string;
}

app.post('/v1/chat/completions', async (req: Request, res: Response) => {
  const { messages, stream = false }: { messages: ChatMessage[]; stream?: boolean } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid input: messages array is required' });
  }

  const lastUserMessage = messages
    .slice()
    .reverse()
    .find((msg) => msg.role === 'user');

  if (!lastUserMessage) {
    return res.status(400).json({ error: 'No user message found' });
  }

  const allCommands = environmentRegistry.getAllCommands();
  const { processedCommand, helpText } = await preprocessCommand(
    lastUserMessage.content,
    allCommands,
    messages,
  );

  console.log('Processed command:', processedCommand);

  // Update global state
  globalState.update({
    currentTime: new Date().toLocaleString(),
    firstMessage: messages.length === 1,
  });

  try {
    const result: { ui: string } = await commandHandler.handle(processedCommand, messages);
    if (helpText) {
      result.ui = `Preprocessor: ${helpText}\n\n${result.ui}`;
    }

    if (stream) {
      // Set appropriate headers for streaming
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      // Split the response into chunks (here we use words, but you could use characters or sentences)
      const chunks = result.ui.split(' ');
      let index = 0;

      // Simulate streaming by sending chunks with a small delay
      // Streaming isn't actually supported but this lets us drop this into environments which expect it
      // It's a horrible hack lol
      const streamInterval = setInterval(() => {
        if (index < chunks.length) {
          const chunk = chunks[index];
          const streamResponse = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: 'os-simulator-1',
            choices: [
              {
                index: 0,
                delta: {
                  content: chunk + ' ',
                },
                finish_reason: null,
              },
            ],
          };
          res.write(`data: ${JSON.stringify(streamResponse)}\n\n`);
          index++;
        } else {
          // Send the final chunk
          const finalResponse = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: 'os-simulator-1',
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: 'stop',
              },
            ],
          };
          res.write(`data: ${JSON.stringify(finalResponse)}\n\n`);
          res.write('data: [DONE]\n\n');
          clearInterval(streamInterval);
          res.end();
        }
      }, 1); // Adjust this delay as needed
    } else {
      // Non-streaming response (unchanged)
      const response = {
        id: 'chatcmpl-' + Date.now(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'os-simulator-1',
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
        choices: [
          {
            message: {
              role: 'assistant',
              content: result.ui,
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      };
      res.json(response);
    }
  } catch (error) {
    console.error('Error handling command:', error);
    res.status(500).json({
      error: 'An error occurred while processing the command',
    });
  }
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

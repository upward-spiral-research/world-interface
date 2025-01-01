import { OpenAI } from 'openai';

interface SearchResult {
  title: string;
  content: string;
  error?: string;
}

export class Search {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
    });
  }

  getCommands(): Array<{ name: string; description: string }> {
    return [
      { name: 'query', description: 'Perform a query using Perplexity' },
      // { name: "analyze", description: "Analyze data" },
      { name: 'help', description: 'Show Search help' },
    ];
  }

  async handleCommand(command: string): Promise<SearchResult> {
    const [action, ...params] = command.split(' ');

    switch (action.toLowerCase()) {
      case 'query':
        console.log('querying', command);
        return await this.query(params.join(' '));
      // case "analyze":
      //     return this.analyze(params.join(" "));
      case 'help':
        return this.help();
      default:
        return {
          title: 'Error',
          content: `Unknown action: ${action}`,
        };
    }
  }

  async query(queryString: string): Promise<SearchResult> {
    console.log('Query string received:', queryString);
    const systemPrompt = `
            Be precise and concise.
        `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'llama-3.1-sonar-small-128k-online',
        max_tokens: 400,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${queryString}` },
        ],
        // TODO: figure out how to use this w/o a type error
        // return_citations: true,
      });
      console.log('Raw Perplexity API response:', JSON.stringify(response, null, 2));
      const result = {
        title:
          "Search results from Perplexity. Use 'exo query' to discuss with Claude. You could also use 'exo create_note <note_string>' to write a thought down for later",
        content: response.choices[0].message.content ?? 'No content returned',
      };
      console.log('Formatted result from query:', result);
      return result;
    } catch (error) {
      console.error('Error querying Perplexity:', error);
      return {
        title: 'Search Query Error',
        content: 'An error occurred while processing your query. Please try again later.',
      };
    }
  }

  // analyze(dataString) {
  //     return {
  //         title: "Search Analysis",
  //         content: `Analysis performed on: "${dataString}"\nFindings: [Simulated analysis results would appear here]`,
  //     };
  // }

  help(): SearchResult {
    return {
      title: 'Search Help',
      content:
        'Available commands:\nquery <query_string> - Perform an internet search using Perplexity', //\nanalyze <data> - Analyze data",
    };
  }
}

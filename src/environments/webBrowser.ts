import axios from 'axios';

interface CommandDefinition {
  name: string;
  description: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    metadata: {
      title: string;
    };
    markdown: string;
  };
}

interface CommandResponse {
  title: string;
  content: string;
  imageUrl?: string;
  tweet?: string;
  error?: string;
}

export class WebBrowser {
  private firecrawlApiUrl: string;
  private firecrawlApiKey: string;

  constructor() {
    this.firecrawlApiUrl = 'https://api.firecrawl.dev/v1/scrape';
    this.firecrawlApiKey = process.env.FIRECRAWL_API_KEY || '';
  }

  getCommands(): CommandDefinition[] {
    return [
      {
        name: 'open',
        description: 'Open a URL and see the contents of a page.',
      },
      { name: 'help', description: 'Show Web Browser help' },
    ];
  }

  async handleCommand(command: string): Promise<CommandResponse> {
    const [action, ...params] = command.split(' ');

    switch (action.toLowerCase()) {
      case 'open':
        return await this.openLink(params.join(' '));
      case 'help':
        return this.help();
      default:
        return {
          title: 'Error',
          content: `Unknown action: ${action}`,
        };
    }
  }

  async openLink(url: string): Promise<CommandResponse> {
    try {
      const response = await axios.post<ApiResponse>(
        this.firecrawlApiUrl,
        {
          url: url,
          formats: ['markdown'],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.firecrawlApiKey}`,
          },
        },
      );

      if (response.data.success) {
        console.log('response.data', response.data);
        return {
          title: `PAGE TITLE: ${response.data.data.metadata.title}`,
          content: `PAGE CONTENT:\n\n${response.data.data.markdown}\n\n---\n\nif you want to navigate to another page, use the 'web open' command. you will need to prefix the link with the root url of the site you're on, as in most cases links will be relative. You may also wish to search the internet using the 'search' command or use 'twitter post' to post a message to Twitter. up to you`,
        };
      } else {
        throw new Error('API request was not successful');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      return {
        title: 'Error',
        content: `Error opening link: ${error}`,
        error: `Error opening link: ${error}`,
      };
    }
  }

  help(): CommandResponse {
    return {
      title: 'Web Browser Help',
      content: `Available commands:
open <url> - Open a URL and see the contents of a page.
help - Show this help message

Example usage:
web open https://www.wikipedia.org/random`,
    };
  }
}

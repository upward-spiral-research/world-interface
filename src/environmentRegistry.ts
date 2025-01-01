import { Twitter } from './environments/twitter';
import { Exo } from './environments/exo';
import { Search } from './environments/search';
import { Sydney } from './environments/sydney';
import { WebBrowser } from './environments/webBrowser';

interface Command {
  name: string;
  description: string;
}

interface Environment {
  getCommands(): Command[];
  handleCommand(command: string, messages: any[]): Promise<CommandResult>;
}

interface CommandResult {
  title: string;
  content: string;
  imageUrl?: string;
  tweet?: string;
}

interface EnvironmentMap {
  [key: string]: Environment;
}

interface CommandMap {
  [key: string]: Command[];
}

export class EnvironmentRegistry {
  private environments: EnvironmentMap;

  constructor() {
    this.environments = {
      twitter: new Twitter(),
      exo: new Exo(),
      search: new Search(),
      sydney: new Sydney(),
      web: new WebBrowser(),
    };
  }

  getEnvironment(name: string): Environment | undefined {
    return this.environments[name.toLowerCase()];
  }

  getEnvironmentNames(): string[] {
    return Object.keys(this.environments);
  }

  getAllCommands(): CommandMap {
    console.log('getting all valid commands');
    const commands: CommandMap = {};
    for (const [envName, env] of Object.entries(this.environments)) {
      commands[envName] = env.getCommands();
    }
    return commands;
  }
}

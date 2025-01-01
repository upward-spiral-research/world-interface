import { UiRenderer } from './uiRenderer';
import { globalState } from './globalState';

interface CommandResult {
  title: string;
  content: string;
}

interface HandleResult {
  ui: any; // Consider defining a more specific type based on what UiRenderer.render returns
}

export class CommandHandler {
  private registry: any; // Replace 'any' with your EnvironmentRegistry type
  private renderer: UiRenderer;

  constructor(environmentRegistry: any) {
    // Replace 'any' with your EnvironmentRegistry type
    this.registry = environmentRegistry;
    this.renderer = new UiRenderer();
  }

  async handle(command: string, messages: any[]): Promise<HandleResult> {
    // Define proper type for messages if possible
    const [envName, ...rest] = command.split(' ');

    const env = this.registry.getEnvironment(envName);
    console.log('Command Handler Firing', 'command:', command);
    let result: CommandResult;

    if (env) {
      result = await env.handleCommand(rest.join(' '), messages);
    } else if (command.toLowerCase() === 'help') {
      result = this.getGlobalHelp();
    } else {
      result = this.handleUnrecognizedCommand(command);
    }

    const globalStateData = globalState.get();
    const ui = this.renderer.render(command, result, globalStateData);
    return { ui };
  }

  private getGlobalHelp(): CommandResult {
    const environments = this.registry.getEnvironmentNames();
    return {
      title: 'Global Help',
      content: `Available environments: ${environments.join(
        ', ',
      )}\nUse "<environment> help" for environment-specific commands.`,
    };
  }

  private handleUnrecognizedCommand(command: string): CommandResult {
    return {
      title: 'Error',
      content: `Unrecognized command: ${command}\nType "help" for available commands.`,
    };
  }
}

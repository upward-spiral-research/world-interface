# world interface 0.1

This project simulates a command-line operating system interface, designed to be called by agentic large language models (LLMs). It is exposed as an OpenAI-compatible API and is completely stateless.
For an example of an LLM using it: https://dreams.infinitebackrooms.com/AndyAyrey/3Nir1p6x-c

## Table of Contents

-   [Features](#features)
-   [Getting Started](#getting-started)
-   [Usage](#usage)
-   [Adding New Environments](#adding-new-environments)
-   [Current Environments](#current-environments)
-   [Future Improvements](#future-improvements)
-   [License](#license)

## Features

-   **Multiple App Environments:** Add adapters for apps like Twitter, Perplexity, and other real world applications, transforming operations into an LLM-friendly command line syntax with ample 'help' extensions.
-   **Extensible Architecture:** Easily add new environments by adding a new adapter and linking it in `environment-registry.js`
-   **Command preprocessing** gently corrects tool syntax using using any OpenAI compatible endpoint to allow your agent how to use the tools in-context
-   **OpenAI-compatible API endpoint** - drop this in anywhere you're already handling a context window. (see `qa/multi-test.py` for an example of why this is useful)

## Getting Started

Make sure you have Node.js installed.

1. Clone the repository
2. Install dependencies: `npm install`
3. Familarise yourself with the environments and adapters in `src/environments`. (n.b. some of them require other services to be running which I'm yet to release, sorry!)
4. Set up environment variables - `cp .env.example .env` and populate with your keys. Set your `WORLD_INTERFACE_KEY` to anything you like!
5. Start the server: `npm start`

The server will start on port 3000 by default. Prompt it as you would any chatbot.

## Usage

Send POST requests to `/v1/chat/completions` with the following structure:

```json
{
    "messages": [{ "role": "user", "content": "twitter post Hello, world!" }]
}
```

Include the header `Authorization: Bearer WHATEVER_YOU_SET_YOUR_WORLD_INTERFACE_KEY_TO` for authentication.

## Adding New Environments

To add a new environment:

1. **Create a New Environment File**

    Add your environment's JavaScript file in the `src/environments/` directory. For example, to add a `weather` environment:

    ```javascript:src/environments/weather.js
    const axios = require('axios');

    class Weather {
        getCommands() {
            return [
                { name: "current", description: "Get current weather for a location" },
                { name: "forecast", description: "Get weather forecast for a location" },
            ];
        }

        async handleCommand(command, messages) {
            const [action, ...params] = command.split(" ");
            const location = params.join(" ");

            switch (action.toLowerCase()) {
                case "current":
                    return await this.getCurrentWeather(location);
                case "forecast":
                    return await this.getWeatherForecast(location);
                case "help":
                    return this.help();
                default:
                    return { error: `Unknown action: ${action}` };
            }
        }

        async getCurrentWeather(location) {
            try {
                const response = await axios.get(`https://api.weather.com/v3/weather/conditions`, {
                    params: { location, apiKey: process.env.WEATHER_API_KEY },
                });
                return {
                    title: `Current Weather for ${location}`,
                    content: `Temperature: ${response.data.temperature}\nConditions: ${response.data.conditions}`,
                };
            } catch (error) {
                return {
                    title: "Error Fetching Weather",
                    content: error.response ? error.response.data.error : error.message,
                };
            }
        }

        async getWeatherForecast(location) {
            try {
                const response = await axios.get(`https://api.weather.com/v3/weather/forecast`, {
                    params: { location, apiKey: process.env.WEATHER_API_KEY },
                });
                return {
                    title: `Weather Forecast for ${location}`,
                    content: `Tomorrow: ${response.data.forecast}`,
                };
            } catch (error) {
                return {
                    title: "Error Fetching Weather Forecast",
                    content: error.response ? error.response.data.error : error.message,
                };
            }
        }

        help() {
            return {
                title: "Weather Environment Help",
                content: `Available commands:
        - current <location> - Get current weather for a location
        - forecast <location> - Get weather forecast for a location`,
            };
        }
    }

    module.exports = Weather;
    ```

2. **Register the New Environment**

    Add your new environment to the `src/environment-registry.js` to make it available for use.

    ```javascript:src/environment-registry.js
    const Twitter = require('./environments/twitter');
    const Exo = require('./environments/exo');
    const Sydney = require('./environments/sydney');
    const MemeMagic = require('./environments/meme_magic');
    const Search = require('./environments/search');
    const Weather = require('./environments/weather'); // Newly added

    const environments = {
        twitter: new Twitter(),
        exo: new Exo(),
        sydney: new Sydney(),
        meme_magic: new MemeMagic(),
        search: new Search(),
        weather: new Weather(), // Registering the new environment
    };

    module.exports = {
        getEnvironment: (name) => environments[name],
        getEnvironmentNames: () => Object.keys(environments),
    };
    ```

## Current Environments

-   Twitter: Connects to a Twitter proxy we're working on. Still to be released!
-   Exo: A suite of tools for taking notes and running queries against Claude. Notes functionality to be branched off into a separate project as it depends on some stuff that's not ready for public consumption yet.
-   Sydney: Connects to a simulacra of Sydney running on Llama 405b
-   Search: Searches the internet using Perplexity
-   Meme Magic: Generates memes using Glif. (Broken currently)

## Future Improvements

This is a toy model created to solve my own particular use case so there's looooots of stuff that needs to be added/improved to make it more generally useful as a basis for your own projects. Here's some ideas:

-   Make pre-processing more sophisticated and easier to enable/disable/configure
-   Expose a "hints" interface to enable individual apps to suggest next steps
-   Expose an interface for widgets
    -   that show on session start (e.g. welcome message, notes from last session, etc)
    -   that show at the start/bottom of each output (e.g. the time, notifications, etc)
-   Make environments self-registering (no need to edit the registry when you add a new one)
-   Allow the agent to set environment variables for itself that are hydrated every session
-   Better plugin architecture/extensibility

LMK on X @andyayrey if you'd like to share ideas or contribute!

## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

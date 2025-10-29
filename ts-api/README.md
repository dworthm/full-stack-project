# ThreadWise TypeScript API

Simple Chatbot backend (Express, TypeScript, MongoDB). Chat endpoint takes user prompt and uses an LLM to either:
- provide a direct response
- call a pre-defined weather tool if the LLM decides the prompt contains relevant inputs (location) to call that tool.

**To test current functionality,** try the following queries:
- "What is the weather in Boston?" (returns weather based on tool call)
- "What is the weather in Alaska?" (returns "unknown" based on tool call)
- "What is 1 + 1?" (returns response directly from LLM with no tool call)

Model: OpenAI GPT 4.0-mini

## Prerequisites

- Node.js 18+
- npm 9+
- Docker (and docker-compose)

## Getting Started

Install dependencies:

```bash
npm install
```

Retrieve an API key for OpenAI and store in a .env file. See [Dotenv](https://www.npmjs.com/package/dotenv) for more details.

```bash
OPENAI_API_KEY=sk-...
```

### Development

First, spin up the MongoDB:

(navigate to ../db)

```bash
docker-compose up -d
```

Launch the app with hot reloading:

```bash
npm run dev
```

### Production Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

Start the compiled server:

```bash
npm start
```

The server listens on `http://localhost:3000` by default and responds with a JSON greeting at the root route `/`.

## Project Structure

- `src/index.ts` – Express application entry point.
- `src/tools/weather.ts` - Simple weather retrieval app with no external dependencies.
- `dist/` – Compiled JavaScript output (generated after `npm run build`).
- `tsconfig.json` – TypeScript compiler configuration.

## Environment Variables

- `OPENAI_API_KEY` - Required. Necessary for the LLM-based chatbot.
- `SESSION_SECRET` - Required. Necessary for server to maintain session ID for length of chat. Can be any secure, long string.
- `MONGO_URI` - Required. URI for local MongoDB running in Docker container.
- `PORT` – Optional. Overrides the default port `3000`.

## Additional Scripts

- `npm run lint` – _not configured_. Add ESLint when ready.
- `npm test` – _not configured_. Add tests as the API evolves.


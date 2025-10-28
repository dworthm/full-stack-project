# ThreadWise TypeScript API

Simple Chatbot backend written in Express and TypeScript. Chat endpoint takes user prompt and uses an LLM to either:
- provide a direct response
- call a pre-defined weather tool if the LLM decides the prompt contains relevant inputs (location) to call that tool.

Model: OpenAI GPT 4.0-mini

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

Install dependencies:

```bash
npm install
```

Retrieve an API key for OpenAI and store in a .env file

```bash
OPENAI_API_KEY=sk-...
```

### Development

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
- `dist/` – Compiled JavaScript output (generated after `npm run build`).
- `tsconfig.json` – TypeScript compiler configuration.

## Environment Variables

- `OPENAI_API_KEY` - Required. Necessary for the LLm-based chatbot.
- `PORT` – Optional. Overrides the default port `3000`.

## Additional Scripts

- `npm run lint` – _not configured_. Add ESLint when ready.
- `npm test` – _not configured_. Add tests as the API evolves.


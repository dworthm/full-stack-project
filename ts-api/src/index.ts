import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import {
  ChatCompletionTool,
  ChatCompletionMessageParam, // We'll use this type
} from "openai/resources/chat/completions";
import { getCurrentWeather, toolSchema } from './tools/weather';

dotenv.config()
const app = express();
const port = process.env.PORT || 3000;

let IdCounter = 1;

type StoredMessage = ChatCompletionMessageParam & {
  id: number
}
// temporary access controls
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE')
  next()
})
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chatHistoryStore = new Map<string, StoredMessage[]>();

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from ThreadWise TypeScript API!' });
});

app.delete('/api/v1.0/messages/:messageid', (req: Request, res: Response) => {
  const { sessionId } = req.body as { sessionId: number}
  const { messageid } = req.params
  const messages = chatHistoryStore.get(sessionId.toString())
  if (!messages) {
    return res.status(400).json({ error: "Session not found." });
  }
  const newMessages = messages.filter((message) => message.id !== Number(messageid))
  chatHistoryStore.set(sessionId.toString(), newMessages)
  res.json({ messages: newMessages })
})

app.post('/api/v1.0/chat', async (req: Request, res: Response) => {
  let { newUserMessage, sessionId } = req.body as { newUserMessage: {id: number, role: 'user', content: string}, sessionId: number };
  const { id, role, content} = newUserMessage
  if (!newUserMessage.content) {
      return res.status(400).json({ error: "Prompt is required" });
    }
  // If no session yet, create one
  if (!sessionId) {
    sessionId = IdCounter;
    chatHistoryStore.set(sessionId.toString(), []);
    IdCounter++;
  }

  // Retrieve existing messages and add latest user prompt
  const messages = chatHistoryStore.get(sessionId.toString());
  if (messages === undefined) {
      return res.status(404).json({ error: "Session not found. Please start a new session." });
  }
  messages.push({id, role, content});

  const apiMessages: ChatCompletionMessageParam[] = messages.map(
      ({ id, ...rest }) => rest
    );
  const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: apiMessages,
      tools: [toolSchema],
      tool_choice: "auto",
    });
  const responseMessage = response.choices[0].message;
  const toolCalls = responseMessage.tool_calls;
  let botResponse;
  if (toolCalls && !!toolCalls.length) {
    console.log("Decision: Use tool");
    const toolCall = toolCalls[0];
    // @ts-ignore
    const functionName = toolCall.function.name;
    if (functionName === "get_current_weather") {
        // @ts-ignore
        const args = JSON.parse(toolCall.function.arguments);
        const location = args.location;
        const toolResult = getCurrentWeather(location);

        if (toolResult.temperature === 'unknown') {
          botResponse = `The weather in ${toolResult.location} is unknown`
        } else {
          botResponse = `The weather in ${toolResult.location} is ${toolResult.temperature} and ${toolResult.condition}`
        }
        // res.json({ messages })
    } else {
        res.status(500).json({ error: "Unknown tool requested" });
    }
  } else {
    botResponse = responseMessage.content
    // res.json({ botResponse: responseMessage.content });
  }
  const lastId = messages[messages.length - 1].id
  messages.push({
    id: lastId + 1,
    role: 'assistant',
    content: botResponse,
  })
  chatHistoryStore.set(sessionId.toString(), messages)
  res.json({ messages, sessionId })
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

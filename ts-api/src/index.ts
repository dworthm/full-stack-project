import express, { Request, Response } from 'express';
import session from 'express-session';
import cors from 'cors';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import {
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { APIError, RateLimitError, BadRequestError } from 'openai/error';
import { MongoClient, Collection } from 'mongodb';
import { getCurrentWeather, toolSchema } from './tools/weather';

dotenv.config()

// MongoDB setup
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('MONGO_URI environment variable is not set.');
  process.exit(1);
}
const mongoClient = new MongoClient(mongoUri);
let chatCollection: Collection<ChatDocument>;

interface ChatDocument {
  sessionId: string;
  messages: StoredMessage[];
}


const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',     // Allow requests from this origin
  credentials: true    // Allow cookies to be sent
}));
app.use(session({
  secret: process.env.SESSION_SECRET || randomUUID(),
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false
  },
}))

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

app.get('/', (req: Request, res: Response) => {
  console.log(req.sessionID)
  res.json({ message: 'Hello from ThreadWise TypeScript API!' });
});

// DELETE endpoint removes a specific message for that session and returns updated chat history to user
app.delete('/api/v1.0/messages/:messageid', async (req: Request, res: Response) => {
  const sessionId  = req.sessionID
  const { messageid } = req.params
  if (!sessionId) return res.status(400).json({ error: 'Session not found.'})
  if (!messageid) return res.status(400).json({ error: 'Please provide message id to delete.'})

  try {
    const chatDocument = await chatCollection.findOne({ sessionId });
    if (!chatDocument) {
      return res.status(404).json({ error: "Session not found." });
    }
    const newMessages = chatDocument.messages.filter((message) => message.id !== Number(messageid))

    await chatCollection.updateOne(
      { sessionId },
      { $set: { messages: newMessages } }
    );

    res.json({ messages: newMessages })
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message.' });
  }
})

// Primary chat endpoint. Invokes LLM with chat history and latest prompt, possibly calls tool, then responds to user
app.post('/api/v1.0/chat', async (req: Request, res: Response) => {
  let {
    newUserMessage
  } = req.body as {
      newUserMessage: {id: number, role: 'user', content: string}
    };
  const { id, role, content} = newUserMessage
  if (!content) {
      return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const sessionId = req.sessionID;
    console.log(`Session ID: ${sessionId}`)

    // Retrieve existing messages and add latest user prompt
    const chatDocument = await chatCollection.findOne({ sessionId });
    const messages = chatDocument ? chatDocument.messages : [];
    messages.push({id, role, content});



  // Prompt LLM with entire chat history and let it decide if tool should be called.
  const apiMessages: ChatCompletionMessageParam[] = messages.map(
      ({ id, ...rest }) => rest
    );
  try {
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
      } else {
          res.status(500).json({ error: "Unknown tool requested" });
      }
    } else {
      botResponse = responseMessage.content
    }
    // Add LLM's response to chat history and return to user
    const lastId = messages[messages.length - 1].id
    messages.push({
      id: lastId + 1,
      role: 'assistant',
      content: botResponse,
    })

    await chatCollection.updateOne(
      { sessionId },
      { $set: { messages } },
      { upsert: true }
    );
    res.json({ messages })
  } catch (err) {
    if (err instanceof RateLimitError) {
      res.status(err.status).json({ error: `Rate limit exceeded: Status ${err.status}` })
    } else if (err instanceof BadRequestError) {
      res.status(err.status).json({ error: `Bad request: Status ${err.status}` })
    } else if (err instanceof APIError) {
      // Handle other API errors (e.g., 500, 401, 403)
      res.status(err.status).json({ error: `An API error occurred: Status ${err.status}` })
    } else {
      // Handle non-API errors
      res.status(500).json({ error: 'An unexpected error occurred:'});
    }
  }
  } catch (dbError) {
    console.error('Database operation failed:', dbError);
    res.status(500).json({ error: 'An internal error occurred with the database.' });
  }
})

async function startServer() {
  try {
    await mongoClient.connect();
    console.log('Connected successfully to MongoDB');
    const db = mongoClient.db('chatbot'); // You can make the DB name an env var
    chatCollection = db.collection<ChatDocument>('chats');

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
}

startServer();

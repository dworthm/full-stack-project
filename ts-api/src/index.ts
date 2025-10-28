import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { ChatCompletionTool } from "openai/resources/chat/completions";
import { getCurrentWeather } from './tools/weather';

dotenv.config()
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  next()
})

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set this in your environment
});

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from ThreadWise TypeScript API!' });
});

const toolSchema: ChatCompletionTool = {
  type: "function",
  function: {
    name: "get_current_weather",
    description: "Gets the current weather for a specific location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g., 'San Francisco, CA'",
        },
      },
      required: ["location"],
    },
  },
};

app.get('/api/v1.0/chat', async (req: Request, res: Response) => {
  const { prompt } = req.query as { prompt: string };
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "user", content: prompt },
    ];
  const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      tools: [toolSchema],
      tool_choice: "auto",
    });
  const responseMessage = response.choices[0].message;
  const toolCalls = responseMessage.tool_calls;
  console.log(toolCalls)

  if (toolCalls && !!toolCalls.length) {
    console.log("Decision: Use tool");
    const toolCall = toolCalls[0];
    // @ts-ignore
    const functionName = toolCall.function.name;
    if (functionName === "get_current_weather") {
        // 1. Parse the arguments
        // @ts-ignore
        const args = JSON.parse(toolCall.function.arguments);
        const location = args.location;

        // 2. Call your actual TypeScript function
        const toolResult = getCurrentWeather(location);
        let botResponse;
        if (toolResult.temperature === 'unknown') {
          botResponse = `The weather in ${toolResult.location} is unknown`
        } else {
          `The weather in ${toolResult.location} is ${toolResult.temperature} and ${toolResult.condition}`
        }

        res.json({ botResponse })
    } else {
        res.status(400).json({ error: "Unknown tool requested" });
      }
  } else {
    res.json({ botResponse: responseMessage.content });
  }

  // const botResponse = await getBotResponse(prompt.trim())
  // res.json({ botResponse });
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

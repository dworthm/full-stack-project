import express, { Request, Response } from 'express';
import { calculate } from './tools/calculator';

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  next()
})

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from ThreadWise TypeScript API!' });
});

const getBotResponse = (userInput: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userInput.trim().toLowerCase() === 'error') {
        reject('Oops! Something went wrong. Please try again.');
      } else {
        resolve(`This is a simulated bot response to: '${userInput}'`);
      }
    }, 1500);
  });
};

app.get('/api/v1.0/chat', async (req: Request, res: Response) => {
  const { prompt } = req.query as { prompt: string };
  const botResponse = await getBotResponse(prompt.trim())
  res.json({ botResponse });
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

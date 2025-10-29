# Tech justification for take-home chatbot

  Overall, most of the decisions I made were to get a working prototype out over creating a production-ready app. For example, in a production app we'd have some sort of auth layer that would require a client-side login and middleware in the API layer. I'd also use a real-time type validation library like Zod.

## UI

  I opted for a simple one-page interface to allow for immediate chatbot interaction. In the first stages (before the API) the message list (React state) was the "source of truth" for the chat history. I added a scroll-to-bottom feature as well as autofocus on the input box to allow for a more seamless interaction with the chatbot. CSS is probably my weakest area so I took a standard Tailwind styling scheme and kept it

  Improvements:
  - Always having the trash icon (delete message)
  - Having a smoother transition of removing the initial message. Right now this occurs when the server returns a message instead of when the user types their first question.
  - Overall styling. Again this is a basic color scheme that clearly shows the difference between the user and bot chats, but for a production app I'd come up with. amore elegant style.

## Backend

  Framework: I chose Express given my familiarity with it and for the sake of time (and because I'm more familiar with Django and FastAPI over Flask). For a production app in TS, I might choose Fastify for performance. If we were to expand this to use a variety of tools (possibly in parallel), I'd probably have a separate Python API to handle the heavy calculations and keep the Node.js app simply for routing and basic server-side logic (e.g., Auth).

  Model: I chose GPT4-mini since it's cheaper and lightweight and sufficient for a demo. For a production app I might use a more recent release, and possibly OpenAI/LangChains tooling for dynamically selecting a model based on length of the chat history (a proxy for hwo complicated the chat interaction is).

  LLM tooling and flow: I opted for OpenAIs simpler libraries in order to demo the simple flow of the app. The chat history (state) and interaction with the LLM would be better handled with LangGraph. In a production app, I'd also pass the result of the server's tool call abck into the bot and return that to the user.

  Chat history: I used a simple JS Map as the source of truth for the chat history. Again, this was to favor a quick implementation. Mongo or Redis would be better in the real world so that a server restart wouldn't wipe the history.

  Session ID: Implementing this only within th elogic for the chat endpoint was another tradeoff of speed for robustness. I'd rather create an Express session and/or use an ID from the auth service - this would also make it possible to look up previous chat histories.
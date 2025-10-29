# Tech justification for take-home chatbot

  Overall, most of the decisions I made were to get a working prototype out over creating a production-ready app. For example, in a production app we'd have some sort of auth layer that would require a client-side login and middleware in the API layer. I'd also use a real-time type validation library like Zod.

## UI

  I opted for a simple one-page interface to allow for immediate chatbot interaction. In a production app, I'd have either a login page or login feature (button) that would enable features such as previous chats and a higher rate limit on LLM calls. Some of the features I included were a scroll-to-bottom feature as well as autofocus on the input box to allow for a more seamless interaction with the chatbot. While the color scheme is a little basic, it serves the primary purpose of clearly distinguishing user vs. bot chats.

  Application state: In the first stages (before the API), the message list (React state) served as the "source of truth" for the chat history. Since the LLM needed this info as additional context, either through the messages field or via LangGraph state, I moved this source of truth to the server. This can create a temporary disconnect as the user's last message is added to the client-side state while the LLM responds to it, ultimately the server responds with the latest chat history and client-side state is reconciled then.

  Improvements:
  - Always having the trash icon (delete message) towards the center.
  - Having a smoother transition when removing the initial message. Currently this occurs when the server returns a message instead of when the user types their first question.
  - Overall styling. This is a basic color scheme that clearly shows the difference between the user and bot chats, but for a production app I'd come up with a more elegant style.

## Backend

  Framework: I chose Express given my familiarity with it and for the sake of time (and because I'm more familiar with Django and FastAPI over Flask). For a production app in TS, I'd choose Fastify for performance. If we were to expand this to use a variety of tools (possibly in parallel), I'd probably have a separate Python API to handle the heavy calculations and keep the Node.js app simply for routing and basic server-side logic (e.g., Auth).

  Model: I chose GPT4-mini since it's cheaper and lightweight and sufficient for a demo. For a production app I'd use a more recent release, and possibly OpenAI/LangChains tooling for dynamically selecting a model based on length of the chat history (a proxy for hwo complicated the chat interaction is).

  LLM tooling and flow: I opted for OpenAIs libraries in order to demo the simple flow of the app. The chat history (state) and interaction with the LLM would be better handled with LangGraph.

  Server tool: This simple function mocks a weather retrieval API and has no external dependencies. In a production app, I'd pass the result of the server's tool call back into the LLM and return the final LLM response to the user.

  Chat history: I used a simple JS Map as the source of truth for the chat history. Again, this was to favor a quick implementation. Mongo or Redis would be better in the real world so that a server restart wouldn't wipe the history.

  Session ID: Implementing this within the logic for the chat endpoint was another tradeoff in favor of speed over robustness. Session creation would never occur within a single endpoint and doesn't need to be part of a request body. I'd rather create an Express session and/or use an ID from the auth service - this would make it possible to look up previous chat histories.
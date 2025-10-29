import { ChatCompletionTool } from "openai/resources/chat/completions";

export const getCurrentWeather = (location: string) => {
  /**
   * A mock function to simulate fetching weather.
   * In a real app, this would call a weather API.
   */
  console.log(`--- TOOL CALLED: Getting weather for ${location} ---`);
  // Mock data
  if (location.toLowerCase().includes("boston")) {
    return {
      location: "Boston",
      temperature: "75°F",
      condition: "Sunny",
    };
  }
  return {
    location: location,
    temperature: "unknown",
    condition: "unknown",
  };
};

export const toolSchema: ChatCompletionTool = {
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
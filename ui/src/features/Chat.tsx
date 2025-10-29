import React, { useState, useRef, useEffect } from 'react';
import DeleteMessageButton from '../components/DeleteButton';

interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant';
}

const ChatbotUI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, content: 'Hello! How can I assist you today?', role: 'assistant' },
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null)


  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    inputRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    inputRef.current?.focus()

  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    if (trimmedInput === '' || isLoading) return;

    const lastId = messages[messages.length - 1].id

    const newUserMessage: Message = { id: lastId + 1, content: trimmedInput, role: 'user' };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/v1.0/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newUserMessage,
          sessionId
        })
      })
      const { messages, sessionId: newSessionId } = await response.json()
      setMessages(messages);
      setSessionId(newSessionId)
    } catch (err) {
      if (typeof err === 'string') {
        setError(err);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMessageDelete = async (messageid: number) => {
    // get messageId, sessionId
    const response = await fetch(`http://localhost:3000/api/v1.0/messages/${messageid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json' // Set headers if required by your API
      },
      body: JSON.stringify({ sessionId })
    })
    const {messages} = await response.json()
    setMessages(messages)
  }

  return (
    <div className="flex flex-col flex-1 bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 text-center shadow-md">
        <h1 className="text-2xl font-semibold">Your chat</h1>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <DeleteMessageButton onClick={() => handleMessageDelete(message.id)} />
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-500 px-4 py-2 rounded-lg shadow rounded-bl-none italic">
              Bot is typing...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        {/* Error UI */}
        {error && (
          <div className="mb-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Text Input and Send Button */}
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Type your message..."
            value={inputValue}
            // --- Typed Event Handler ---
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInputValue(e.target.value)
            }
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotUI;
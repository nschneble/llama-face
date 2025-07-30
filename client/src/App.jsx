import React, { useState, useRef, useEffect } from 'react';
import { ChatGroup } from './ChatGroup';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]); // each { role, content, timestamp }
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const bufferRef = useRef('');

  // focus and auto-scroll
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // send user prompt
  const sendPrompt = async () => {
    const text = prompt.trim();
    if (!text) return;

    // add user message
    setMessages((m) => [
      ...m,
      { role: 'user', content: text, timestamp: Date.now() },
    ]);
    bufferRef.current = '';
    setLoading(true);
    setPrompt('');

    // kick off Ollama
    await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text }),
    });

    // stream assistant responses
    const es = new EventSource('http://localhost:3001/api/stream');
    es.onmessage = (e) => {
      bufferRef.current += e.data;
      setMessages((m) => {
        // if last is assistant, replace it; otherwise append
        const last = m[m.length - 1];
        if (last?.role === 'assistant') {
          return [
            ...m.slice(0, -1),
            { role: 'assistant', content: bufferRef.current, timestamp: last.timestamp },
          ];
        } else {
          return [
            ...m,
            { role: 'assistant', content: e.data, timestamp: Date.now() },
          ];
        }
      });
    };
    es.addEventListener('done', () => {
      es.close();
      setLoading(false);
    });
    es.onerror = () => {
      es.close();
      setLoading(false);
    };
  };

  // Enter to send, Shift+Enter for newline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  // Group messages for rendering
  const groups = [];
  messages.forEach((msg) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.role === msg.role) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ role: msg.role, messages: [msg] });
    }
  });

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="flex-none px-6 py-4 border-b border-gray-300 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-center">🧠 Ollama Chat</h1>
      </header>

      {/* Chat */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {groups.map((g, i) => (
          <ChatGroup key={i} role={g.role} messages={g.messages} />
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="flex-none px-6 py-4 border-t border-gray-300 dark:border-gray-700">
        <textarea
          ref={inputRef}
          rows={2}
          className="w-full resize-none p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Ask something… (Shift+Enter for newline)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={sendPrompt}
          disabled={loading}
          className="mt-3 flex items-center justify-center w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading && (
            <svg
              className="animate-spin h-5 w-5 mr-3 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
              />
            </svg>
          )}
          {loading ? 'Thinking…' : 'Send'}
        </button>
      </footer>
    </div>
  );
}

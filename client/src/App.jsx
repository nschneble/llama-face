import { useState, useRef, useEffect } from 'react';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const bufferRef = useRef('');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendPrompt = async () => {
    const text = prompt.trim();
    if (!text) return;

    // add user message
    setMessages((m) => [...m, { role: 'user', content: text }]);
    bufferRef.current = '';
    setLoading(true);
    setPrompt('');

    // kick off the chat
    await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text }),
    });

    const es = new EventSource('http://localhost:3001/api/stream');
    es.onmessage = (e) => {
      bufferRef.current += e.data;
      setMessages((m) => {
        const last = m[m.length - 1];
        if (last?.role === 'assistant') {
          return [...m.slice(0, -1), { role: 'assistant', content: bufferRef.current }];
        }
        return [...m, { role: 'assistant', content: e.data }];
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

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* HEADER */}
      <header className="flex-none px-6 py-4 border-b border-gray-300 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-center">🦙 Llama Face</h1>
      </header>

      {/* CHAT AREA */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`px-5 py-3 rounded-2xl max-w-[70%] text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* INPUT */}
      <footer className="flex-none px-6 py-4 border-t border-gray-300 dark:border-gray-700">
        <textarea
          ref={inputRef}
          rows={2}
          className="w-full resize-none p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Ask something… (Shift+Enter for newline)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          onClick={sendPrompt}
          disabled={loading}
          className="mt-3 w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Thinking…' : 'Send'}
        </button>
      </footer>
    </div>
  );
}

import { useState } from 'react';

function App() {
  const [response, setResponse] = useState('');

  const pingBackend = async () => {
    const res = await fetch('http://localhost:3001/');
    const text = await res.text();
    setResponse(text);
  };

  return (
    <div>
      <h1>Ollama Chat UI</h1>
      <button onClick={pingBackend}>Ping Backend</button>
      <p>{response}</p>
    </div>
  );
}

export default App;

const axios = require('axios');
const cors = require('cors');
const express = require('express');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// health check route
app.get('/', (req, res) => {
	res.send('Server is running!');
});

// POST /api/chat route
app.post('/api/chat', async (req, res) => {
	const { prompt } = req.body;

	if (!prompt) {
		return res.status(400).json({ error: 'Prompt is required.' });
	}

	try {
		const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
			model: 'llama2:7b',
			stream: false,
			prompt
		});

		res.json({ response: ollamaResponse.data.response });
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: 'Failed to communicate with Ollama' });
	}
});

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});

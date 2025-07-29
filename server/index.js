const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
	res.send('Server is running!');
});

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});

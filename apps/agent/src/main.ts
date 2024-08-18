import express from 'express';
import { ollama } from './internet-search';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.listen(port, host, async () => {
  const response = await ollama.generate(['hello world!'])
  response.generations.forEach(g => console.log(g) )
});



import {Ollama} from '@langchain/community/llms/ollama'

export const ollama = new Ollama({
  baseUrl: 'https://ai-monsters.ngrok.app/llm/generate',

  headers: {
    'x-pass': 'we are the ai Monsters!1'
  },
  model: 'llama3.1'
})

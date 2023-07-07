import { OpenAI } from 'langchain/llms/openai';

const llm = new OpenAI({
  modelName: 'gpt-3.5-turbo',
  openAIApiKey: process.env.OPEN_AI_KEY,
});

function runPrompt(prefix: string, body: string, affix: string){ 
  const constructedPrompt = `${prefix} ${body} ${affix}`
  return llm.call(constructedPrompt)
}

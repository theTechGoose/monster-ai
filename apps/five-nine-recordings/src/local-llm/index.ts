import axios from 'axios'



export async function countTokens(toCount: string) {
 const _llama3Tokenizer = await import('llama3-tokenizer-js')
  const llama3Tokenizer = _llama3Tokenizer.default
  const tokens = llama3Tokenizer.encode(toCount) 
  const tokenCount = tokens.length - 2
  console.log({tokenCount})
  return tokenCount
}


const sizes = {
  sm: 3096,
  md: 7192,
  lg: 15384
}

export async function getModel(tokenCount: number) {
  const base = 'summary-'
  const size = Object.entries(sizes).find(i => {
    const [_, count] = i
    const condition = count > tokenCount
    return condition
    
  }) 
  if(!size) return `${base}lg`
  const [suffix] = size
  return `${base}${suffix}`
}


export async function llamaSummerize(model: string, _prompt: string) {
  console.log('sent to ollama')
  const prompt = `${_prompt}`
  const url = 'localhost:3000/llm/generate'
   const payload = {
    model,
    messages: [
      {
      role: 'system',
      content: 'no yapping, output only the response and no extra talking'
      },
      {
        role: 'user',
        content: 'your output must only contain the response to my question, no other words allowed keep it concice, do you understand?'
      },
      {
        role: 'assistant',
        content: 'yes'
      },
      {
      role: "user",
      content: prompt
      }
    ],
    prompt,
    stream: false
}
  const headers = {
'x-pass': 'we are the ai Monsters!1',
'Content-Type': 'application/json' 
  }
  
  try {
  const result = await axios.post(url, payload, {headers})
    console.log({result})
  return result.data.message.content
  } catch(e) {
    console.log(e?.response?.data)
    throw new Error(e)
  }
}


export async function runSummaryFlow(text: string, modelOverride?: string) {
  const tokens = await countTokens(text)
  const model = modelOverride ? modelOverride : await getModel(tokens)
  return llamaSummerize(model, text)
}


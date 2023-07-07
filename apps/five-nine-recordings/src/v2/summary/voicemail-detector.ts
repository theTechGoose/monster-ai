import { OpenAI } from 'langchain/llms/openai';

const llm = new OpenAI({
  modelName: 'gpt-3.5-turbo',
  openAIApiKey: process.env.OPEN_AI_KEY,
});

export async function detectVoicemail(call: Array<string>, duration: number, callType: string, maxScore: number) {
  const header = call[0]
  if(!header) {
    console.log('header not defined, skipping voicemail check')
    console.log({call})
    return false
  }

  
  if(callType !== 'outbound') {
    console.log('call is inbound, skipping voicemail')
    return false
  } 
  
  if(duration >= 240) {
    console.log('call is to long skipping voicemail')
  return false
  }
    const isVoicemailByLength = call.join('').length <= 200
    if(isVoicemailByLength) return true
    const isVoicemailByContext = await identify(header)
    const isVoicemail = isVoicemailByContext || isVoicemailByLength
    return isVoicemail
  
  }

async function identify(header: string, attempt = 0) { 
  const cleanHeader = header.split('team-member ').join('').split('guest: ').join('')
  const prompt = `Given the following transcription of a phone call, itentify whether its a voicemail, or automated mesanging system or not:

${cleanHeader}

If the transcription is from a voicemail, respond with 'true'. If its not from a voicemail, repsond with 'false'.
`
  if(attempt>= 3) {
    console.log('failed 3 times giving up')
    return null
  }
  const response = await llm.call(prompt)
  const isCorrect = response === 'true' || response === 'false'
  if(!isCorrect) return identify(header, attempt+1)
  return response === 'true'
}


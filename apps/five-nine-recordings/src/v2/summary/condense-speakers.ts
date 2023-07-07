import { OpenAI } from 'langchain/llms/openai';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter'

const llm = new OpenAI({
  modelName: 'gpt-3.5-turbo',
  openAIApiKey: process.env.OPEN_AI_KEY,
});

export async function condenseSpeech(input: string): Promise<string> {
  // Split the input into lines
  let lines = input.split('\n');

  // Initialize output array and temporary speaker and lines vars
  let output = [];
  let currentSpeaker = '';
  let currentLines = [];

  // Iterate through the input lines
  for (let line of lines) {
    // Extract the speaker and content from each line
    let match = line.match(/\[([^\]]+)\]: (.*)/);
    if (match) {
      let speaker = match[1];
      let content = match[2];

      // If the current speaker is the same as the last one, add their line to the current lines
      if (speaker === currentSpeaker) {
        currentLines.push(content);
      } else {
        // If the current speaker is different, add the last speaker's lines to the output
        if (currentSpeaker !== '') {
          output.push(`${currentSpeaker}: ${currentLines.join(' ')}`);
        }

        // Update the current speaker and lines
        currentSpeaker = speaker;
        currentLines = [content];
      }
    }
  }

  // Add the final speaker's lines to the output
  if (currentSpeaker !== '') {
    output.push(`${currentSpeaker}: ${currentLines.join(' ')}`);
  }
  

  const outputString = output.join('\n');
  const splitter = createTextSplitter(1000)
  const exerpt = await splitter.splitText(outputString)
  const speakers = await identifySpeakers(exerpt[0])
  
  if(speakers){
  return outputString.split(speakers.teamMember).join('team-member').split(speakers.guest).join('guest')
  }
  
  return outputString
}

async function identifySpeakers(exerpt: string, attempt = 0) {
  if(attempt >= 3) {
    console.log('failed three attempts giving up')
  return null
  }
  const prompt = `Given the following conversation, who is most likely the customer service agent? Please respond with either 'SPEAKER_00' or 'SPEAKER_01' ${exerpt}`
  const response = await llm.call(prompt)
  const isCorrect = response === 'SPEAKER_00' || response === 'SPEAKER_01' 
  if(!isCorrect) {
    console.log('bad speaker identification response, trying again')
    console.log({response})
  return identifySpeakers(exerpt, attempt + 1)
  }
  const guestSpeaker = response === 'SPEAKER_00' ? 'SPEAKER_01' : 'SPEAKER_00'
  
  return {
    teamMember: response,
    guest: guestSpeaker
  }
}

function createTextSplitter(size: number) {
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: size,
});
  return textSplitter
}

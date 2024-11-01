import { OpenAI } from "langchain/llms/openai";

const gpt4 = new OpenAI({
  modelName: 'gpt-3.5-turbo',
  openAIApiKey: process.env.OPEN_AI_KEY,
});

interface ParsedTranscript {
  speaker: string;
  text: string;
}

export function parseTranscription(transcription: string): Array<ParsedTranscript> {
  let arr = splitByNumberAndNewLine(transcription)
  arr = filterLinesWithBrackets(arr).map(l => l.split('\n')[0])
  let newArr = arr.map(a => a.split(':'))
  const output = newArr.map(([_speaker, text]) => {
    const speaker = _speaker.toUpperCase()
    return {speaker, text}

  })

  //const finalOut = [] as Array<any>
  //let cache = []
  //const cacheSize = 3
  //let i = 0
  //for(let transcription of output) {
  //  console.log(`running ${i}`)
  //const $ =  gpt4.call(`Your job is to output a single word. either "USER" or "ASSISTANT" based on what is said. I will provide you 3 sentences what was said before, the current one to be evaluated and the next one to be evaluated. All three sentences may not be by the same speaker but You will use the before and next sentences as context to be able to tell me if this was the USER or the ASSISTANT that said the current sentence.
  //                                 Before: ${output[i -1]?.text}
  //                                 Current: ${transcription.text}
  //                                 After:  ${output[i + 1]?.text}
  //                                 `)
  //
  //
  //                                 i++
  //
  // cache.push({original: transcription, promise: $})
  // if(cache.length >= cacheSize || i === output.length - 1) {
  //   await Promise.all(cache.map(c => c.promise))
  // } else {
  //   continue
  // }
  //
  //   cache.forEach(async (c) => {
  //      const ret = {...c.original, speaker: await c.promise}
  //      console.log(ret)
  //      finalOut.push(ret)
  //   })
  //   cache = []
  //}

  return output
}


function cleanForJson(o: string) {
  const fixed = o.split('[')[1].split(']')[0]
  return `[${fixed}]`
}

 function splitByNumberAndNewLine(input: string): string[] {
  const arr = input.split('[')
  return arr.map(a => `[${a}`)
}

export function filterLinesWithBrackets(lines: string[]): string[] {
  return lines.filter(line => /\[.*\]/.test(line));
}

 export function removeNonAlphabetical(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, '');
}

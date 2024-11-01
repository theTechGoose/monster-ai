// import Queue from 'bee-queue'
// import { promisify } from 'util';
// import { exec } from 'child_process';
// import { runSummaryFlow } from '../../local-llm';
// const execAsync = promisify(exec)
//
// interface App {
//   [key: string] : number
// }
//
//
// interface GraphicsJob {
//   type: 'llm' | 'transcription'
//   prompt: string;
//   model?: string;
// }
//
//
// const transcription = new Queue('transcription', {
//   redis:{
//   host: '127.0.0.1',
//   port: 6379,
//   db: 0
//   },
//   isWorker: true
// })
//
// const llm = new Queue('llm', {
//   redis:{
//   host: '127.0.0.1',
//   port: 6379,
//   db: 0
//   },
//   isWorker: true
// })
//
//   function waitForJob(job:  Queue.Job<any>) {
//   return new Promise((r,j) => {
//     
//   job.on('succeeded', (result: any) => {
//       r(result)
//   })
//     
//    job.on('failed', (job) => {
//       j(job)
//     }) 
//   })
// }
//
// export const jobManager = {
//   async newJob(params: GraphicsJob) {
//     const choices = {
//       transcription,
//       llm
//     }
//     const choice = choices[params.type]
//     const job =  await choice.createJob(params).retries(3).save()
//     return await waitForJob(job)
//   }
// }
//
// llm.process(1, async (job) => {
//   const {prompt, model} = job.data
//   return runSummaryFlow(prompt, model)
// })
//
//
// transcription.process(2, async (job) => {
//   const {prompt} = job.data
//    return await execAsync(prompt)
//   })
//
//
//

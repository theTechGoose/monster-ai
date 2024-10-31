import 'dotenv/config';
import express from 'express'
import proxy from 'express-http-proxy'
import {countTokens, getModel} from './local-llm/index'
import { startCallIdentification } from './v2/call-identification-queue/call-identification';
import { startCallTranscription } from './v2/transcription/transcription';
import { startCallSummary } from './v2/summary/summary';
import { startSendToCrm } from './v2/send-to-crm/send-to-crm';
import { jobManager } from './v2/queue';

export const ENV = 'prod';
export const IDENTIFY_RECORDING_UPDATE_INTERVAL = 500;
export const UPDATE_INTERVAL = 1000;
export const MAX_RETRIES = 3;




  
const app = express()
const router = express.Router();


router.use('/llm/generate',  (req, res) => {
  const headers = req.headers
  if(headers['x-pass'] !== 'we are the ai Monsters!1') {
    res.status(401).send({ message: 'unauthorized'})
    return
  }
  
  
  return proxy('localhost:8000',{
  proxyReqPathResolver: function () {
      return '/api/chat'
    }})(req, res)
})

app.use(router)

app.listen(3000,async () => {
startCallIdentification();
startCallTranscription();
startCallSummary();
startSendToCrm();
})






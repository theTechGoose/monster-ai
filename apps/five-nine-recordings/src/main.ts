import 'dotenv/config';
import { bootStrapRecordings } from './v2/call-identification-queue/call-identification';

// import { startCallTranscription } from './v2/transcription/transcription';
// import { startCallSummary } from './v2/summary/summary';
// import { startSendToCrm } from './v2/send-to-crm/send-to-crm';

export const ENV = 'prod';
export const IDENTIFY_RECORDING_UPDATE_INTERVAL = 500;
export const UPDATE_INTERVAL = 1000;
export const MAX_RETRIES = 3;

bootStrapRecordings();
// startCallTranscription();
// startCallSummary();
// startSendToCrm();

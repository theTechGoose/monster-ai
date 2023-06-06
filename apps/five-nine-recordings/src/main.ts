import 'dotenv/config';
import { startCallIdentification } from './v2/call-identification-queue/call-identification';

export const ENV = 'prod';
export const UPDATE_INTERVAL = 1000;
export const MAX_RETRIES = 3;

startCallIdentification();

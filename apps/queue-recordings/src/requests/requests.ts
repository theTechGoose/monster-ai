import axios, { AxiosRequestConfig } from 'axios';
import { config } from '../config';
import Queue from 'bee-queue';

const requestQueue = new Queue<AxiosRequestConfig>('request', {
  redis: {
    host: config.REDIS_HOST,
  },
});

export async function makeRequest(data: AxiosRequestConfig) {
  const job = await requestQueue.createJob(data).save();
  return await new Promise((resolve, reject) => {
    job.on('succeeded', (result) => {
      resolve(result);
    });
    job.on('failed', (err) => {
      reject(err);
    });
  });
}

requestQueue.process(config.THREADS.request, async (job) => {
  const { data } = await axios.request(job.data);
  return data;
});

requestQueue.on('failed', (job, err) => {
  console.log('Request failed', err);
  console.log(job.data);
});

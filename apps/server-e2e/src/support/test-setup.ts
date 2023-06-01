/* eslint-disable */

import axios from 'axios';

module.exports = async function () {
  // Configure axios for tests to use.
  const host = process.env.HOST ?? '127.0.0.1';
  const port = process.env.PORT ?? '5000';
  const route = '/monster-ai-5b135/us-central1/api';
  axios.defaults.baseURL = `http://${host}:${port}${route}`;
};

import axios from 'axios';

const CONTROLLER = '/ami-db';

describe('ami db', () => {
  it('should save a question', async () => {
    const question = {
      relatedAnswers: ['1', '2', ['3']],
      content: 'hello world',
      shown: 0,
    };

    const url = `${CONTROLLER}/test`;
    console.log(url);
    const res = await axios.post(url, { question });
    expect(res.status).toBe(200);
    console.log(res);
  });
});

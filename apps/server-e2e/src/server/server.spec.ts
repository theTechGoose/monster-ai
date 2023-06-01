import axios from 'axios';

describe('GET /api', () => {
  it('should return a message', async () => {
    const res = await axios.get(`/ami-db/test`);
    expect(res.status).toBe(200);
    expect(res.data).toBe('test');
  });
});

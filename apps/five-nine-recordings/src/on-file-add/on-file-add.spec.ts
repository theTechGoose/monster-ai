import { onFileAdd, queue } from './on-file-add';

describe('file add', () => {
  it('should push a file onto the queue', () => {
    onFileAdd('foo');
    expect(queue).toEqual(['foo']);
    console.log(queue);
  });
});

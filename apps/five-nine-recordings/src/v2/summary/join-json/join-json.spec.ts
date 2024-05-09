import { joinJson } from './join-json';
import { raw } from './test-data';

it('should work', () => {
  const output = joinJson(raw, 'test');
  console.log(output)
})

import { joinJson, condenseData } from './join-json';
import { raw, raw2 } from './test-data';

it('should work', () => {
  // const output = joinJson(raw, 'test');
  // console.log(output)
  const output = condenseData(JSON.parse(raw2));
  console.log(JSON.stringify(output, null, 2))
})

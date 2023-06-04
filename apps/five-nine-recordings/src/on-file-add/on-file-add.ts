export const queue = [];

export function onFileAdd(path: string, type: 'front' | 'back' = 'front') {
  if(type === 'back') {
    queue.unshift(path);
    return
  }
  const fileName = path.split('/').pop();
  console.log(`File added to queue ${fileName}`);
  queue.push(path);
}

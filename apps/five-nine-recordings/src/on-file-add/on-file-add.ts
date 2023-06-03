export const queue = [];

export function onFileAdd(path: string) {
  const fileName = path.split('/').pop();
  console.log(`File added to queue ${fileName}`);
  queue.push(path);
}

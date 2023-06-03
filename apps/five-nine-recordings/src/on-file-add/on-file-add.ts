export const queue = [];

export function onFileAdd(path: string) {
  queue.push(path);
}

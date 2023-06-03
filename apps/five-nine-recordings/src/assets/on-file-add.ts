export const queue = [];

export function onFileAdd(path: string): void {
  queue.push(path);
 }

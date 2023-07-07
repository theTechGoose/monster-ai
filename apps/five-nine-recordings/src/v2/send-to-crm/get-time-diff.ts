export function getTimeInDiff(start: string | Date, end?: string | Date) {
  let endTime = new Date().getTime()
  if(end) {
   endTime = new Date(end).getTime()
  }
  const startTime = new Date(start).getTime()
  const diffMilis = endTime - startTime
  const seconds = Math.round(diffMilis / 1_000)
  return seconds
}

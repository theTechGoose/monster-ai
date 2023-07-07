const tracker = {}
 
export function timer(path: string) {
  const currentTracker = tracker[path]
  if(!currentTracker) {
    tracker[path] = process.hrtime()
  } else {
    const currentTimer = process.hrtime(currentTracker)
    const milisToSeconds = Math.round((currentTimer[1] / 1_000_000) /1_000)
    return currentTimer[0]  + milisToSeconds
  }
}

export function getDurationFromSeconds(duration: string | number) {
  let durationCopy: number = duration as any
  if(typeof duration === 'string') durationCopy = Number(durationCopy)
  const totalMinutes = normalizeOutput((durationCopy / 60).toFixed(0));
  const totalSeconds = normalizeOutput((durationCopy % 60).toFixed(0));
  return `${totalMinutes}:${totalSeconds} MM:SS`
}

function normalizeOutput(output: string) {
  return output.length < 2 ? `0${output}` : output
}

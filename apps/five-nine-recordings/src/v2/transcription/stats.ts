import {promises} from 'fs'
const fs = {
  stat: promises.stat
}
let timers = {};
let data = {};
let averages = {totalTime: 0, totalMB: 0, count: 0};

export async function timeTracker(filePath) {
    const THREE_HOURS = 3 * 60 * 60 * 1000;  // in milliseconds

    // Delete timers older than 3 hours
    for (let id in timers) {
        if (Date.now() - timers[id].startTime > THREE_HOURS) {
            delete timers[id];
        }
    }

    if (!timers[filePath]) {
        timers[filePath] = {startTime: Date.now()};
    } else {
        let elapsedTime = (Date.now() - timers[filePath].startTime) / 1000; // in seconds
    
    //@ts-ignore
        let stats = await fs.stat(filePath);
    
    //@ts-ignore
        let fileSize = Number((stats.size / (1024 * 1024)).toFixed(2)); // in MB

        // Avoid division by zero if file size is 0
        let timePerMB = fileSize ? (elapsedTime / fileSize).toFixed(2) : 0;

        data[filePath] = {elapsedTime, timePerMB};

        // Update averages
        averages.totalTime += Number(elapsedTime.toFixed(2));
    //@ts-ignore
        averages.totalMB += fileSize
        averages.count++;
    
    //@ts-ignore
        averages.averageTime = (averages.totalTime / averages.count).toFixed(2);
    
    //@ts-ignore
        averages.averageTimePerMB = (averages.totalMB / averages.totalTime).toFixed(2);
    const totalTime = getDurationFromSeconds(averages.totalTime)
    const timeTaken = getDurationFromSeconds(elapsedTime)
    //@ts-ignore
    const averageTimeTaken = getDurationFromSeconds(averages.averageTime)
    const totalMB = `${averages.totalMB.toFixed(2)} MB`
    const currentTimePerMB = `${timePerMB} S/MB`
    //@ts-ignore
    const averageTimePerMB = `${averages.averageTimePerMB} S/MB`
    const recordingCount = `${averages.count} Recording(s)`

        // Clear the timer for the next use
        delete timers[filePath];

        return {
      totalTime,
      timeTaken,
      averageTimeTaken,
      totalMB,
      currentTimePerMB,
      averageTimePerMB,
      recordingCount
        };
    }
}

function getDurationFromSeconds(duration: string | number) {
  let durationCopy: number = duration as any
  if(typeof duration === 'string') durationCopy = Number(durationCopy)
  const totalMinutes = normalizeOutput((durationCopy / 60).toFixed(0));
  const totalSeconds = normalizeOutput((durationCopy % 60).toFixed(0));
  return `${totalMinutes}:${totalSeconds} MM:SS`
}

function normalizeOutput(output: string) {
  return output.length < 2 ? `0${output}` : output
}

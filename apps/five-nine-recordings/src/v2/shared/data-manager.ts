import {nanoid} from 'nanoid'
import os from 'os';
import {promises, readdir} from 'fs'
import {join} from 'path'
import { promisify } from 'util';
import { exec } from 'child_process';



const asyncWrite = promises.writeFile
const asyncRead = promises.readFile
const execAsync = promisify(exec);
const readdirAsync= promisify(readdir)


export async function setMetaData(data: Record<string, any>) {
  if(!data.id) data.id = nanoid()
  const metaDataPath = getPathToMetaData(data.id)
  await asyncWrite(metaDataPath,JSON.stringify(data), 'utf8')
  return data.id
}

function getPathToMetaData(id: string) {
  const fullPath = join(os.homedir(), 'metadata', id)
  return `${fullPath}.json`
}

export async function getMetaData(path: string): Promise<any> {
  const id = path.split('.')[0].split('/').reverse()[0]
  const metaDataPath = getPathToMetaData(id)
  const fileData = await asyncRead(metaDataPath)
  const metaData = JSON.parse(fileData.toString())
    const parsedDates = Object.entries(metaData).reduce((acc, curr) => {
    const [key, value] = curr as any
    const isIso = isISODate(value)
    acc[key] = value
    if(isIso) acc[key] = new Date(value)
    return acc
  }, {} as any)
  parsedDates.id = id
  if(!parsedDates.times) parsedDates.times = {}
  return parsedDates
}

function isISODate(dateString) {
    const pattern = new RegExp(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(([+-]\d{2}:\d{2})|Z)?$/i);
    return pattern.test(dateString);
}

const markedIds = {}
async function getAllSystemPaths() {
  const dirs = ['recordings', 'summaries', 'toTranscribe', 'transcriptions']
  const $paths = dirs.map(d => {
  const dir = `${os.homedir()}/${d}`;
  let files = readdirAsync(dir);
  return files
  })
  const _paths = await Promise.all($paths)
  let ids = _paths.flat().map(p => {
    const id = p.split('.')[0].split('/').reverse()[0]
    return id
  })
  await new Promise(r => setTimeout(r, 5000))
  
  const $paths2 = dirs.map(d => {
  const dir = `${os.homedir()}/${d}`;
  let files = readdirAsync(dir);
  return files
  })
  
  const _paths2 = await Promise.all($paths2)
  const ids2 = _paths2.flat().map(p => {
    const id = p.split('.')[0].split('/').reverse()[0]
    return id
  })
  
  const _ids = [...ids, ...ids2]

  const metaDataDir = join(os.homedir(), 'metadata')
  const metaDataPaths = await readdirAsync(metaDataDir) 
  const metaDataIds = metaDataPaths.map(p => {
    const id = p.split('.')[0].split('/').reverse()[0]
    return id
  })
  
   const filteredIds = metaDataIds.filter(id => {
    return !_ids.includes(id)
  })
  
  filteredIds.forEach(id => {
    if(!markedIds[id]) markedIds[id] = 0
     markedIds[id]++
  })

  const idsToDelete = Object.entries(markedIds).filter(entry =>{
    const [id, value] = entry as any
    return value > 10 
  }).map(entry => entry[0])

  const toDelete = idsToDelete.map(id => {
    delete markedIds[id]
    return join(os.homedir(), 'metadata', `${id}.json`)
  })
  
  return toDelete
}

export async function clearMetaData() {
  try {
  const pathsToDelete = await getAllSystemPaths()
  for(let path of pathsToDelete) {
  await execAsync(`rm ${path}`)
  }
    if(pathsToDelete[0]) {
      console.log(`DELETED ${pathsToDelete}`)
    }
  } catch(e) {
    console.log(e)
    
  }
}

export function getFileInfo(path: string) {
  const fileName = path.split('/').pop();
  const [guestPhone, repName, fullRep, callType, _rids, callId, startDate, endDate] = fileName.split('..');
  const mRids = _rids.replace(/[^0-9\-]/g,'')
  const rids = mRids.split('-').map((n) => Number(n));
   const cleanEndDate = endDate.split(/\.[a-z]{3}/g)[0]
  const endDateBad = cleanEndDate === 'null' || !endDate
  const startDateBad = startDate === 'null' || !startDate
  return {
    guestPhone,
    repName,
    callType,
    fullRep,
    rids,
    callId,
    startDate: startDateBad ? new Date() : new Date(startDate),
    endDate: endDateBad ? new Date() : new Date(cleanEndDate)
  };
}
 



import {getMetaData} from './data-manager'

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

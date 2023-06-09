export function getFileInfo(path: string) {
  const fileName = path.split('/').pop();
  const [guestPhone, repName, fullRep, callType, _rids] = fileName.split('..');
  const mRids = _rids.replace(/[^0-9\-]/g,'')
  const rids = mRids.split('-').map((n) => Number(n));
  return {
    guestPhone,
    repName,
    callType,
    fullRep,
    rids,
  };
}

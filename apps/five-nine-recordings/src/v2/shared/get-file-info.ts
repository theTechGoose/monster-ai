export function getFileInfo(path: string) {
  console.log({path})
  const fileName = path.split('/').pop();
  console.log({fileName})
  const [guestPhone, repName, fullRep, callType, _rids] = fileName.split('..');
  const rids = _rids.split('-');
  return {
    guestPhone,
    repName,
    callType,
    fullRep,
    rids,
  };
}

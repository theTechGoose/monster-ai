export function getFileInfo(path: string) {
  const fileName = path.split('/').pop();
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

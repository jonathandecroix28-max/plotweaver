export function getDeviceId(): string {
  let deviceId = localStorage.getItem('plotweaver_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('plotweaver_device_id', deviceId);
  }
  return deviceId;
}
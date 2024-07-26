import os from 'os'

function getIPAdress(): string[] {
  const result: string[] = []
  const interfaces = os.networkInterfaces();
  for (let item in interfaces) {
    const iface = interfaces[item];
    if (!iface) continue
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        result.push(alias.address)
      }
    }
  }
  return result
}


export {
  getIPAdress
}
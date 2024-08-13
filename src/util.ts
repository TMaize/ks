import os from 'os'
import jwt from 'jsonwebtoken'

function getIPAdress(): string[] {
  const result: string[] = []
  const interfaces = os.networkInterfaces();
  for (let item in interfaces) {
    const iface = interfaces[item];
    if (!iface) continue
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal && !/\.1$/.test(alias.address)) {
        result.push(alias.address)
      }
    }
  }
  return result
}

function jwtSign(payload: any, secret: string) {
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: '1d'
  })
}

function jwtDecode(token: string, secret: string) {
  try {
    const payload = jwt.verify(token, secret) as any
    // delete payload.exp
    // delete payload.iat
    return payload
  } catch (error) {
    return null
  }
}

export {
  getIPAdress,
  jwtSign,
  jwtDecode
}
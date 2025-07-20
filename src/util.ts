import os from 'node:os'
import { SignJWT, jwtVerify } from 'jose'
import crypto from 'node:crypto'

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

function jwtSign(payload: any, secret: string): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secretKey);
}

function jwtDecode<T = any>(token: string, secret: string): Promise<T | null> {
  const secretKey = new TextEncoder().encode(secret);
  return jwtVerify(token, secretKey).then(resp => {
    return resp.payload as unknown as T
  }).catch(() => null)
}

function md5(str: string) {
  return crypto.createHash('md5').update(str).digest('hex')
}

export {
  getIPAdress,
  jwtSign,
  jwtDecode,
  md5
}
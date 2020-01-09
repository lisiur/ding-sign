import http, { RequestListener } from 'http'
import https from 'https'
import url from 'url'
import axios from 'axios'
import { createHash } from 'crypto'
import { httpLogger, envLogger } from './logger'

['SIGN_NONCE_STR', 'SIGN_APP_KEY', 'SIGN_APP_SECRET', 'SIGN_REQUEST_PATH', 'SIGN_REQUEST_PROTOCOL', 'SIGN_REQUEST_PORT'].forEach((env) => {
  if (!process.env[env]) {
    envLogger.error(`未配置 ${env}`)
    throw new Error(`未配置 ${env}`)
  }
  envLogger.info(`${env}=${process.env[env]}`)
})

const { SIGN_NONCE_STR, SIGN_APP_KEY, SIGN_APP_SECRET, SIGN_REQUEST_PATH, SIGN_REQUEST_PORT, SIGN_REQUEST_PROTOCOL } = process.env as any
const handler: RequestListener = async (request, response) => {
  httpLogger.http(`${request.method} ${request.url}`)
  const requestMethod = request.method
  const requestUrl = request.url ?? ''
  if (requestMethod === 'GET' && requestUrl.startsWith(SIGN_REQUEST_PATH)) {
    const query = url.parse(requestUrl, true).query
    const timeStamp = +new Date()
    const nonceStr = SIGN_NONCE_STR
    response.writeHead(200, {
      'Content-Type': 'application/json',
    })
    try {
      const signature = await getSignature({ pageUrl: query.pageUrl, timeStamp, nonceStr })
      const data = JSON.stringify({
        errcode: 0,
        errmsg: 'success',
        signature,
        timeStamp,
      })
      response.write(data)
      httpLogger.http(data)
    } catch (err) {
      if (err instanceof Error) {
        const data = JSON.stringify({
          errcode: -1,
          errmsg: err.message,
        })
        response.write(data)
        httpLogger.http(data)
      } else {
        const data = JSON.stringify(err)
        response.write(data)
        httpLogger.http(data)
      }
    }
    response.end()
  }
}

let server;
if (SIGN_REQUEST_PROTOCOL === 'http') {
  server = http.createServer(handler)
} else if (SIGN_REQUEST_PROTOCOL === 'https') {
  server = https.createServer(handler)
} else {
  throw new Error('SIGN_REQUEST_PROTOCOL可选值为 http|https')
}

server.listen(SIGN_REQUEST_PORT, () => {
  httpLogger.info(`server started at ${SIGN_REQUEST_PROTOCOL}://localhost:${SIGN_REQUEST_PORT}`)
  httpLogger.info(`request path is: ${SIGN_REQUEST_PATH}`)
})
server.on('error', (e) => {
  throw e
})



async function getToken() {
  const res = await axios.get('https://oapi.dingtalk.com/gettoken', {
    params: {
      appkey: SIGN_APP_KEY,
      appsecret: SIGN_APP_SECRET,
    }
  })
  if (res.data.errcode === 0) {
    return res.data.access_token
  } else {
    throw res.data
  }
}

async function getTicket(accessToken: string) {
  const res = await axios.get('https://oapi.dingtalk.com/get_jsapi_ticket', {
    params: {
      access_token: accessToken,
    },
  })
  if (res.data.errcode === 0) {
    return res.data.ticket
  } else {
    throw res.data
  }
}

function sign(query: any) {
  const { ticket, nonceStr, timeStamp, pageUrl } = query
  const plain = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timeStamp}&url=${pageUrl}`
  const sha1 = createHash('sha1')
  sha1.update(plain)
  return sha1.digest('hex')
}

async function getSignature({ pageUrl, timeStamp, nonceStr }: { pageUrl: any, timeStamp: any, nonceStr: string }) {
  const accessToken = await getToken()
  const ticket = await getTicket(accessToken)
  const signature = sign({
    ticket,
    nonceStr,
    timeStamp,
    pageUrl
  })
  return signature
}

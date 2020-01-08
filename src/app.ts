import http, {RequestListener} from 'http'
import https from 'https'
import url from 'url'
import axios from 'axios'
import {createHash} from 'crypto'

const {SIGN_NONCE_STR, SIGN_APP_KEY, SIGN_APP_SECRET, SIGN_REQUEST_PATH, SIGN_REQUEST_PORT, SIGN_REQUEST_PROTOCOL} = process.env
if (!SIGN_NONCE_STR) {
  throw new Error('未配置 SIGN_NONCE_STR')
}
if (!SIGN_APP_KEY) {
  throw new Error('未配置 SIGN_APP_KEY')
}
if (!SIGN_APP_SECRET) {
  throw new Error('未配置 SIGN_APP_SECRET')
}
if (!SIGN_REQUEST_PATH) {
  throw new Error('未配置 SIGN_REQUEST_PATH')
}
if (!SIGN_REQUEST_PORT) {
  throw new Error('未配置 SIGN_REQUEST_PORT')
}
if (!SIGN_REQUEST_PROTOCOL) {
  throw new Error('未配置 SIGN_REQUEST_PROTOCOL')
}

const handler: RequestListener = async (request, response) => {
  const requestMethod = request.method
  const requestUrl = request.url ?? ''
  if (requestMethod === 'GET' && requestUrl.startsWith(SIGN_REQUEST_PATH)) {
    const query = url.parse(requestUrl, true).query
    const timeStamp = +new Date()
    const nonceStr = SIGN_NONCE_STR
    const signature = await getSignature({pageUrl: query.pageUrl, timeStamp, nonceStr})
    response.writeHead(200, {
      'Content-Type': 'application/json',
    })
    response.write(JSON.stringify({
      errcode: 0,
      errmsg: 'success',
      signature,
      timeStamp,
    }))
    response.end()
  }
}

if (SIGN_REQUEST_PROTOCOL === 'http') {
  http.createServer(handler).listen(SIGN_REQUEST_PORT)
} else if (SIGN_REQUEST_PROTOCOL === 'https') {
  https.createServer(handler).listen(SIGN_REQUEST_PORT)
} else {
  throw new Error('SIGN_REQUEST_PROTOCOL可选值为 http|https')
}


async function getToken() {
  const res = await axios.get('https://oapi.dingtalk.com/gettoken', {
    params: {
      appkey: SIGN_APP_KEY,
      appsecret: SIGN_APP_SECRET,
    }
  })
  return res.data.access_token
}

async function getTicket(accessToken: string) {
  const res = await axios.get('https://oapi.dingtalk.com/get_jsapi_ticket', {
    params: {
      access_token: accessToken,
    },
  })
  return res.data.ticket
}

function sign(query: any) {
  const {ticket, nonceStr, timeStamp, pageUrl} = query
  const plain = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timeStamp}&url=${pageUrl}`
  const sha1 = createHash('sha1')
  sha1.update(plain)
  return sha1.digest('hex')
}

async function getSignature({pageUrl, timeStamp, nonceStr}: {pageUrl: any, timeStamp: any, nonceStr: string}) {
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

import serverless from 'serverless-http'
import app from '../../server/app.js'

const serverlessHandler = serverless(app)

export async function universalHandler(arg1, context) {
  try {
    // Netlify Functions v2 detection (arg1 is a Web standard Request object)
    if (
      (typeof Request !== 'undefined' && arg1 instanceof Request) ||
      (arg1 && arg1.url && typeof arg1.method === 'string' && !arg1.httpMethod)
    ) {
      const req = arg1
      const url = new URL(req.url)
      const headers = {}
      for (const [k, v] of req.headers.entries()) {
        headers[k.toLowerCase()] = v
      }

      let body = ''
      let isBase64 = false
      const contentType = req.headers.get('content-type') || ''

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (contentType.includes('multipart/form-data') || contentType.includes('image/')) {
          const buf = await req.arrayBuffer()
          body = Buffer.from(buf).toString('base64')
          isBase64 = true
        } else {
          body = await req.text()
        }
      }

      const event = {
        httpMethod: req.method,
        path: url.pathname,
        rawUrl: req.url,
        headers,
        queryStringParameters: Object.fromEntries(url.searchParams.entries()),
        body,
        isBase64Encoded: isBase64,
        requestContext: {},
      }

      const result = await serverlessHandler(event, context || {})
      const respHeaders = new Headers()
      for (const [k, v] of Object.entries(result.headers || {})) {
        if (v !== undefined && v !== null) {
          const lk = k.toLowerCase()
          if (lk !== 'transfer-encoding' && lk !== 'connection') {
            respHeaders.set(k, String(v))
          }
        }
      }

      const respBody = result.isBase64Encoded
        ? Buffer.from(result.body, 'base64')
        : (result.body || '')

      return new Response(respBody, {
        status: result.statusCode || 200,
        headers: respHeaders,
      })
    }

    // Netlify Functions v1 / AWS Lambda event format
    return await serverlessHandler(arg1, context || {})
  } catch (err) {
    console.error('[Netlify Function API Error]:', err)
    if (typeof Response !== 'undefined' && (arg1 instanceof Request || (arg1 && arg1.url))) {
      return new Response(JSON.stringify({ error: 'Erreur interne de la fonction Netlify', details: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erreur interne de la fonction Netlify', details: err.message }),
    }
  }
}

export default universalHandler
export const handler = universalHandler

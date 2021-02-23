import type { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import { FTL_CLIENT_DISABLE_THUMBNAILS } from '~env'
import { redis, previewKey, PreviewKeyField } from '~redis'

const router = nc<NextApiRequest, NextApiResponse>()

router.get(async (request, resp) => {
  if (FTL_CLIENT_DISABLE_THUMBNAILS) {
    resp.status(404).end()
    return
  }

  const streamID = Array.isArray(request.query.streamID)
    ? request.query.streamID[0]
    : request.query.streamID

  if (Number.isNaN(Number.parseInt(streamID, 10))) {
    resp.status(400).end()
    return
  }

  const key = previewKey(streamID)
  const exists = await redis.exists(key)
  if (exists === 0) {
    resp.status(404).end()
    return
  }

  const mime = await redis.hget(key, PreviewKeyField.MIME)
  const data = await redis.hgetBuffer(key, PreviewKeyField.Buffer)

  resp.setHeader('Content-Type', mime!)
  resp.send(data)
})

export default router

import { Hono } from 'hono'
import { userAuth, sellerAuth } from '../middlewares/auth.js'

export const fileRoutes = new Hono()

// 获取 OSS 直传凭证（商家上传商品图片）
// 前端拿到凭证后直接传到 OSS，不经过服务器，节省带宽
fileRoutes.get('/oss-token', sellerAuth, async (c) => {
  // TODO: 生成阿里云 OSS STS 临时凭证
  // const token = await getOssToken()
  return c.json({
    code: 0,
    message: 'ok',
    data: {
      accessKeyId: 'todo',
      accessKeySecret: 'todo',
      securityToken: 'todo',
      bucket: process.env.OSS_BUCKET,
      region: process.env.OSS_REGION,
      cdnUrl: process.env.OSS_CDN_URL,
    },
  })
})

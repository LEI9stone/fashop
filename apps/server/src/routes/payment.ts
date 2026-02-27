import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { userAuth } from '../middlewares/auth.js'

export const paymentRoutes = new Hono()

// 发起支付（买家）
// 根据订单ID，调用微信/抖音支付接口，返回支付参数
paymentRoutes.post('/prepay/:orderId', userAuth, async (c) => {
  const userId = c.get('jwtPayload').sub
  const order = await prisma.order.findFirst({
    where: { id: c.req.param('orderId'), userId, status: 'PENDING_PAY' },
  })
  if (!order) return c.json({ code: 404, message: '订单不存在' }, 404)

  // TODO: 调用微信/抖音支付接口
  // const payParams = await createWxPay(order) 或 createTtPay(order)

  return c.json({ code: 0, message: 'ok', data: { orderId: order.id } })
})

// 微信支付回调
paymentRoutes.post('/wx/notify', async (c) => {
  // TODO: 验证微信支付签名，更新订单状态
  // 注意：必须做幂等处理，防止重复回调
  const body = await c.req.text()
  console.log('微信支付回调:', body)
  return c.text('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>')
})

// 抖音支付回调
paymentRoutes.post('/tt/notify', async (c) => {
  // TODO: 验证抖音支付签名，更新订单状态
  const body = await c.req.json()
  console.log('抖音支付回调:', body)
  return c.json({ err_no: 0, err_tips: 'success' })
})

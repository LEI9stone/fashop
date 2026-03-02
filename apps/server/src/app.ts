import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import { authRoutes } from './routes/auth.js'
import { productRoutes } from './routes/product.js'
import { orderRoutes } from './routes/order.js'
import { cartRoutes } from './routes/cart.js'
import { addressRoutes } from './routes/address.js'
import { fileRoutes } from './routes/file.js'
import { sellerRoutes } from './routes/seller.js'
import { paymentRoutes } from './routes/payment.js'

export const app = new Hono()

// 中间件
app.use('*', logger())
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

// 健康检查
app.get('/', (c) => c.json({ status: 'ok', message: 'FaShop API' }))

// 路由注册
const api = app.basePath('/api')
api.route('/auth', authRoutes)
api.route('/products', productRoutes)
api.route('/orders', orderRoutes)
api.route('/cart', cartRoutes)
api.route('/addresses', addressRoutes)
api.route('/files', fileRoutes)
api.route('/seller', sellerRoutes)
api.route('/payment', paymentRoutes)

// 404 处理
app.notFound((c) => c.json({ code: 404, message: '接口不存在' }, 404))

// 全局错误处理
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ code: err.status, message: err.message }, err.status)
  }
  return c.json({ code: 500, message: '服务器内部错误' }, 500)
})

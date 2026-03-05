import { useState, useCallback } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { post, setToken } from '../../utils/request'
import { userLoginSchema, userRegisterConfirmSchema } from '@fashop/schema'

type TabType = 'login' | 'register'

export default function Login() {
  const [activeTab, setActiveTab] = useState<TabType>('login')
  const [form, setForm] = useState({ phone: '', password: '', confirmPassword: '' })
  const { phone, password, confirmPassword } = form
  const updateForm = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }))
  const [loading, setLoading] = useState(false)

  const handleLogin = useCallback(async () => {
    try {
      const params: Auth.LoginParams = { phone, password }
      const data = await post<Auth.LoginResult>('/api/auth/user/login', params)
      setToken(data.token)
      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => Taro.switchTab({ url: '/pages/index/index' }), 500)
    } catch (err: any) {
      // 覆盖 request 工具自动弹出的 toast
      Taro.showToast({ title: err?.message || '登录失败', icon: 'none' })
      if (err?.message === '账号未注册') {
        setActiveTab('register')
        updateForm({ confirmPassword: '' })
      }
    }
  }, [phone, password])

  const handleRegister = useCallback(async () => {
    try {
      const params: Auth.RegisterParams = { phone, password, nickname: `用户${phone.slice(-4)}` }
      const data = await post<Auth.LoginResult>('/api/auth/user/register', params)
      setToken(data.token)
      Taro.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => Taro.switchTab({ url: '/pages/index/index' }), 500)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '注册失败', icon: 'none' })
      if (err?.message === '手机号已注册') {
        setActiveTab('login')
        updateForm({ password: '', confirmPassword: '' })
      }
    }
  }, [phone, password])

  const handleSubmit = useCallback(async () => {
    const schema = activeTab === 'login' ? userLoginSchema : userRegisterConfirmSchema
    const data =
      activeTab === 'login'
        ? { phone, password }
        : { phone, password, confirmPassword, nickname: `用户${phone.slice(-4)}` }

    const result = schema.safeParse(data)
    if (!result.success) {
      Taro.showToast({ title: result.error.issues[0].message, icon: 'none' })
      return
    }

    if (loading) return
    setLoading(true)
    try {
      if (activeTab === 'login') {
        await handleLogin()
      } else {
        await handleRegister()
      }
    } finally {
      setLoading(false)
    }
  }, [activeTab, phone, password, confirmPassword, loading, handleLogin, handleRegister])

  const switchTab = useCallback((tab: TabType) => {
    setActiveTab(tab)
    setForm({ phone: '', password: '', confirmPassword: '' })
  }, [])

  return (
    <View className="min-h-screen bg-white flex flex-col">
      {/* 顶部装饰区域 */}
      <View className="relative pt-24 pb-10 px-8 bg-gradient-to-br from-primary to-primary-400 rounded-b-[48px]">
        <View className="flex flex-col items-center">
          <View className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Text className="text-primary text-3xl font-extrabold">F</Text>
          </View>
          <Text className="text-white text-2xl font-bold tracking-wide">fashop</Text>
          <Text className="text-white/70 text-sm mt-1">品质生活，从这里开始</Text>
        </View>

        {/* 登录/注册切换标签 */}
        <View className="flex mt-8 bg-white/20 rounded-full p-1">
          <View
            className={`flex-1 py-2 rounded-full flex items-center justify-center ${activeTab === 'login' ? 'bg-white' : ''}`}
            onClick={() => switchTab('login')}
          >
            <Text
              className={`text-base font-semibold ${activeTab === 'login' ? 'text-primary' : 'text-white'}`}
            >
              登录
            </Text>
          </View>
          <View
            className={`flex-1 py-2 rounded-full flex items-center justify-center ${activeTab === 'register' ? 'bg-white' : ''}`}
            onClick={() => switchTab('register')}
          >
            <Text
              className={`text-base font-semibold ${activeTab === 'register' ? 'text-primary' : 'text-white'}`}
            >
              注册
            </Text>
          </View>
        </View>
      </View>

      {/* 表单区域 */}
      <View className="flex-1 px-8 pt-8">
        <Text className="text-gray-800 text-xl font-bold mb-6 block">
          {activeTab === 'login' ? '欢迎回来' : '创建账号'}
        </Text>

        {/* 手机号 */}
        <View className="flex items-center border-b border-gray-200 py-3 mb-4">
          <Text className="text-lg mr-3">📱</Text>
          <Input
            className="flex-1 text-base text-gray-800"
            type="number"
            maxlength={11}
            placeholder="请输入手机号"
            placeholderClass="text-gray-400"
            value={phone}
            onInput={(e) => updateForm({ phone: e.detail.value })}
          />
        </View>

        {/* 密码 */}
        <View className="flex items-center border-b border-gray-200 py-3 mb-4">
          <Text className="text-lg mr-3">🔒</Text>
          <Input
            className="flex-1 text-base text-gray-800"
            password
            maxlength={20}
            placeholder="请输入密码"
            placeholderClass="text-gray-400"
            value={password}
            onInput={(e) => updateForm({ password: e.detail.value })}
          />
        </View>

        {/* 确认密码（注册时显示） */}
        {activeTab === 'register' && (
          <View className="flex items-center border-b border-gray-200 py-3 mb-4">
            <Text className="text-lg mr-3">🔐</Text>
            <Input
              className="flex-1 text-base text-gray-800"
              password
              maxlength={20}
              placeholder="请确认密码"
              placeholderClass="text-gray-400"
              value={confirmPassword}
              onInput={(e) => updateForm({ confirmPassword: e.detail.value })}
            />
          </View>
        )}

        {/* 提交按钮 */}
        <View
          className={`bg-primary rounded-full py-3 flex items-center justify-center mt-4 ${loading ? 'opacity-60' : 'active:opacity-80'}`}
          onClick={handleSubmit}
        >
          <Text className="text-white text-base font-semibold">
            {loading
              ? activeTab === 'login'
                ? '登录中...'
                : '注册中...'
              : activeTab === 'login'
                ? '登 录'
                : '注 册'}
          </Text>
        </View>

        {/* 底部辅助信息 */}
        <View className="flex items-center justify-center mt-6">
          <Text className="text-gray-400 text-xs">
            {activeTab === 'login' ? '登录即表示同意' : '注册即表示同意'}
          </Text>
          <Text className="text-primary text-xs ml-1">《用户协议》</Text>
          <Text className="text-gray-400 text-xs">和</Text>
          <Text className="text-primary text-xs">《隐私政策》</Text>
        </View>
      </View>
    </View>
  )
}

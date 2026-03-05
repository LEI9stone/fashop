import { useState, useCallback } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { get } from '../../utils/request'
import { getLocalSync, STORE_KEY } from '../../utils/local-storage'

const DEFAULT_AVATAR = 'https://img.yzcdn.cn/vant/cat.jpeg'
const BG_IMAGE = 'https://img.yzcdn.cn/vant/cat.jpeg'

export default function My() {
  const [profile, setProfile] = useState<User.Profile | null>(null)
  const [logged, setLogged] = useState(false)

  useDidShow(() => {
    const token = getLocalSync<string>(STORE_KEY.TOKEN)
    if (token) {
      setLogged(true)
      fetchProfile()
    } else {
      setLogged(false)
      setProfile(null)
    }
  })

  const fetchProfile = useCallback(async () => {
    try {
      const data = await get<User.Profile>('/api/user/profile')
      setProfile(data)
    } catch {
      setLogged(false)
      setProfile(null)
    }
  }, [])

  const maskId = (id: string) => {
    if (id.length <= 6) return id
    return id.slice(0, 2) + '****' + id.slice(-2)
  }

  const goLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index?from=my' })
  }

  const withAuth = (fn: () => void) => () => {
    if (!logged) return goLogin()
    fn()
  }

  const menuItems = [
    {
      label: '申请成为卖家',
      icon: '🏪',
      onClick: withAuth(() => Taro.navigateTo({ url: '/pages/seller/apply/index' })),
      highlight: true,
    },
    {
      label: '我的订单',
      icon: '📦',
      onClick: withAuth(() => Taro.navigateTo({ url: '/pages/order/list/index' })),
    },
    {
      label: '收货地址',
      icon: '📍',
      onClick: withAuth(() => Taro.navigateTo({ url: '/pages/address/index' })),
    },
    {
      label: '设置',
      icon: '⚙️',
      onClick: () => Taro.navigateTo({ url: '/pages/settings/index' }),
    },
  ]

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 顶部个人信息区 */}
      <View className="relative">
        <Image
          className="w-full h-56 block"
          src={BG_IMAGE}
          mode="aspectFill"
        />
        <View className="absolute inset-0 bg-black/30" />

        {logged && profile ? (
          <View className="absolute bottom-6 left-6 flex items-center">
            <Image
              className="w-16 h-16 rounded-full border-2 border-white"
              src={profile.avatar || DEFAULT_AVATAR}
              mode="aspectFill"
            />
            <View className="ml-4">
              <Text className="text-white text-lg font-bold block">
                {profile.nickname}
              </Text>
              <Text className="text-white/70 text-xs mt-1 block">
                ID: {maskId(profile.id)}
              </Text>
            </View>
          </View>
        ) : (
          <View
            className="absolute bottom-6 left-6 flex items-center"
            onClick={goLogin}
          >
            <View className="w-16 h-16 rounded-full border-2 border-white bg-white/30 flex items-center justify-center">
              <Text className="text-white text-2xl">👤</Text>
            </View>
            <View className="ml-4">
              <Text className="text-white text-lg font-bold block">
                点击登录
              </Text>
              <Text className="text-white/70 text-xs mt-1 block">
                登录后享受更多服务
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 功能菜单 */}
      <View className="mx-4 -mt-4 relative z-10 bg-white rounded-2xl overflow-hidden shadow-sm">
        {menuItems.map((item, index) => (
          <View
            key={item.label}
            className={`flex items-center px-5 py-4 active:bg-gray-50 ${
              index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
            }`}
            onClick={item.onClick}
          >
            <Text className="text-xl mr-3">{item.icon}</Text>
            <Text
              className={`flex-1 text-base ${
                item.highlight ? 'text-primary font-semibold' : 'text-gray-800'
              }`}
            >
              {item.label}
            </Text>
            <Text className="text-gray-400 text-sm">{'>'}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

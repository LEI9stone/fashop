import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useLoad } from '@tarojs/taro'

export default function Index() {
  useLoad(() => {
    console.log('Page loaded.')
  })

  const handleClick = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  return (
    <View className="flex items-center justify-center min-h-screen bg-gray-100">
      <Text className="bg-primary text-white text-2xl font-bold">Hello world!</Text>
      <Text className="text-black">测试内容</Text>
      <Button className="bg-primary text-white text-2xl font-bold" onClick={handleClick}>
        按钮
      </Button>
    </View>
  )
}

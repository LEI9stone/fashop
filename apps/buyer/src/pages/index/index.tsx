import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'

export default function Index() {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className="flex items-center justify-center min-h-screen bg-gray-100">
      <Text className="bg-primary text-white text-2xl font-bold">Hello world!</Text>
      <Text className="text-black">测试内容</Text>
    </View>
  )
}

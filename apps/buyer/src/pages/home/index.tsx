import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

export default function HomePage() {
  useLoad(() => {
    console.log('Home page loaded')
  })

  return (
    <View className='home'>
      <Text>首页 - 待开发</Text>
    </View>
  )
}

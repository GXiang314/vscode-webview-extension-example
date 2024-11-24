<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import logPath from '@/assets/logo.svg'
import { useWebviewPublicPath } from '@/hooks/use-webview-public-path'
import { useAxios } from '@/hooks/use-axios'
import { useMessage } from '@/hooks/use-message'

// Webview 公共資源地址範例
const logoUrl = useWebviewPublicPath(logPath)

// 網路請求範例
const whoami = ref()
const onAxiosRequestClick = async () => {
  const { get } = useAxios()
  const { data } = await get('https://developer.mozilla.org/api/v1/whoami')
  whoami.value = data
}

// Webview 之間的通訊範例
const messgeSend = ref('')
const { message: messageRecevice, sendMessageToSidebar } = useMessage()
</script>

<template>
  <header class="min-h-screen lg:flex lg:items-center lg:pr-8">
    <img :src="logoUrl" alt="Vue logo" class="mx-auto mb-8 lg:mb-0 lg:mr-8 w-32 h-32" width="125" height="125" />

    <div class="space-y-12 w-full">
      <!-- Axios Test Block -->
      <div class="py-4">
        <h2 class="text-xl font-bold mb-4">Axios 服務測試範例</h2>
        <button @click="onAxiosRequestClick()"
          class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
          請求資料
        </button>
        <div class="mt-2">酬載：{{ whoami }}</div>
      </div>

      <!-- Webview Communication Block -->
      <div class="py-4">
        <h2 class="text-xl font-bold mb-4">Webview 之間的通訊範例</h2>
        <div class="space-y-4">
          <div class="flex flex-col space-y-2">
            <label for="webview-message-input">請輸入訊息：</label>
            <input type="text" id="webview-message-input" v-model="messgeSend"
              class="text-stone-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button @click="sendMessageToSidebar(messgeSend)"
            class="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors">
            發送訊息
          </button>
          <div class="space-y-1">
            <div>接受到的訊息： {{ messageRecevice.value }}</div>
            <div>發送者： {{ messageRecevice.from }}</div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="py-4 text-center lg:text-left">
        <div class="space-x-4">
          <RouterLink to="/" class="inline-block px-4 py-2 text-gray-700 hover:text-blue-500 transition-colors"
            active-class="text-blue-500">
            Home
          </RouterLink>
          <RouterLink to="/about" class="inline-block px-4 py-2 text-gray-700 hover:text-blue-500 transition-colors"
            active-class="text-blue-500">
            About
          </RouterLink>
        </div>
      </nav>
    </div>
  </header>
  <RouterView />
</template>
import { onMounted, onUnmounted, ref } from 'vue'
import { useCall, useSubscrible } from './use-cec-client'

const MY_MESSAGE_SUBJECT_NAME = 'view-sidebar'
const PANEL_MESSAGE_SUBJECT_NAME = 'view-panel'

export function useMessage() {
  const addMessageListener = (listener: (msgBody: { from: string; value: any }) => void) => {
    return useSubscrible('Message.register', listener, MY_MESSAGE_SUBJECT_NAME)
  }
  const sendMessage = (toMessageSubjectName: string, msgValue: any) => {
    const msgBody = {
      from: MY_MESSAGE_SUBJECT_NAME,
      value: msgValue
    }
    useCall('Message.send', toMessageSubjectName, msgBody)
  }

  const message = ref<{ from?: string; value?: any }>({} as any)
  onMounted(() => {
    const cancel = addMessageListener((msgBody) => {
      message.value = msgBody
    })
    onUnmounted(cancel)
  })

  return {
    message,
    sendMessage,
    sendMessageToPanel: sendMessage.bind({}, PANEL_MESSAGE_SUBJECT_NAME)
  }
}

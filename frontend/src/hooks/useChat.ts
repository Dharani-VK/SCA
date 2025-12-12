import { useCallback, useState } from 'react'
import { askQuestion } from '../services/api/chat'
import useAppStore, { type AppState } from '../store/useAppStore'
import { nanoid } from 'nanoid'
import type { ChatMessage } from '../types/chat'

export function useChat() {
  const { chatHistory, addChatMessages } = useAppStore((state: AppState) => ({
    chatHistory: state.chatHistory,
    addChatMessages: state.addChatMessages,
  }))

  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(
    async (content: string) => {
      setIsLoading(true)
      const userMessage: ChatMessage = {
        id: nanoid(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      }
      const updatedHistory = [...chatHistory, userMessage]
      addChatMessages([userMessage])

      try {
        const response = await askQuestion({
          message: content,
          conversation: updatedHistory.map((entry) => ({ role: entry.role, content: entry.content })),
        })
        const assistantMessage: ChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content: response.message,
          sources: response.sources,
          createdAt: new Date().toISOString(),
        }
        addChatMessages([assistantMessage])
      } catch (error) {
        console.error(error)
        const errorMessage: ChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content: 'The assistant is offline. Please try again later.',
          createdAt: new Date().toISOString(),
        }
        addChatMessages([errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [addChatMessages, chatHistory]
  )

  return { chatHistory, sendMessage, isLoading }
}

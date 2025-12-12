import ChatWindow from '../components/chat/ChatWindow'
import ChatInput from '../components/chat/ChatInput'
import { useChat } from '../hooks/useChat'
import { clsx } from 'clsx'

function ChatPage() {
  const { chatHistory, sendMessage, isLoading } = useChat()

  return (
    <div className="relative flex h-full flex-col items-center justify-center p-1" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Animated Gradient Border Layer */}
      <div
        className={clsx(
          "absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 transition-opacity duration-500",
          isLoading ? "opacity-100 blur-sm" : "opacity-0"
        )}
      />

      {/* Moving "Beam" for the border when loading */}
      {isLoading && (
        <div className="absolute -inset-[2px] -z-10 overflow-hidden rounded-3xl">
          <div className="absolute top-1/2 left-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-70" />
        </div>
      )}

      {/* Main Glassmorphism Chat Container */}
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/95">

        {/* Header Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={clsx("h-2.5 w-2.5 rounded-full transition-colors duration-500", isLoading ? "animate-pulse bg-indigo-500" : "bg-emerald-500")} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {isLoading ? 'AI Neural Core Active' : 'System Ready'}
            </span>
          </div>
          {isLoading && (
            <div className="flex gap-1">
              <span className="h-1 w-1 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]"></span>
              <span className="h-1 w-1 animate-bounce rounded-full bg-purple-400 [animation-delay:-0.15s]"></span>
              <span className="h-1 w-1 animate-bounce rounded-full bg-pink-400"></span>
            </div>
          )}
        </div>

        <ChatWindow
          messages={chatHistory.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            sources: message.sources,
          }))}
          isLoading={isLoading}
        />
        <div className="border-t border-slate-100 bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-900/30">
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  )
}

export default ChatPage

import { useEffect, useRef } from 'react'
import { useAppSelector } from '../../app/hooks'
import ChatBubble from './ChatBubble'

export default function MessageList() {
  const messages = useAppSelector(s => s.chat.messages)
  const currentUserId = useAppSelector(s => s.auth.user?.id)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const grouped: { date: string; messages: typeof messages }[] = []
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
    const last = grouped[grouped.length - 1]
    if (last?.date === date) last.messages.push(msg)
    else grouped.push({ date, messages: [msg] })
  })

  return (
    <main className="flex-1 overflow-y-auto p-lg flex flex-col space-y-thread-gap bg-surface">
      {grouped.map(group => (
        <div key={group.date} className="px-4">
          <div className="flex justify-center my-4">
            <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-label-sm">{group.date}</span>
          </div>
          {group.messages.map((msg, i) => {
            const isOwn = msg.sender_id === currentUserId
            const prevMsg = group.messages[i - 1]
            const nextMsg = group.messages[i + 1]
            const isFirstInCluster = !prevMsg || prevMsg.sender_id !== msg.sender_id
            const isLastInCluster = !nextMsg || nextMsg.sender_id !== msg.sender_id
            return (
              <div key={msg.id} className={isLastInCluster ? 'mb-thread-gap' : 'mb-message-gap'}>
                <ChatBubble
                  message={msg}
                  isOwn={isOwn}
                  showAvatar={!isOwn && isFirstInCluster}
                />
              </div>
            )
          })}
        </div>
      ))}
      <div ref={bottomRef} />
    </main>
  )
}

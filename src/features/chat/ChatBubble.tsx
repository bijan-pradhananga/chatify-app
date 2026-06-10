import type { Message } from './chatSlice'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import SpamBadge from '../spam/SpamBadge'

interface Props {
  message: Message
  isOwn: boolean
  showAvatar: boolean
}

function ChatAvatar({ url, username }: { url?: string | null; username?: string }) {
  const initials = (username || '?').slice(0, 2).toUpperCase()
  return (
    <Avatar className="w-8 h-8">
      <AvatarImage src={url ?? undefined} alt={username} />
      <AvatarFallback className="bg-secondary-container text-on-secondary-container text-label-sm font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatBubble({ message, isOwn, showAvatar }: Props) {
  const isHidden = message.is_spam
  const isFlagged = !message.is_spam && message.spam_score >= 40

  if (isOwn) {
    return (
      <div className="flex flex-col items-end self-end w-full md:px-10">
        <div className="flex flex-col items-end space-y-message-gap">
          {isHidden ? (
            <div className="bg-surface-container dark:bg-gray-700 text-on-surface-variant dark:text-gray-400 px-4 py-2.5 rounded-2xl rounded-br-none shadow-sm text-body-md italic">
              [Message blocked as spam]
            </div>
          ) : (
            <>
              {isFlagged && <div className="mb-1"><SpamBadge score={message.spam_score} isSpam={false} /></div>}
              {message.content && (
                <div className="bg-primary text-on-primary px-4 py-2.5 rounded-2xl rounded-br-none shadow-md text-body-md">
                  {message.content}
                </div>
              )}
              {(message.message_type === 'image' || message.message_type === 'mixed') && !message.attachments?.length
                ? (
                  <div className="w-52 h-36 rounded-xl bg-primary/10 dark:bg-gray-700 animate-pulse flex items-center justify-center border border-primary/20">
                    <span className="material-symbols-outlined text-primary/40 dark:text-gray-500 text-4xl">image</span>
                  </div>
                )
                : message.attachments?.map(att => (
                  <img key={att.id} src={att.public_url} alt={att.file_name}
                    className="rounded-xl max-w-sm object-cover border border-primary/20 shadow" />
                ))
              }
            </>
          )}
        </div>
        <div className="flex items-center mt-1 space-x-1">
          <span className="text-slate-400 dark:text-gray-500 text-label-sm">{formatTime(message.created_at)}</span>
          <span className="material-symbols-outlined text-blue-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start max-w-[80%]">
      <div className="flex items-end space-x-2 group">
        <div className="flex-shrink-0 mb-1">
          {showAvatar
            ? <ChatAvatar url={message.profiles?.avatar_url} username={message.profiles?.username} />
            : <div className="w-8 h-8" />}
        </div>
        <div className="flex flex-col space-y-message-gap">
          {isHidden ? (
            <div className="bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400 px-4 py-2.5 rounded-2xl rounded-bl-none shadow-sm text-body-md italic">
              [Message blocked as spam]
            </div>
          ) : (
            <>
              {isFlagged && <SpamBadge score={message.spam_score} isSpam={false} />}
              {message.content && (
                <div className="bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-none shadow-sm text-body-md">
                  {message.content}
                </div>
              )}
              {(message.message_type === 'image' || message.message_type === 'mixed') && !message.attachments?.length
                ? (
                  <div className="w-52 h-36 rounded-2xl rounded-bl-none bg-slate-200 dark:bg-gray-700 animate-pulse flex items-center justify-center border border-slate-200 dark:border-gray-600">
                    <span className="material-symbols-outlined text-slate-400 dark:text-gray-500 text-4xl">image</span>
                  </div>
                )
                : message.attachments?.map(att => (
                  <div key={att.id} className="bg-slate-100 dark:bg-gray-700 p-2 rounded-2xl rounded-bl-none shadow-sm overflow-hidden border border-slate-200 dark:border-gray-600">
                    <img src={att.public_url} alt={att.file_name} className="rounded-xl w-full max-w-sm object-cover aspect-video mb-2" />
                  </div>
                ))
              }
            </>
          )}
        </div>
      </div>
      <span className="ml-10 mt-1 text-slate-400 dark:text-gray-500 text-label-sm">{formatTime(message.created_at)}</span>
    </div>
  )
}

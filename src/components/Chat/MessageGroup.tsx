import React, { memo } from 'react'
import { generateMessageKey, ExtendedChatMessage } from './helpers'
import { CHAT_ROLES } from '@/constants/chat'
import styles from './Chat.module.scss'

interface MessageGroupProps {
  date: string
  dateLabel: string
  messages: ExtendedChatMessage[]
}

const MessageGroup = memo<MessageGroupProps>(
  ({ date, dateLabel, messages }) => {
    return (
      <div className={styles.message_group}>
        <div className={styles.date_separator}>{dateLabel}</div>
        {messages.map((message, messageIndex) => (
          <div
            key={`${date}-${generateMessageKey(message, messageIndex)}`}
            className={`${message.role === CHAT_ROLES.USER ? styles.user : ''}`}>
            {message.content}
          </div>
        ))}
      </div>
    )
  },
)

MessageGroup.displayName = 'MessageGroup'

export default MessageGroup

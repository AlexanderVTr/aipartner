'use client'
import { useState } from 'react'
import styles from './Tooltip.module.scss'

interface TooltipProps {
  children: React.ReactNode
  content: string
  show?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({
  children,
  content,
  show = true,
  position = 'bottom',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  // If show is false or no content, just render children
  if (!show || !content) {
    return <>{children}</>
  }

  return (
    <div
      className={styles.tooltipWrapper}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible && (
        <div className={`${styles.tooltip} ${styles[position]}`}>
          {content}
        </div>
      )}
    </div>
  )
}

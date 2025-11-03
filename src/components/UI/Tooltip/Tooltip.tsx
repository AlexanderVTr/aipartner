'use client'
import { useState, useRef } from 'react'
import styles from './Tooltip.module.scss'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // If show is false or no content, just render children
  if (!show || !content) {
    return <>{children}</>
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 500)
  }

  return (
    <div
      className={styles.tooltipWrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      {children}
      {isVisible && (
        <div
          className={`${styles.tooltip} ${styles[position]}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}>
          {content}
        </div>
      )}
    </div>
  )
}

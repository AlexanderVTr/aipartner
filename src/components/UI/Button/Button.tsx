import styles from './Button.module.scss'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'round'
  href?: string
  target?: string
  rel?: string
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  href,
  target,
  rel,
  className,
  onClick,
  disabled,
}: ButtonProps) {
  const buttonClass = `${styles.button} ${styles[variant]} ${className || ''}`

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={buttonClass}>
        {children}
      </a>
    )
  }

  return (
    <button className={buttonClass} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

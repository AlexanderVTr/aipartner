import styles from './Button.module.scss'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'round'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
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
  size = 'lg',
  href,
  target,
  rel,
  className,
  onClick,
  disabled,
}: ButtonProps) {
  const buttonClass = `${styles.button} ${styles[variant]} ${styles[`size-${size}`]} ${className || ''}`

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

import styles from './Button.module.scss'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  href?: string
  target?: string
  rel?: string
  className?: string
  onClick?: () => void
}

export default function Button({
  children,
  variant = 'primary',
  href,
  target,
  rel,
  className,
  onClick,
  ...props
}: ButtonProps) {
  const buttonClass = `${styles.button} ${styles[variant]} ${className || ''}`

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={buttonClass}
        {...props}>
        {children}
      </a>
    )
  }

  return (
    <button className={buttonClass} onClick={onClick} {...props}>
      {children}
    </button>
  )
}

import type { ButtonHTMLAttributes } from 'react'
import './IconButton.css'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  'aria-label': string
}

// Small round secondary button with an icon only (the sound retry control).
export default function IconButton({ className, type = 'button', ...rest }: IconButtonProps) {
  const classes = className ? `icon-button ${className}` : 'icon-button'
  return <button type={type} className={classes} {...rest} />
}

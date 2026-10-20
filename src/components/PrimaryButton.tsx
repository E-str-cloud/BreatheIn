import type { ButtonHTMLAttributes } from 'react'
import './PrimaryButton.css'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

// Wide pill button used for the main actions (Enter, Start).
export default function PrimaryButton({ className, type = 'button', ...rest }: PrimaryButtonProps) {
  const classes = className ? `primary-button ${className}` : 'primary-button'
  return <button type={type} className={classes} {...rest} />
}

import { clsx } from 'clsx'
import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-gray-400">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            'h-9 w-full rounded-lg border bg-[#0f1117] px-3 text-sm text-gray-200 placeholder-gray-600',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40',
            error
              ? 'border-red-500/50 focus:ring-red-500/40'
              : 'border-gray-700/60 hover:border-gray-600/60 focus:border-accent/50',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

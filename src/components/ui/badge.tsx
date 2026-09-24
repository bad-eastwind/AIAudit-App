import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-indigo-600 text-white hover:bg-indigo-700',
        secondary: 'border-transparent bg-zinc-700 text-zinc-100 hover:bg-zinc-600',
        destructive: 'border-transparent bg-red-900/50 text-red-300 hover:bg-red-900',
        outline: 'text-zinc-300 border-zinc-700',
        success: 'border-transparent bg-emerald-900/50 text-emerald-300',
        warning: 'border-transparent bg-amber-900/50 text-amber-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

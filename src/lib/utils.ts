// =============================================================================
// lib/utils.ts
// =============================================================================
// Utility for merging Tailwind classes safely

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================================================
// INSTALLATION
// =============================================================================
//
// 1. Install dependencies:
//    npm install clsx tailwind-merge
//
// 2. Save this file as lib/utils.ts
//
// 3. Import in your components:
//    import { cn } from '@/lib/utils';
//
// 4. Usage example:
//    <div className={cn(
//      "base-class",
//      isActive && "active-class",
//      className // props
//    )}>
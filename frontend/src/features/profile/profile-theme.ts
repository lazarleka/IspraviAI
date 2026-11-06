import type { CSSProperties } from 'react'

import type { AvatarColor } from '@/lib/users'

const profilePalettes: Record<
  AvatarColor,
  { surface: string; foreground: string; muted: string; border: string; accent: string }
> = {
  blue: {
    surface: '#185fa5',
    foreground: '#ffffff',
    muted: '#d1e8fb',
    border: '#4c95d5',
    accent: '#fac775',
  },
  amber: {
    surface: '#ef9f27',
    foreground: '#412402',
    muted: '#633806',
    border: '#fac775',
    accent: '#412402',
  },
  green: {
    surface: '#97c459',
    foreground: '#173404',
    muted: '#27500a',
    border: '#c0dd97',
    accent: '#173404',
  },
  purple: {
    surface: '#afa9ec',
    foreground: '#26215c',
    muted: '#403a79',
    border: '#cfccf4',
    accent: '#403a79',
  },
  rose: {
    surface: '#ed93b1',
    foreground: '#5b1830',
    muted: '#7b2443',
    border: '#f4bbcc',
    accent: '#7b2443',
  },
}

type ProfileThemeProperties = CSSProperties & Record<`--profile-card${string}`, string>

export function profileTheme(color: AvatarColor): ProfileThemeProperties {
  const palette = profilePalettes[color]

  return {
    '--profile-card': palette.surface,
    '--profile-card-foreground': palette.foreground,
    '--profile-card-muted': palette.muted,
    '--profile-card-border': palette.border,
    '--profile-card-accent': palette.accent,
  }
}

// What other users see about a user, see docs/entities.md ("User"). Shared by friends and matches.
export type PublicUser = {
  id: number
  username: string
  displayName: string
}

export type AvatarColor = 'blue' | 'amber' | 'green' | 'purple' | 'rose'

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { useLogout } from '../api/use-auth'

export function SignOutButton() {
  const logout = useLogout()
  return (
    <Button variant="ghost" size="icon" aria-label="Odjavi se" onClick={logout}>
      <LogOut className="size-5" aria-hidden="true" />
    </Button>
  )
}

import type { ReactNode } from 'react'

type AuthPageProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

// Shared frame for /login and /register: logo, one heading, the form, a link to the other page.
export function AuthPage({ title, subtitle, children, footer }: AuthPageProps) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col gap-3">
        <p className="font-heading text-2xl font-bold">
          Ispravi <span className="rounded-sm bg-marker px-1 text-marker-foreground">AI</span>
        </p>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
      <p className="text-center text-sm text-muted-foreground">{footer}</p>
    </div>
  )
}

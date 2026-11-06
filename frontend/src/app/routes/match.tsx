import { useParams } from 'react-router'

import { MatchBoard } from '@/features/matches/components/match-board'

export function MatchPage() {
  const { matchId } = useParams()
  return (
    <div className="mx-auto w-full max-w-5xl">
      <MatchBoard matchId={Number(matchId)} />
    </div>
  )
}

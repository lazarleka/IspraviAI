import { useParams } from 'react-router'

import { MatchResultView } from '@/features/matches/components/match-result-view'

export function MatchResultPage() {
  const { matchId } = useParams()
  return (
    <div className="mx-auto w-full max-w-5xl">
      <MatchResultView matchId={Number(matchId)} />
    </div>
  )
}

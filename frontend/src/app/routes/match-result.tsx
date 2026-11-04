import { useParams } from 'react-router'

import { MatchResultView } from '@/features/matches/components/match-result-view'

export function MatchResultPage() {
  const { matchId } = useParams()
  return <MatchResultView matchId={Number(matchId)} />
}

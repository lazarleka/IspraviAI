import { useParams } from 'react-router'

import { MatchBoard } from '@/features/matches/components/match-board'

export function MatchPage() {
  const { matchId } = useParams()
  return <MatchBoard matchId={Number(matchId)} />
}

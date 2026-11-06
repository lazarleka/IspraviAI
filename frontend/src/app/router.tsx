import { createBrowserRouter } from 'react-router'

import { AuthedLayout } from '@/app/authed-layout'
import { DeckPage } from '@/app/routes/deck'
import { Friends } from '@/app/routes/friends'
import { Home } from '@/app/routes/home'
import { Login } from '@/app/routes/login'
import { MatchPage } from '@/app/routes/match'
import { MatchResultPage } from '@/app/routes/match-result'
import { NewDeck } from '@/app/routes/new-deck'
import { NotFound } from '@/app/routes/not-found'
import { ProfileEditPage } from '@/app/routes/profile-edit'
import { ProfilePage } from '@/app/routes/profile'
import { Register } from '@/app/routes/register'
import { StudyPage } from '@/app/routes/study'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    element: <AuthedLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/decks/new', element: <NewDeck /> },
      { path: '/decks/:deckId', element: <DeckPage /> },
      { path: '/study/:deckId', element: <StudyPage /> },
      { path: '/friends', element: <Friends /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/profile/edit', element: <ProfileEditPage /> },
      { path: '/match/:matchId', element: <MatchPage /> },
      { path: '/match/:matchId/result', element: <MatchResultPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

// Cards the mock "AI" uses for every PvP topic. The real backend generates them from the topic.
import type { CardAnswer } from '@/lib/cards'

type MockCard = Omit<CardAnswer, 'id' | 'deckId'>

const text = (
  segments: string[],
  wrongIndex: number | null,
  correctText: string | null,
  explanation: string,
): MockCard => ({
  kind: 'text',
  language: null,
  segments,
  wrongIndex,
  correctText,
  explanation,
  errorType: wrongIndex === null ? null : 'fact',
  sourceRef: null,
})

const code = (
  segments: string[],
  wrongIndex: number | null,
  correctText: string | null,
  explanation: string,
): MockCard => ({
  kind: 'code',
  language: 'c',
  segments,
  wrongIndex,
  correctText,
  explanation,
  errorType: wrongIndex === null ? null : 'code_bug',
  sourceRef: null,
})

export const MOCK_MATCH_CARDS: MockCard[] = [
  text(
    ['Voda ključa', 'na 90 °C', 'pri normalnom pritisku.'],
    1,
    'na 100 °C',
    'Pri normalnom atmosferskom pritisku voda ključa na 100 °C.',
  ),
  text(
    ['Glavni grad Crne Gore', 'je Nikšić,', 'a prijestonica je Cetinje.'],
    1,
    'je Podgorica,',
    'Glavni grad je Podgorica, a Cetinje je prijestonica.',
  ),
  text(
    ['Svjetlost putuje', 'brzinom od oko', '3 000 km/s.'],
    2,
    '300 000 km/s.',
    'Brzina svjetlosti u vakuumu je oko 300 000 km/s.',
  ),
  code(
    ['for (int i = 0; i <= n; i++)', '  suma += niz[i];'],
    0,
    'for (int i = 0; i < n; i++)',
    'Sa <= petlja čita niz[n], koji je van niza.',
  ),
  text(
    ['Kostur odraslog čovjeka', 'ima oko', '206 kostiju.'],
    null,
    null,
    'Odrasla osoba ima oko 206 kostiju; beba ih ima više, jer se neke kasnije srastu.',
  ),
  text(
    ['Zbir uglova u trouglu', 'iznosi', '360°.'],
    2,
    '180°.',
    'Zbir unutrašnjih uglova trougla je uvijek 180°.',
  ),
  text(
    ['Najveći okean na Zemlji', 'je Atlantski okean.'],
    1,
    'je Tihi okean.',
    'Tihi okean je najveći i najdublji okean.',
  ),
  text(['Kiseonik ima', 'hemijski simbol', 'K.'], 2, 'O.', 'K je simbol kalijuma; kiseonik je O.'),
  code(
    ['int x = 10 / 3;', '// x je sada 3'],
    null,
    null,
    'U C-u dijeljenje dva cijela broja odbacuje ostatak, pa je x = 3.',
  ),
  text(['Mjesec je', 'prirodni satelit', 'Marsa.'], 2, 'Zemlje.', 'Mjesec je prirodni satelit Zemlje.'),
  text(['Dunav se uliva', 'u Jadransko more.'], 1, 'u Crno more.', 'Dunav se uliva u Crno more.'),
  text(['Broj π je približno', '3,41.'], 1, '3,14.', 'π ≈ 3,14159…'),
  text(
    ['Zemlja obiđe oko Sunca', 'za oko', '30 dana.'],
    2,
    '365 dana.',
    'Jedan obilazak Zemlje oko Sunca traje oko 365 dana.',
  ),
  text(
    ['Fotosinteza se odvija', 'u ribozomima.'],
    1,
    'u hloroplastima.',
    'Ribozomi prave proteine; fotosinteza se odvija u hloroplastima.',
  ),
  text(
    ['Prvi srpski ustanak', 'počeo je', '1804. godine.'],
    null,
    null,
    'Prvi srpski ustanak počeo je 1804. godine.',
  ),
]

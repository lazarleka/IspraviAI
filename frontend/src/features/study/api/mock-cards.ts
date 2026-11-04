// Mock card bank in Montenegrin, two variants per fact (factKey) with the error in different places.
// Decks 1–3 match the mock decks in features/decks; any other deck id reuses the biology bank.
import type { CardAnswer } from '@/lib/cards'

type BankCard = Omit<CardAnswer, 'id' | 'deckId'> & { factKey: string }

const t = (
  factKey: string,
  segments: string[],
  wrongIndex: number | null,
  correctText: string | null,
  explanation: string,
  sourceRef: string | null,
  errorType: CardAnswer['errorType'] = 'fact',
): BankCard => ({
  factKey,
  kind: 'text',
  language: null,
  segments,
  wrongIndex,
  correctText,
  explanation,
  errorType: wrongIndex === null ? null : errorType,
  sourceRef,
})

const c = (
  factKey: string,
  segments: string[],
  wrongIndex: number | null,
  correctText: string | null,
  explanation: string,
): BankCard => ({
  factKey,
  kind: 'code',
  language: 'c',
  segments,
  wrongIndex,
  correctText,
  explanation,
  errorType: wrongIndex === null ? null : 'code_bug',
  sourceRef: null,
})

const biology: BankCard[] = [
  t(
    'bio-place',
    ['Fotosinteza se odvija', 'u mitohondrijama', 'biljnih ćelija', 'i za nju je potrebna svjetlost.'],
    1,
    'u hloroplastima',
    'Mitohondrije služe za ćelijsko disanje, a fotosinteza se odvija u hloroplastima.',
    'skripta, str. 12',
  ),
  t(
    'bio-place',
    ['Fotosinteza se odvija', 'u hloroplastima', 'biljnih ćelija', 'i za nju nije potrebna svjetlost.'],
    3,
    'i za nju je potrebna svjetlost.',
    'Bez svjetlosti nema svjetlosne faze, pa ni fotosinteze.',
    'skripta, str. 12',
    'logic',
  ),
  t(
    'bio-gases',
    ['Tokom fotosinteze biljka', 'uzima ugljen-dioksid', 'i otpušta ugljen-dioksid.'],
    2,
    'i otpušta kiseonik.',
    'Biljka uzima ugljen-dioksid, a kiseonik je proizvod fotosinteze.',
    'skripta, str. 13',
  ),
  t(
    'bio-gases',
    ['Tokom fotosinteze biljka', 'uzima azot', 'i otpušta kiseonik.'],
    1,
    'uzima ugljen-dioksid',
    'Za fotosintezu je potreban ugljen-dioksid iz vazduha, ne azot.',
    'skripta, str. 13',
  ),
  t(
    'bio-pigment',
    ['Zeleni pigment hlorofil', 'upija uglavnom', 'zelenu svjetlost,', 'zato su listovi zeleni.'],
    2,
    'crvenu i plavu svjetlost,',
    'Hlorofil zelenu svjetlost odbija, i zato listove vidimo kao zelene.',
    'skripta, str. 14',
    'logic',
  ),
  t(
    'bio-pigment',
    ['Zeleni pigment hlorofil', 'upija uglavnom', 'crvenu i plavu svjetlost,', 'a zelenu odbija.'],
    null,
    null,
    'Hlorofil upija crvenu i plavu svjetlost, a zelenu odbija.',
    'skripta, str. 14',
  ),
  t(
    'bio-equation',
    ['Jednačina fotosinteze:', '6CO₂ + 6H₂O', '→ C₆H₁₂O₆ + 6CO₂', 'uz energiju svjetlosti.'],
    2,
    '→ C₆H₁₂O₆ + 6O₂',
    'Proizvodi fotosinteze su glukoza i kiseonik (6O₂).',
    'skripta, str. 15',
    'calculation',
  ),
  t(
    'bio-equation',
    ['Jednačina fotosinteze:', '6CO₂ + 12O₂', '→ C₆H₁₂O₆ + 6O₂', 'uz energiju svjetlosti.'],
    1,
    '6CO₂ + 6H₂O',
    'Polazne supstance su ugljen-dioksid i voda (6H₂O).',
    'skripta, str. 15',
    'calculation',
  ),
  t(
    'bio-glucose',
    [
      'Prema istraživanju Univerziteta u Beču iz 2019.,',
      'glukoza nastala fotosintezom',
      'biljci služi kao izvor energije.',
    ],
    0,
    '(bez izmišljenog izvora)',
    'Ovo istraživanje ne postoji. AI često izmišlja izvore koji zvuče uvjerljivo.',
    null,
    'fake_source',
  ),
  t(
    'bio-glucose',
    ['Glukoza nastala fotosintezom', 'biljci uvijek služi', 'isključivo kao izvor energije.'],
    2,
    'kao izvor energije i gradivni materijal.',
    'Glukoza je i izvor energije i sirovina za skrob i celulozu, pa „isključivo“ nije tačno.',
    'skripta, str. 16',
    'exaggeration',
  ),
]

const history: BankCard[] = [
  t(
    'his-first',
    ['Prvi srpski ustanak', 'počeo je 1815. godine', 'u Orašcu,', 'a predvodio ga je Karađorđe.'],
    1,
    'počeo je 1804. godine',
    'Prvi srpski ustanak podignut je 1804, a 1815. je počeo Drugi.',
    'Istorija 7, str. 48',
  ),
  t(
    'his-first',
    ['Prvi srpski ustanak', 'počeo je 1804. godine', 'u Orašcu,', 'a predvodio ga je Miloš Obrenović.'],
    3,
    'a predvodio ga je Karađorđe.',
    'Prvi ustanak je predvodio Karađorđe Petrović; Miloš Obrenović je vodio Drugi.',
    'Istorija 7, str. 48',
  ),
  t(
    'his-second',
    ['Drugi srpski ustanak', 'podignut je 1815. godine', 'u Orašcu.'],
    2,
    'u Takovu.',
    'Drugi srpski ustanak podignut je u Takovu, a Prvi u Orašcu.',
    'Istorija 7, str. 52',
  ),
  t(
    'his-second',
    ['Drugi srpski ustanak', 'podignut je 1804. godine', 'u Takovu.'],
    1,
    'podignut je 1815. godine',
    'Godina 1804. je početak Prvog ustanka; Drugi je počeo 1815.',
    'Istorija 7, str. 52',
  ),
  t(
    'his-end',
    ['Prvi srpski ustanak', 'trajao je', 'od 1804. do 1830. godine.'],
    2,
    'od 1804. do 1813. godine.',
    'Prvi ustanak je ugušen 1813. godine.',
    'Istorija 7, str. 50',
  ),
  t(
    'his-end',
    ['Prvi srpski ustanak', 'trajao je', 'od 1804. do 1813. godine.'],
    null,
    null,
    'Prvi srpski ustanak trajao je od 1804. do 1813. godine.',
    'Istorija 7, str. 50',
  ),
]

const programming: BankCard[] = [
  c(
    'c-fact',
    ['int fakt(int n) {', '  if (n == 0) return 0;', '  return n * fakt(n - 1);', '}'],
    1,
    '  if (n == 0) return 1;',
    'Osnovni slučaj mora vratiti 1 (0! = 1). Sa 0 bi svaki rezultat bio 0.',
  ),
  c(
    'c-fact',
    ['int fakt(int n) {', '  if (n == 0) return 1;', '  return n * fakt(n + 1);', '}'],
    2,
    '  return n * fakt(n - 1);',
    'Sa n + 1 rekurzija nikad ne stiže do osnovnog slučaja i program pada (stack overflow).',
  ),
  c(
    'c-fib',
    ['int fib(int n) {', '  if (n < 2) return 1;', '  return fib(n - 1) + fib(n - 2);', '}'],
    1,
    '  if (n < 2) return n;',
    'fib(0) mora biti 0, a ova verzija vraća 1 i pomjera cijeli niz.',
  ),
  c(
    'c-fib',
    ['int fib(int n) {', '  if (n < 2) return n;', '  return fib(n - 1) * fib(n - 2);', '}'],
    2,
    '  return fib(n - 1) + fib(n - 2);',
    'Fibonačijev broj je zbir dva prethodna, ne proizvod.',
  ),
  t(
    'c-base',
    ['Svaka rekurzivna funkcija', 'ne smije imati osnovni slučaj', 'koji prekida pozive.'],
    1,
    'mora imati osnovni slučaj',
    'Bez osnovnog slučaja rekurzija se nikad ne zaustavlja.',
    null,
    'logic',
  ),
  t(
    'c-base',
    ['Svaka rekurzivna funkcija', 'mora imati osnovni slučaj', 'koji prekida pozive.'],
    null,
    null,
    'Osnovni slučaj zaustavlja rekurziju.',
    null,
  ),
  t(
    'c-array',
    ['Niz od 10 elemenata u C-u', 'ima indekse', 'od 1 do 10.'],
    2,
    'od 0 do 9.',
    'U C-u indeksi počinju od 0, pa je posljednji indeks 9.',
    null,
    'code_bug',
  ),
  t(
    'c-array',
    ['Niz od 10 elemenata u C-u', 'ima indekse', 'od 0 do 10.'],
    2,
    'od 0 do 9.',
    'Indeks 10 je već van niza; to je klasična greška „za jedan“.',
    null,
    'code_bug',
  ),
]

export const CARD_BANKS: Record<number, BankCard[]> = { 1: biology, 2: history, 3: programming }
export const FALLBACK_BANK = biology
export type { BankCard }

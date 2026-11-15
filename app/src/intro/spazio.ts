// Scritto da strumenti/intro/voci_spazio.py: non si corregge a mano.
// Le due voci dell'intro nello spazio (documento 09, §17): il registro di bordo di William, detto da
// Leonardo Tomassetti, e il messaggio di Yusuf dalla radio. Un file ciascuna, che si suona intero:
// quanto dura, quando dice il suo nome, e le frasi con i loro tempi nel file (per chi non sente la voce).
export interface VoceNelloSpazio {
  dura: number;
  nome: number;
  frasi: { da: number; a: number; testo: string }[];
}

export const REGISTRO: VoceNelloSpazio = {
  "dura": 42.04,
  "nome": 8.29,
  "frasi": [
    {
      "da": 0.15,
      "a": 6.13,
      "testo": "«Registro di bordo della Santa Maria. Matricola TSC-1972."
    },
    {
      "da": 7.03,
      "a": 12.13,
      "testo": "Il capitano, William T. Eriksonn, che è anche tutto l’equipaggio."
    },
    {
      "da": 13.27,
      "a": 16.51,
      "testo": "Navigazione regolare. Pilota automatico."
    },
    {
      "da": 17.43,
      "a": 22.09,
      "testo": "Il reattore fa il suo solito lamento. Il giorno che smetterà, mi preoccuperò."
    },
    {
      "da": 23.15,
      "a": 25.57,
      "testo": "Il quadrante del margine non lo guardo."
    },
    {
      "da": 26.09,
      "a": 29.07,
      "testo": "Yusuf lo chiamerò quando avrò qualcosa da dirgli."
    },
    {
      "da": 30.31,
      "a": 35.03,
      "testo": "Lo dico ad alta voce mentre lo scrivo. Spesso non ho di meglio da fare."
    },
    {
      "da": 36.23,
      "a": 41.69,
      "testo": "Settimana sei. Stiva vuota. Nessun contatto. W. T.»"
    }
  ]
};

export const MESSAGGIO: VoceNelloSpazio = {
  "dura": 37.13,
  "nome": 1.0,
  "frasi": [
    {
      "da": 0.54,
      "a": 8.86,
      "testo": "«William. Sono Yusuf. Lo so che li ricevi, i miei messaggi: la radio di quella carretta funziona benissimo, quando sei tu ad aver bisogno di qualcosa."
    },
    {
      "da": 9.9,
      "a": 16.82,
      "testo": "Sei settimane, maledetto. I filtri, le guarnizioni, la cella buona: tutto a credito, e da te non è arrivato niente."
    },
    {
      "da": 17.04,
      "a": 23.04,
      "testo": "Né i soldi né la roba. Qui c’è gente che chiede a me, non a te. Così mi farai finire nei guai, lo capisci?"
    },
    {
      "da": 24.08,
      "a": 29.68,
      "testo": "…otto, nove, dieci. Richiamami. Anche solo per dirmi di no."
    },
    {
      "da": 30.72,
      "a": 36.74,
      "testo": "E se quella carretta ti ha mollato alla deriva… almeno dimmelo. Magazzino Quattro, chiudo.»"
    }
  ]
};

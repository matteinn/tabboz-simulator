// Tabboz Simulator
// Copyright (c) 1997-2000 Andrea Bonomi
//
// Port of lavoro.c. Released under the GNU General Public License v3 or later.
// 31 Maggio 1999 - Conversione Tabbozzo -> Tabbozza

import {
    DialogBox, EndDialog, IDCANCEL, IDNO, IDOK, IDYES, LOWORD, MB_ICONHAND, MB_ICONINFORMATION,
    MB_ICONQUESTION, MB_OK, MB_YESNO, MessageBox, SetDlgItemText, TRUE, FALSE, WM_COMMAND, WM_INITDIALOG,
    hInst,
} from '../win32.js';
import { T, random } from '../state.js';
import { TabbozPlaySound } from './readkey.js';
import { MostraSoldi } from './zarrosim.js';
import { Evento } from './eventi.js';

let punti_scheda = 0;

const Risposte1 = [0, 0, 0];
const Risposte2 = [0, 0, 0];
const Risposte3 = [0, 0, 0];

// Numero di ditte
const NUM_DITTE = 8;
//              xxx (speed) = lavoro fuori porta (solo con lo scooter puoi arrivarci...)
const LavoroMem = [
    { speed: 0, nome: '---' },
    { speed: 0, nome: 'Magneti Budelli' },
    { speed: 0, nome: 'Diamine' },
    { speed: 1, nome: 'Testmec' },
    { speed: 0, nome: 'Ti Impalo Bene Bene' },
    { speed: 1, nome: 'October' },
    { speed: 1, nome: "Arlond's" },
    { speed: 1, nome: "286 - Computer d' annata" }, // 14/01/2000
    { speed: 1, nome: 'Ricopio' }, // 14/01/2000
];

let scheda = 0; /* numero scheda del quiz ( 0 - 9 ) */
let accetto = 0;

let Rcheck = 0;
let Lcheck = 0;

/********************************************************************/
/* Lavoro...                                                        */
/********************************************************************/

async function GiornoDiLavoro(hDlg, s) {
    if (T.numeroditta < 1) {
        await MessageBox(hDlg, `Forse non ti ricordi che sei disokkupat${T.ao}...`, s, MB_OK | MB_ICONINFORMATION);
        return TRUE;
    }

    if (T.x_vacanza === 2) {
        await MessageBox(hDlg,
            `Arrivat${T.ao} davanti ai cancelli della ditta li trovi inrimediabilmente chiusi...`,
            s, MB_OK | MB_ICONINFORMATION);
        return TRUE;
    }

    return FALSE;
}

export async function Lavoro(hDlg, message, wParam) {
    let i;

    if (message === WM_INITDIALOG) {
        if (T.sesso === 'M') SetDlgItemText(hDlg, 113, 'Fai il leccaculo');
        else SetDlgItemText(hDlg, 113, 'Fai la leccaculo');

        AggiornaLavoro(hDlg);
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 110: { // Cerca Lavoro --------------------------------------------------------------
                if (T.x_vacanza === 2) {
                    await MessageBox(hDlg,
                        `Arrivat${T.ao} davanti ai cancelli della ditta li trovi inrimediabilmente chiusi...`,
                        'Cerca Lavoro', MB_OK | MB_ICONINFORMATION);
                    return TRUE;
                }

                if (T.numeroditta > 0) {
                    await MessageBox(hDlg, "Forse non ti ricordi che hai gia' un lavoro...",
                        'Cerca Lavoro', MB_OK | MB_ICONINFORMATION);
                    return TRUE;
                }

                Rcheck = 0; /* Check per il numero di risposte */
                Lcheck = 0; /* Check delle risposte */

                const n_ditta = random(NUM_DITTE) + 1;

                await DialogBox(hInst, 389 + n_ditta, hDlg, CercaLavoro);

                if (accetto === IDNO) {
                    // Viva la finezza...
                    await MessageBox(hDlg, 'Allora sparisci...', 'Cerca Lavoro', MB_OK | MB_ICONINFORMATION);
                    return TRUE;
                }

                scheda = random(9);
                punti_scheda = 0;

                await DialogBox(hInst, 200 + scheda, hDlg, CercaLavoro);

                /* Facciamo finta che la scheda venga effettivamente tenuta in considerazione...            */
                /* forse in un futuro verranno controllate le risposte, ma per ora non servono a nulla.     */

                /* 24 Maggio 1998 - v0.6.94 */
                /* Le risposte cominciano a venire controllate.... */
                for (i = 0; i < 3; i++) if (Risposte1[i]) Rcheck += 1;
                for (i = 0; i < 3; i++) if (Risposte2[i]) Rcheck += 10;
                for (i = 0; i < 3; i++) if (Risposte3[i]) Rcheck += 100;

                if (Rcheck !== 111) {
                    if (T.sesso === 'M') {
                        await MessageBox(hDlg,
                            "Mi spieghi perche' dovremmo assumere qualcuno che non e' neanche in grado di mettere delle crocette su un foglio ???",
                            "Sei un po' stupido...", MB_OK | MB_ICONQUESTION);
                    } else {
                        await MessageBox(hDlg,
                            "Signorina,mi spieghi perche' dovremmo assumere qualcuno che non e' neanche in grado di mettere delle crocette su un foglio ???",
                            "Sei un po' stupida...", MB_OK | MB_ICONQUESTION);
                    }
                    AggiornaLavoro(hDlg);
                    return TRUE;
                }

                if (T.Reputazione + T.Fortuna + random(80) > random(200)) {
                    T.impegno = 10 + random(20);
                    T.giorni_di_lavoro = 1;
                    T.stipendio = 1000 + random(10) * 100;
                    T.numeroditta = n_ditta;

                    let tmp;
                    if (T.sesso === 'M') tmp = `SEI STATO ASSUNTO ! Ora sei un felice dipendente della ${LavoroMem[n_ditta].nome} !`;
                    else tmp = `SEI STATO ASSUNTA ! Ora sei una felice dipendente della ${LavoroMem[n_ditta].nome} !`;

                    await MessageBox(hDlg, tmp, 'Hai trovato lavoro !', MB_OK | MB_ICONINFORMATION);
                } else {
                    if (T.sesso === 'M') {
                        await MessageBox(hDlg,
                            'Mi dispiace ragazzo, ma non sei riuscito a superare il test... Ora puoi anche portare la tua brutta faccia fuori dal mio ufficio, prima che ti faccia buttare fuori a calci... Grazie e arrivederci...',
                            'Cerca Lavoro', MB_OK | MB_ICONINFORMATION);
                    } else {
                        await MessageBox(hDlg,
                            "Mi dispiace signorina, ma non e' riuscito a superare il test... Se ne vada immediatamente, grazie...",
                            'Cerca Lavoro', MB_OK | MB_ICONINFORMATION);
                    }

                    if (T.Reputazione > 10) T.Reputazione -= 2;
                }

                await Evento(hDlg);
                AggiornaLavoro(hDlg);
                return TRUE;
            }

            case 111: /* Licenziati -------------------------------------------------------------- */
                if (await GiornoDiLavoro(hDlg, 'Licenziati')) return TRUE;

                accetto = await MessageBox(hDlg,
                    `Sei proprio sicur${T.ao} di voler dare le dimissioni dalla ${LavoroMem[T.numeroditta].nome} ?`,
                    'Licenziati', MB_YESNO | MB_ICONQUESTION);

                if (accetto === IDYES) {
                    T.numeroditta = 0;
                    T.impegno = 0;
                    T.giorni_di_lavoro = 0;
                    T.stipendio = 0;
                    await Evento(hDlg);
                }
                AggiornaLavoro(hDlg);
                return TRUE;

            case 112: /* Chiedi aumento salario -------------------------------------------------- */
                if (await GiornoDiLavoro(hDlg, 'Chiedi aumento salario')) return TRUE;

                if (T.impegno > 90) {
                    if (30 + T.Fortuna > 30 + random(50)) {
                        await MessageBox(hDlg, "Forse per questa volta potremmo darti qualcosina in piu'...",
                            'Chiedi aumento salario', MB_OK | MB_ICONINFORMATION);
                        T.stipendio += (random(1) + 1) * 100;
                        T.impegno -= 30;
                        await Evento(hDlg);
                    } else {
                        if (T.sesso === 'M') {
                            await MessageBox(hDlg, 'Vedi di scordartelo,bastardo...',
                                'Chiedi aumento salario', MB_OK | MB_ICONHAND);
                        } else {
                            await MessageBox(hDlg, 'Vedi di scordartelo,stronzetta...',
                                'Chiedi aumento salario', MB_OK | MB_ICONHAND);
                        }

                        T.impegno -= 20;
                        await Evento(hDlg);
                    }
                } else {
                    await MessageBox(hDlg, 'Che cosa vorresti ??? SCORDATELO !!!!',
                        'Chiedi aumento salario', MB_OK | MB_ICONHAND);
                }

                AggiornaLavoro(hDlg);
                return TRUE;

            case 113: /* Fai il leccaculo -------------------------------------------------------- */
                if (T.sesso === 'M') {
                    if (await GiornoDiLavoro(hDlg, 'Fai il leccaculo')) return TRUE;
                } else {
                    if (await GiornoDiLavoro(hDlg, 'Fai la leccaculo')) return TRUE;
                }

                if (T.sound_active) TabbozPlaySound(503);

                if (T.Reputazione > 20) T.Reputazione -= 1; /* Facendo il leccaculo perdi reputazione e fama... */
                if (T.impegno < 99) T.impegno++;

                i = random(T.Fortuna + 3);
                if (i === 0) await Evento(hDlg);

                AggiornaLavoro(hDlg);
                return TRUE;

            case 114: /* Elenco ditte ------------------------------------------------------------ */
                if (T.numeroditta === 0) {
                    await DialogBox(hInst, 210, hDlg, ElencoDitte);
                } else {
                    await DialogBox(hInst, T.numeroditta + 289, hDlg, CercaLavoro);
                }
                return TRUE;

            case 115: /* Sciopera  -------------------------------------------------------------- */
                if (await GiornoDiLavoro(hDlg, 'Sciopera')) return TRUE;

                if (T.sound_active) TabbozPlaySound(502);
                if (T.Reputazione < 85) T.Reputazione += 10;

                if (T.impegno > 19) T.impegno -= 15;

                i = random(T.Fortuna + 3);
                if (i === 0) await Evento(hDlg);

                await Evento(hDlg);
                AggiornaLavoro(hDlg);
                return TRUE;

            case 116: /* Lavora  ---------------------------------------------------------------- */
                if (await GiornoDiLavoro(hDlg, 'Lavora')) return TRUE;
                if (T.impegno < 85) T.impegno++;

                if (T.sound_active) TabbozPlaySound(501);
                await Evento(hDlg);
                AggiornaLavoro(hDlg);
                return TRUE;

            case IDCANCEL:
            case IDOK:
                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

/* Cerca Lavoro ------------------------------------------------------------------------------- */

async function CercaLavoro(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        for (let i = 0; i < 3; i++) Risposte1[i] = 0; /* Azzera le risposte... */
        for (let i = 0; i < 3; i++) Risposte2[i] = 0;
        for (let i = 0; i < 3; i++) Risposte3[i] = 0;
        return TRUE;
    } else if (message === WM_COMMAND) {
        const id = LOWORD(wParam);
        switch (id) {
            case 101:
            case 102:
            case 103:
                Risposte1[id - 101] = Risposte1[id - 101] ? 0 : 1;
                return TRUE;
            case 104:
            case 105:
            case 106:
                Risposte2[id - 104] = Risposte2[id - 104] ? 0 : 1;
                return TRUE;
            case 107:
            case 108:
            case 109:
                Risposte3[id - 107] = Risposte3[id - 107] ? 0 : 1;
                return TRUE;
            case IDCANCEL:
                EndDialog(hDlg, TRUE);
                accetto = IDNO;
                return TRUE;
            case IDOK:
                EndDialog(hDlg, TRUE);
                accetto = IDYES;
                return TRUE;
        }
    }

    return FALSE;
}

function AggiornaLavoro(hDlg) {
    if (T.numeroditta < 1) {
        // Nessun lavoro
        SetDlgItemText(hDlg, 105, ''); // Ditta
        SetDlgItemText(hDlg, 106, ''); // Stipendio
        SetDlgItemText(hDlg, 107, ''); // Impegno
    } else {
        SetDlgItemText(hDlg, 105, LavoroMem[T.numeroditta].nome); // Ditta
        SetDlgItemText(hDlg, 106, MostraSoldi(T.stipendio)); // Stipendio
        SetDlgItemText(hDlg, 107, `${T.impegno}/100`); // Impegno
    }
    SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));
}

async function ElencoDitte(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            // Informazioni su ogni ditta
            case 100:
            case 101:
            case 102:
            case 103:
            case 104:
            case 105:
            case 106:
            case 107:
            case 108:
            case 109:
                await DialogBox(hInst, LOWORD(wParam) + 190, hDlg, CercaLavoro);
                return TRUE;

            case IDCANCEL:
            case IDOK:
                EndDialog(hDlg, TRUE);
                return TRUE;
        }
    }

    return FALSE;
}

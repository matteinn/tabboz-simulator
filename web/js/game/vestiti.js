// Tabboz Simulator
// Copyright (c) 1997-2000 Andrea Bonomi
//
// Port of vestiti.c: negozi di vestiti, tabaccaio e palestra.
// Released under the GNU General Public License v3 or later.

import {
    DialogBox, EndDialog, IDCANCEL, IDOK, IDYES, LOWORD, LoadString, MB_ICONINFORMATION, MB_ICONQUESTION,
    MB_ICONSTOP, MB_OK, MB_YESNO, MessageBox, SetDlgItemText, TRUE, FALSE, WM_COMMAND, WM_INITDIALOG,
    hInst,
} from '../win32.js';
import { CELLULAR, PALESTRA, T, TABACCAIO, VESTITI, random } from '../state.js';
import { TabbozPlaySound } from './readkey.js';
import { MostraSoldi, nomoney } from './zarrosim.js';
import { Evento } from './eventi.js';
import { InfoMese } from './tempo.js';
import { Cellular } from './telefono.js';

/* Per una questione di svogliatezza del programmatore, viene usata STSCOOTER anche x i vestiti. */
//                   fama, prezzo
const VestitiMem = [
    { fama: 0, prezzo: 0, nome: '---' },
    { fama: 8, prezzo: 348, nome: '' }, // -- Giubbotto "Fatiscenza"
    { fama: 9, prezzo: 378, nome: '' }, //
    { fama: 7, prezzo: 298, nome: '' }, //
    { fama: 8, prezzo: 248, nome: '' }, //    Giacca di pelle (3 Nuovi Giubbotti)
    { fama: 9, prezzo: 378, nome: '' }, //    Fatiscenza verde
    { fama: 10, prezzo: 418, nome: '' }, //    Fatiscenza bianco
    { fama: 3, prezzo: 90, nome: '' }, // -- Pantaloni gessati

    { fama: 5, prezzo: 170, nome: '' }, //    Pantaloni tuta
    { fama: 6, prezzo: 248, nome: '' }, //    Pantaloni in plastika
    { fama: 5, prezzo: 190, nome: '' }, //    Pantaloni scacchiera 21 giugno 1999

    { fama: 4, prezzo: 122, nome: '' }, // -- Scarpe da tabbozzi...
    { fama: 6, prezzo: 220, nome: '' }, //    Buffalo
    { fama: 2, prezzo: 58, nome: '' }, //    Scarpe da tabbozzi...
    { fama: 4, prezzo: 142, nome: '' }, //    NUOVE Scarpe da tabbozzi...   23 Aprile 1998
    { fama: 4, prezzo: 142, nome: '' }, //    ""		""
    { fama: 5, prezzo: 166, nome: '' }, //    ""		""
    { fama: 6, prezzo: 230, nome: '' }, //    Nuove Buffalo
];

/* Abbonamenti Palestra ---------------------------------------------------------------------------- */

const PalestraMem = [
    { fama: 0, prezzo: 50 }, // Un mese	21 Apr 1998
    { fama: 8, prezzo: 270 }, // Sei mesi
    { fama: 9, prezzo: 500 }, // Un anno
    { fama: 9, prezzo: 14 }, // Una lampada
];

/* Sigarette --------------------------------------------------------------------------------------- */

//  speed = condensato, cc = nicotina * 10 ( 7 = nicotina 0.7, 10 = nicotina 1 )
const SizeMem = [
    { speed: 5, cc: 5, fama: 2, prezzo: 6, nome: 'Barclay' },
    { speed: 8, cc: 7, fama: 1, prezzo: 6, nome: 'Camel' },
    { speed: 7, cc: 6, fama: 2, prezzo: 6, nome: 'Davidoff Superior Lights' },
    { speed: 7, cc: 6, fama: 2, prezzo: 6, nome: 'Davidoff Mildnes' },
    { speed: 13, cc: 9, fama: 2, prezzo: 6, nome: 'Davidoff Classic' },
    { speed: 9, cc: 7, fama: 1, prezzo: 5, nome: 'Diana Blu' },
    { speed: 12, cc: 9, fama: 1, prezzo: 5, nome: 'Diana Rosse' },
    { speed: 8, cc: 7, fama: 0, prezzo: 6, nome: 'Dunhill Lights' },
    { speed: 7, cc: 5, fama: 0, prezzo: 6, nome: 'Merit' },
    { speed: 14, cc: 10, fama: 0, prezzo: 6, nome: 'Gauloises Blu' },
    { speed: 7, cc: 6, fama: 0, prezzo: 6, nome: 'Gauloises Rosse' },
    { speed: 13, cc: 10, fama: 1, prezzo: 6, nome: 'Unlucky Strike' },
    { speed: 9, cc: 7, fama: 1, prezzo: 6, nome: 'Unlucky Strike Lights' },
    { speed: 8, cc: 6, fama: 2, prezzo: 6, nome: 'Malborro Medium' }, // dovrebbero essere come le lights 4 Marzo 1999
    { speed: 12, cc: 9, fama: 2, prezzo: 6, nome: 'Malborro Rosse' },
    { speed: 8, cc: 6, fama: 2, prezzo: 6, nome: 'Malborro Lights' },
    { speed: 11, cc: 10, fama: 0, prezzo: 5, nome: 'NS Rosse' },
    { speed: 9, cc: 8, fama: 0, prezzo: 5, nome: 'NS Mild' },
    { speed: 9, cc: 7, fama: 1, prezzo: 5, nome: 'Poll Mon Blu' },
    { speed: 12, cc: 9, fama: 1, prezzo: 5, nome: 'Poll Mon Rosse' },
    { speed: 12, cc: 10, fama: 2, prezzo: 6, nome: 'Philip Morris' },
    { speed: 4, cc: 4, fama: 2, prezzo: 6, nome: 'Philip Morris Super Light' },
    { speed: 10, cc: 9, fama: 1, prezzo: 5, nome: 'Armadis' },
    { speed: 11, cc: 9, fama: 0, prezzo: 5, nome: 'Winston' },
];

/********************************************************************/
/* Vestiti...                                                       */
/********************************************************************/

/* Vestito da Babbo Natale... 11 Marzo 1999 */
const COSTO_VESTITO_NATALIZIO = 58;

export async function Vestiti(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        SetDlgItemText(hDlg, 120, MostraSoldi(T.Soldi));

        if (T.x_mese === 12 && T.Soldi >= COSTO_VESTITO_NATALIZIO) {
            if (T.x_giorno > 14 && T.x_giorno < 25 && T.current_gibbotto !== 19 && T.current_pantaloni !== 19) {
                const scelta = await MessageBox(hDlg,
                    `Vuoi comperare, per ${MostraSoldi(COSTO_VESTITO_NATALIZIO)}, un meraviglioso vestito da Babbo Natale ?`,
                    'Offerte Natalizie...', MB_YESNO | MB_ICONQUESTION);
                if (scelta === IDYES) {
                    T.current_gibbotto = 19;
                    T.current_pantaloni = 19;
                    T.TabbozRedraw = 1; // E' necessario ridisegnare l' immagine del Tabbozzo...
                    T.Soldi -= COSTO_VESTITO_NATALIZIO;
                }
            }
        }

        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 101: // MAKEINTRESOURCE 80
            case 102: // MAKEINTRESOURCE 81
            case 103: // MAKEINTRESOURCE 82
            case 104: // MAKEINTRESOURCE 83
            case 105: // MAKEINTRESOURCE 84
                await RunVestiti(hDlg, LOWORD(wParam) - 21);
                SetDlgItemText(hDlg, 120, MostraSoldi(T.Soldi));
                return TRUE;

            case 110: // Tabaccaio
                await RunTabacchi(hDlg);
                SetDlgItemText(hDlg, 120, MostraSoldi(T.Soldi));
                return TRUE;

            case 111: // Palestra
                await RunPalestra(hDlg);
                SetDlgItemText(hDlg, 120, MostraSoldi(T.Soldi));
                return TRUE;

            case 112: // Cellulare
                await DialogBox(hInst, CELLULAR, hDlg, Cellular);
                SetDlgItemText(hDlg, 120, MostraSoldi(T.Soldi));
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

//*******************************************************************
// Routine per il pagamento di qualunque cosa...
//*******************************************************************

export async function PagaQualcosa(hInstance) {
    if (T.scelta !== 0) {
        if (VestitiMem[T.scelta].prezzo > T.Soldi) {
            await nomoney(hInstance, VESTITI);
        } else {
            T.Soldi -= VestitiMem[T.scelta].prezzo;

            switch (T.scelta) {
                /* 25 Febbraio 1999 */
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                    T.current_gibbotto = T.scelta;
                    break;
                case 7:
                case 8:
                case 9:
                case 10:
                    T.current_pantaloni = T.scelta - 6;
                    break;
                case 11:
                case 12:
                case 13:
                case 14:
                case 15:
                case 16:
                case 17:
                    T.current_scarpe = T.scelta - 10;
                    break;
            }

            T.TabbozRedraw = 1; // E' necessario ridisegnare l' immagine del Tabbozzo...

            T.Fama += VestitiMem[T.scelta].fama;
            if (T.Fama > 100) T.Fama = 100;
        }
        await Evento(hInstance);
    }
}

//*******************************************************************
// Routine di acquisto generica
//*******************************************************************

export async function CompraQualcosa(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        T.scelta = 0;
        SetDlgItemText(hDlg, 120, MostraSoldi(T.Soldi));
        SetDlgItemText(hDlg, 121, `${T.Fama}/100`);

        // nel C il ciclo arriva a 119 e legge oltre la fine di VestitiMem (controlli che non esistono)
        for (let i = 101; i < 120; i++) {
            if (VestitiMem[i - 100]) SetDlgItemText(hDlg, i, MostraSoldi(VestitiMem[i - 100].prezzo));
        }
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 101:
            case 102:
            case 103:
            case 104:
            case 105:
            case 106:
            case 107:
            case 108:
            case 109:
            case 110:
            case 111:
            case 112:
            case 113:
            case 114:
            case 115:
            case 116:
            case 117:
            case 118:
            case 119:
                T.scelta = LOWORD(wParam) - 100;
                return TRUE;

            case IDCANCEL:
                T.scelta = 0;
                EndDialog(hDlg, TRUE);
                return TRUE;

            case IDOK:
                await PagaQualcosa(hDlg);
                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

//*******************************************************************
// Tabaccaio ! (che centra tra i vestiti ??? Come procedura e' simile...)
//*******************************************************************

export async function Tabaccaio(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        if (T.sound_active) TabbozPlaySound(203);
        T.scelta = -1; // Fino alla 0.8.51pr c'era un bug che non faceva comprare le Barclay...
        SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));
        SetDlgItemText(hDlg, 105, `${T.sizze}`);
        SetDlgItemText(hDlg, 106, `Che sigarette vuoi, ragazz${T.ao} ?`);
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 400:
            case 401:
            case 402:
            case 403:
            case 404:
            case 405:
            case 406:
            case 407:
            case 408:
            case 409:
            case 410:
            case 411:
            case 412:
            case 413:
            case 414:
            case 415:
            case 416:
            case 417:
            case 418:
            case 419:
            case 420:
            case 421:
            case 422:
            case 423: {
                T.scelta = LOWORD(wParam) - 400;
                const tmp = LoadString(hInst, LOWORD(wParam) + 1000);

                let tmp_descrizione;
                if (SizeMem[T.scelta].cc === 0) {
                    /* Se i valori sono impostati a 0, non li scrive */
                    tmp_descrizione = `${SizeMem[T.scelta].nome}\n${tmp}`;
                } else {
                    const quot = Math.trunc(SizeMem[T.scelta].cc / 10);
                    const rem = SizeMem[T.scelta].cc % 10;
                    tmp_descrizione = `${SizeMem[T.scelta].nome}\n${tmp}Condensato: ${SizeMem[T.scelta].speed} Nicotina: ${quot}.${rem}`;
                }

                SetDlgItemText(hDlg, 106, tmp_descrizione);
                return TRUE;
            }

            case IDCANCEL:
                T.scelta = -1;
                EndDialog(hDlg, TRUE);
                return TRUE;

            case IDOK:
                if (T.scelta !== -1) {
                    if (SizeMem[T.scelta].prezzo > T.Soldi) {
                        await nomoney(hDlg, TABACCAIO);
                    } else {
                        T.Soldi -= SizeMem[T.scelta].prezzo;
                        T.Fama += SizeMem[T.scelta].fama;
                        if (T.Fama > 100) T.Fama = 100;
                        T.sizze += 20;
                    }
                    const i = random(8) + 600;
                    const tmp = LoadString(hInst, i); // 600 -> 607
                    await MessageBox(hDlg, tmp, 'ART. 46 L. 29/12/1990 n. 428', MB_OK | MB_ICONINFORMATION);

                    await Evento(hDlg);
                }

                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

//*******************************************************************
// Palestra ! (che centra tra i vestiti ??? Come procedura e' simile...)
//*******************************************************************

function AggiornaPalestra(parent) {
    let tmp;

    SetDlgItemText(parent, 104, MostraSoldi(T.Soldi));
    SetDlgItemText(parent, 105, `${T.Fama}/100`);

    if (T.scad_pal_giorno < 1) {
        SetDlgItemText(parent, 106, 'Nessun Abbonamento');
    } else {
        SetDlgItemText(parent, 106,
            `Scadenza abbonamento: ${T.scad_pal_giorno} ${InfoMese[T.scad_pal_mese - 1].nome}`);
    }

    // Scrive il grado di abbronzatura... 4 Marzo 1999
    switch (T.current_testa) {
        case 1:
            tmp = 'Abbronzatura Lieve';
            break;
        case 2:
            tmp = 'Abbronzatura Media';
            break;
        case 3:
            tmp = 'Abbronzatura Pesante';
            break;
        case 4:
            tmp = `Carbonizzat${T.ao}...`;
            break;
        default:
            tmp = `Non abbronzat${T.ao}`;
    }
    SetDlgItemText(parent, 107, tmp);
}

//*******************************************************************

export async function Palestra(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        AggiornaPalestra(hDlg);
        for (let i = 0; i < 4; i++) SetDlgItemText(hDlg, 120 + i, MostraSoldi(PalestraMem[i].prezzo));

        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 110: // Vai in palestra
                if (T.scad_pal_giorno < 1) {
                    await MessageBox(hDlg, 'Prima di poter venire in palestra devi fare un abbonamento !',
                        'Palestra', MB_OK | MB_ICONINFORMATION);
                } else {
                    if (T.sound_active) TabbozPlaySound(201);
                    if (T.Fama < 82) T.Fama++;
                    await EventiPalestra(hDlg);
                    AggiornaPalestra(hDlg);
                    /* Evento(hDlg); */
                }
                return TRUE;

            case 111: { // Lampada
                if (PalestraMem[3].prezzo > T.Soldi) {
                    await nomoney(hDlg, PALESTRA);
                } else {
                    if (T.current_testa < 3) {
                        T.current_testa++; // Grado di abbronzatura
                        if (T.Fama < 20) T.Fama++; // Da 0 a 3 punti in piu' di fama
                        if (T.Fama < 45) T.Fama++; // ( secondo quanta se ne ha gia')
                        if (T.Fama < 96) T.Fama++;
                    } else {
                        T.current_testa = 4; // Carbonizzato...
                        if (T.Fama > 8) T.Fama -= 8;
                        if (T.Reputazione > 5) T.Reputazione -= 5;
                        await MessageBox(hDlg,
                            "L' eccessiva esposizione del tuo corpo ai raggi ultravioletti, provoca un avanzato grado di carbonizzazione e pure qualche piccola mutazione genetica...",
                            'Lampada', MB_OK | MB_ICONSTOP);
                    }
                    T.TabbozRedraw = 1; // E' necessario ridisegnare l' immagine del Tabbozzo...

                    if (T.sound_active) TabbozPlaySound(202);
                    T.Soldi -= PalestraMem[3].prezzo;
                }
                const i = random(5 + T.Fortuna);
                if (i === 0) await Evento(hDlg);
                AggiornaPalestra(hDlg);
                return TRUE;
            }

            case 115: // Abbonamenti
            case 116:
            case 117:
                if (T.scad_pal_giorno > 0) {
                    await MessageBox(hDlg, "Hai gia' un abbonamento, perche' te ne serve un altro ???",
                        'Palestra', MB_OK | MB_ICONINFORMATION);
                    return TRUE;
                }

                if (PalestraMem[LOWORD(wParam) - 115].prezzo > T.Soldi) {
                    await nomoney(hDlg, PALESTRA);
                    return TRUE;
                }
                T.Soldi -= PalestraMem[LOWORD(wParam) - 115].prezzo;

                switch (LOWORD(wParam)) {
                    case 115:
                        T.scad_pal_mese = T.x_mese + 1; // UN MESE
                        T.scad_pal_giorno = T.x_giorno;
                        if (T.scad_pal_mese > 12) T.scad_pal_mese -= 12;
                        // Quello che segue evita che la palestra scada un giorno tipo il 31 Febbraio
                        if (T.scad_pal_giorno > InfoMese[T.scad_pal_mese - 1].num_giorni) {
                            T.scad_pal_giorno = InfoMese[T.scad_pal_mese - 1].num_giorni;
                        }
                        break;

                    case 116:
                        T.scad_pal_mese = T.x_mese + 6; // SEI MESI
                        T.scad_pal_giorno = T.x_giorno;
                        if (T.scad_pal_mese > 12) T.scad_pal_mese -= 12;
                        // Quello che segue evita che la palestra scada un giorno tipo il 31 Febbraio
                        if (T.scad_pal_giorno > InfoMese[T.scad_pal_mese - 1].num_giorni) {
                            T.scad_pal_giorno = InfoMese[T.scad_pal_mese - 1].num_giorni;
                        }
                        break;

                    case 117:
                        T.scad_pal_mese = T.x_mese; // UN ANNO ( meno un giorno...)
                        T.scad_pal_giorno = T.x_giorno - 1;
                        if (T.scad_pal_giorno < 1) {
                            T.scad_pal_mese--;
                            if (T.scad_pal_mese < 1) T.scad_pal_mese += 12;
                            T.scad_pal_giorno = InfoMese[T.scad_pal_mese - 1].num_giorni;
                        }
                        break;
                }

                await Evento(hDlg);
                AggiornaPalestra(hDlg);
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

export async function RunTabacchi(hDlg) {
    if (T.x_vacanza !== 2) {
        // 19 Mar 98 - Tabaccaio
        await DialogBox(hInst, TABACCAIO, hDlg, Tabaccaio);
    } else {
        await MessageBox(hDlg, 'Rimani fisso a guardare la saracinesca del tabaccaio inrimediabilmente chiusa...',
            'Bar Tabacchi', MB_OK | MB_ICONINFORMATION);
    }
}

export async function RunPalestra(hDlg) {
    if (T.x_vacanza !== 2) {
        // 20 Mar 98 - Palestra
        await DialogBox(hInst, PALESTRA, hDlg, Palestra);
    } else {
        await MessageBox(hDlg, "Il tuo fisico da atleta dovra' aspettare... visto che oggi la palestra e' chiusa...",
            'Palestra', MB_OK | MB_ICONINFORMATION);
    }
}

export async function RunVestiti(hDlg, numero) {
    // Versione femminile di "Bau House" e "Blue Rider"
    if (numero === 80 && T.sesso === 'F') numero = 85;
    if (numero === 84 && T.sesso === 'F') numero = 86;

    if (T.x_vacanza !== 2) {
        // 26 Feb 98... finalmente i negozi sono chiusi durante le vacanze...
        if (T.sound_active) {
            if (numero < 82) TabbozPlaySound(204);
            else TabbozPlaySound(205);
        }

        await DialogBox(hInst, numero, hDlg, CompraQualcosa); // La funzione e' uguale x tutti...
    } else {
        await MessageBox(hDlg, `Oh, tip${T.ao}... i negozi sono chiusi di festa...`,
            'Vestiti', MB_OK | MB_ICONINFORMATION);
    }
}

/********************************************************************/
/* EVENTI PALESTRA - 14 Luglio 1998                                 */
/********************************************************************/

export async function EventiPalestra(hInstance) {
    const i = random(29 + Math.trunc(T.Fortuna / 2));

    if (i > 9) return; /* eventi: 0 - 10) */

    const messaggio = LoadString(hInst, 1100 + i);

    await MessageBox(hInstance, messaggio, 'Palestra...', MB_OK | MB_ICONSTOP);

    if (T.Reputazione > 10) T.Reputazione -= 4;
}

// Tabboz Simulator
// Copyright (c) 1997-2000 Andrea Bonomi
//
// Port of scooter.c. Released under the GNU General Public License v3 or later.

import {
    DialogBox, EndDialog, IDCANCEL, IDOK, LOWORD, MB_ICONINFORMATION, MB_ICONQUESTION, MB_ICONSTOP, MB_OK,
    MessageBox, SetDlgItemText, TRUE, FALSE, WM_COMMAND, WM_INITDIALOG, hInst,
} from '../win32.js';
import { ACQUISTASCOOTER, RIPARASCOOTER, SCOOTER, T, VENDISCOOTER, newScooter, random } from '../state.js';
import { TabbozPlaySound } from './readkey.js';
import { MostraSoldi, nomoney } from './zarrosim.js';
import { Evento } from './eventi.js';

/* Il 28 Aprile 1998 la procedura scooter e' cambiata radicalmente... */

const n_carburatore = ['12/10', '16/16', '19/19', '20/20', '24/24', 'custom'];
const n_cc = ['50cc', '70cc', '90cc', '120cc', '150cc', '3969cc'];
const n_marmitta = ['standard', 'silenziosa', 'rumorosa', 'rumorosissima'];
const n_filtro = ['standard', 'P1', 'P2', 'P2+', 'Extreme'];

export const n_attivita = ['mancante', 'funzionante', 'ingrippato', 'invasato', 'parcheggiato', 'sequestrato', 'a secco'];

const tabella = [
    65, 70, -100, -100, -100, -100,
    70, 80, 95, -100, -100, -100,
    -1000, 90, 100, 115, -100, -100,
    -1000, -1000, 110, 125, 135, -100,
    -1000, -1000, -1000, 130, 150, -100,
    -1000, -1000, -1000, -1000, -1000, 250,
];

export const ScooterMem = [
    newScooter(0, 0, 0, 0, 0, 0, 0, -1, 'Nessuno scooter', 0),
    newScooter(65, 0, 0, 0, 0, 2498, 1, 100, 'Magutty Firecow', 5),
    newScooter(75, 0, 1, 1, 1, 4348, 1, 100, 'Honda F98', 10),
    newScooter(105, 1, 1, 2, 1, 6498, 1, 100, 'Mizzubisci R200 Millenium', 15),

    newScooter(75, 0, 0, 1, 1, 4298, 1, 100, 'Magutty Firecow+', 7),
    newScooter(100, 0, 1, 2, 1, 5998, 1, 100, 'Magutty Firecow II', 10),
    newScooter(100, 0, 1, 2, 1, 6348, 1, 100, 'Honda F98s', 13),

    newScooter(250, 0, 5, 5, 0, 1450, 1, 100, 'Lexux LS400 ', 60),
];

const PezziMem = [
    400, 500, 600, /* marmitte    */
    300, 470, 650, 800, /* carburatori */
    200, 400, 800, 1000, /* cc          */
    50, 120, 270, 400, /* filtro      */
];

// ******************************************************************
// Calcola la velocita' massima dello scooter, sencodo il tipo di marmitta,
// carburatore, etc...

export async function CalcolaVelocita(hDlg) {
    /* 28 Novembre 1998 0.81pr Bug ! Se lo scooter era ingrippato, cambiando il filtro
    dell' aria o la marmitta la velocita' diventava un numero negativo... */

    const sd = T.ScooterData;
    sd.speed = sd.marmitta * 5 + sd.filtro * 5 + tabella[sd.cc + sd.carburatore * 6];

    sd.attivita = 1; /* Sano...    */

    /* 26 Novembre 1998 0.81pr  Arggg!!! Un bug !!! */
    /* Se lo scooter sta' per essere comprato, non fa' questi noiosi check... */

    if (!T.showscooter) {
        if (sd.speed <= -500) sd.attivita = 3; /* Invasato   */
        else if (sd.speed <= -1) sd.attivita = 2; /* Ingrippato */

        if (T.benzina < 1) sd.attivita = 6; /* A secco    */

        if (sd.attivita !== 1) {
            await MessageBox(hDlg, `Il tuo scooter e' ${n_attivita[sd.attivita]}.`, 'Attenzione', MB_OK | MB_ICONINFORMATION);
        }
    }
}

/********************************************************************/
/* Scooter...                                                       */
/********************************************************************/

export async function Scooter(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));

        SetDlgItemText(hDlg, 105, 'Parcheggia scooter'); /* 7 Maggio 1998 */

        if (T.ScooterData.stato !== -1) {
            AggiornaScooter(hDlg);
            if (T.ScooterData.attivita === 4) SetDlgItemText(hDlg, 105, 'Usa scooter');
        }

        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 101:
                if (T.x_vacanza === 2) {
                    await MessageBox(hDlg, `Oh, tip${T.ao}... oggi il concessionario e' chiuso...`,
                        'Concessionario', MB_OK | MB_ICONINFORMATION);
                    return TRUE;
                }

                await DialogBox(hInst, ACQUISTASCOOTER, hDlg, Concessionario);
                await Evento(hDlg);
                AggiornaScooter(hDlg);
                return TRUE;

            case 102: /* Trucca */
                if (T.ScooterData.stato !== -1) {
                    if (T.x_vacanza !== 2) {
                        /* 28 Aprile 1998 La procedura per truccare gli scooter cambia completamente... */
                        await DialogBox(hInst, 73, hDlg, TruccaScooter);
                        await Evento(hDlg);
                        AggiornaScooter(hDlg);
                        return TRUE;
                    } else {
                        await MessageBox(hDlg, `Oh, tip${T.ao}... oggi il meccanico e' chiuso...`,
                            'Trucca lo scooter', MB_OK | MB_ICONINFORMATION);
                    }
                } else {
                    await MessageBox(hDlg,
                        'Scusa, ma quale scooter avresti intenzione di truccare visto che non ne hai neanche uno ???',
                        'Trucca lo scooter', MB_OK | MB_ICONQUESTION);
                }

                SetDlgItemText(hDlg, 105, 'Parcheggia scooter'); /* 7 Maggio 1998 */

                if (T.ScooterData.attivita === 4) SetDlgItemText(hDlg, 105, 'Usa scooter');

                await Evento(hDlg);
                return TRUE;

            case 103: /* Ripara */
                if (T.ScooterData.stato !== -1) {
                    if (T.ScooterData.stato === 100) {
                        await MessageBox(hDlg,
                            "Che motivi hai per voleer riparare il tuo scooter\nvisto che e' al 100% di efficienza ???",
                            'Ripara lo scooter', MB_OK | MB_ICONQUESTION);
                    } else {
                        if (T.x_vacanza !== 2) {
                            await DialogBox(hInst, RIPARASCOOTER, hDlg, RiparaScooter);
                            AggiornaScooter(hDlg);
                        } else {
                            await MessageBox(hDlg, `Oh, tip${T.ao}... oggi il meccanico e' chiuso...`,
                                'Ripara lo scooter', MB_OK | MB_ICONINFORMATION);
                        }
                    }
                    return TRUE;
                } else {
                    await MessageBox(hDlg, 'Mi spieghi come fai a farti riparare lo scooter se non lo hai ???',
                        'Ripara lo scooter', MB_OK | MB_ICONQUESTION);
                }
                await Evento(hDlg);
                return TRUE;

            case 105: /* Parcheggia / Usa Scooter	7 Maggio 1998 */
                if (T.ScooterData.stato < 0) {
                    await MessageBox(hDlg, 'Mi spieghi come fai a parcheggiare lo scooter se non lo hai ???',
                        'Parcheggia lo scooter', MB_OK | MB_ICONQUESTION);
                    return TRUE;
                }

                switch (T.ScooterData.attivita) {
                    case 1:
                        T.ScooterData.attivita = 4;
                        SetDlgItemText(hDlg, 105, 'Usa scooter');
                        break;
                    case 4:
                        T.ScooterData.attivita = 1;
                        SetDlgItemText(hDlg, 105, 'Parcheggia scooter');
                        break;
                    default:
                        await MessageBox(hDlg,
                            `Mi spieghi come fai a parcheggiare lo scooter visto che e' ${n_attivita[T.ScooterData.attivita]} ???`,
                            'Parcheggia lo scooter', MB_OK | MB_ICONQUESTION);
                }

                AggiornaScooter(hDlg);
                return TRUE;

            case 106: /* Fai Benzina	8 Maggio 1998 */
                if (T.ScooterData.stato < 0) {
                    await MessageBox(hDlg, 'Mi spieghi come fai a far benzina allo scooter se non lo hai ???',
                        'Fai benza', MB_OK | MB_ICONQUESTION);
                    return TRUE;
                }

                switch (T.ScooterData.attivita) {
                    case 1:
                    case 2:
                    case 3:
                    case 6:
                        if (T.Soldi < 10) {
                            await MessageBox(hDlg,
                                `Al distributore automatico puoi fare un minimo di ${MostraSoldi(10)} di benzina...`,
                                'Fai benza', MB_OK | MB_ICONQUESTION);
                            break;
                        }

                        T.Soldi -= 10;

                        T.benzina = 50; /* 5 litri, il massimo che puo' contenere... */

                        if (T.ScooterData.cc === 5) T.benzina = 850; /* 85 litri, x la macchinina un po' figa... */
                        T.showscooter = 0;
                        await CalcolaVelocita(hDlg);

                        await MessageBox(hDlg, `Fai ${MostraSoldi(10)} di benzina e riempi lo scooter...`,
                            'Fai benza', MB_OK | MB_ICONINFORMATION);
                        break;

                    default:
                        await MessageBox(hDlg,
                            `Mi spieghi come fai a far benzina allo scooter visto che e' ${n_attivita[T.ScooterData.attivita]} ???`,
                            'Fai benza', MB_OK | MB_ICONQUESTION);
                }

                AggiornaScooter(hDlg);
                await Evento(hDlg);
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

/********************************************************************/
/* Acquista Scooter                                                 */
/********************************************************************/

let ScooterTemp = null;

export async function AcquistaScooter(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        T.scelta = -1;
        ScooterTemp = { ...T.ScooterData };
        SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 121:
            case 122:
            case 123:
            case 124:
            case 125:
            case 126: {
                const num_moto = LOWORD(wParam) - 120;
                T.scelta = num_moto;
                T.ScooterData = { ...ScooterMem[num_moto] };
                T.showscooter = 1;
                await CalcolaVelocita(hDlg);
                T.showscooter = 0;

                AggiornaScooter(hDlg);
                T.ScooterData = { ...ScooterMem[0] };
                return TRUE;
            }

            case IDCANCEL:
                T.scelta = -1;
                T.ScooterData = { ...ScooterTemp };
                EndDialog(hDlg, TRUE);
                return TRUE;

            case IDOK:
                T.ScooterData = { ...ScooterTemp };
                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

/********************************************************************/
/* Vendi Scooter                                                    */
/********************************************************************/

let offerta = 0; /* importante lo static !!! */

export async function VendiScooter(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        const quot = Math.trunc(T.ScooterData.prezzo / 100);
        if (T.ScooterData.attivita === 1 || T.ScooterData.attivita === 4) {
            /* 0.8.1pr 28 Novembre 1998 - Se lo scooter e' sputtanato, vale meno... */
            offerta = quot * (T.ScooterData.stato - 10 - random(10));
        } else {
            offerta = quot * (T.ScooterData.stato - 50 - random(10));
        }

        if (offerta < 50) offerta = 50; /* se vale meno di 50.000 nessuno lo vuole... */
        /* 0.8.1pr 28 Novembre 1998 - se vale meno di 50.000, viene pagato 50.000      */

        AggiornaScooter(hDlg);

        SetDlgItemText(hDlg, 118, MostraSoldi(offerta));
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case IDCANCEL:
                EndDialog(hDlg, TRUE);
                return TRUE;

            case IDOK:
                T.ScooterData = { ...ScooterMem[0] }; /* nessuno scooter			*/
                T.benzina = 0; /* serbatoio vuoto	7 Maggio 1998	*/
                T.ScooterData.stato = -1;

                T.Soldi = T.Soldi + offerta;

                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

/********************************************************************/
/* Ripara Scooter                                                   */
/********************************************************************/

let costo = 0; // Importante lo static !!!

export async function RiparaScooter(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        // Calcola il costo della riparazione dello scooter...
        costo = Math.trunc(T.ScooterData.prezzo / 100) * (100 - T.ScooterData.stato) + 10;

        SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));
        SetDlgItemText(hDlg, 105, MostraSoldi(costo));

        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case IDCANCEL:
                EndDialog(hDlg, TRUE);
                return TRUE;

            case IDOK:
                if (costo > T.Soldi) {
                    await nomoney(hDlg, SCOOTER);
                } else {
                    // Per questa cagata, crascia il tabboz all' uscita...
                    //					if (sound_active) TabbozPlaySound(102);

                    T.ScooterData.stato = 100;
                    T.Soldi -= costo;
                    await CalcolaVelocita(hDlg);
                }
                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

/********************************************************************/
/* Trucca Scooter                                                   */
/* 28 Aprile 1998 La procedura per truccare gli scooter cambia completamente... */
/********************************************************************/

export async function TruccaScooter(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        if (T.sound_active) TabbozPlaySound(101);
        AggiornaScooter(hDlg);
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 121:
            case 122:
            case 123:
            case 124:
                await DialogBox(hInst, LOWORD(wParam) - 121 + 74, hDlg, CompraUnPezzo);
                /* CalcolaVelocita(hDlg); */
                AggiornaScooter(hDlg);
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

export function AggiornaScooter(hDlg) {
    SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));

    const sd = T.ScooterData;
    if (sd.stato !== -1) {
        SetDlgItemText(hDlg, 116, sd.nome);
        SetDlgItemText(hDlg, 107, `${Math.trunc(T.benzina / 10)}.${T.benzina % 10}l`);

        SetDlgItemText(hDlg, 110, MostraSpeed());
        SetDlgItemText(hDlg, 111, n_marmitta[sd.marmitta]);
        SetDlgItemText(hDlg, 112, n_carburatore[sd.carburatore]);
        SetDlgItemText(hDlg, 113, n_cc[sd.cc]);
        SetDlgItemText(hDlg, 114, n_filtro[sd.filtro]);
        SetDlgItemText(hDlg, 115, `${sd.stato}%`);

        SetDlgItemText(hDlg, 117, MostraSoldi(sd.prezzo));
    } else {
        for (const id of [107, 110, 111, 112, 113, 114, 115, 116, 117]) SetDlgItemText(hDlg, id, '');
    }
}

// -----------------------------------------------------------------------
// Routine di acquisto generika di un pezzo di motorino
// -----------------------------------------------------------------------

async function CompraPezzo(hDlg, id) {
    if (T.Soldi < PezziMem[id - 130]) {
        await nomoney(hDlg, SCOOTER);
        return false;
    }
    T.Soldi -= PezziMem[id - 130];
    return true;
}

export async function CompraUnPezzo(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        SetDlgItemText(hDlg, 109, T.ScooterData.nome);
        SetDlgItemText(hDlg, 105, n_carburatore[T.ScooterData.carburatore]);
        SetDlgItemText(hDlg, 106, n_marmitta[T.ScooterData.marmitta]);
        SetDlgItemText(hDlg, 107, n_cc[T.ScooterData.cc]);
        SetDlgItemText(hDlg, 108, n_filtro[T.ScooterData.filtro]);

        SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));

        for (let i = 110; i < 125; i++) SetDlgItemText(hDlg, i, MostraSoldi(PezziMem[i - 110]));

        return TRUE;
    } else if (message === WM_COMMAND) {
        const id = LOWORD(wParam);
        switch (id) {
            case 130: /* marmitte ----------------------------------------------------------- */
            case 131:
            case 132:
                if (!(await CompraPezzo(hDlg, id))) return TRUE;
                T.ScooterData.marmitta = id - 129; /* (1 - 3 ) */
                T.showscooter = 0;
                await CalcolaVelocita(hDlg);
                EndDialog(hDlg, TRUE);
                return TRUE;

            case 133: /* carburatore -------------------------------------------------------- */
            case 134:
            case 135:
            case 136:
                if (!(await CompraPezzo(hDlg, id))) return TRUE;
                T.ScooterData.carburatore = id - 132; /* ( 1 - 4 ) */
                T.showscooter = 0;
                await CalcolaVelocita(hDlg);
                EndDialog(hDlg, TRUE);
                return TRUE;

            case 137: /* cc ----------------------------------------------------------------- */
            case 138:
            case 139:
            case 140:
                if (!(await CompraPezzo(hDlg, id))) return TRUE;
                /* Piccolo bug della versione 0.6.91, qui c'era scritto ScooterData.marmitta */
                /* al posto di ScooterData.cc :-) */
                T.ScooterData.cc = id - 136; /* ( 1 - 4 ) */
                T.showscooter = 0;
                await CalcolaVelocita(hDlg);
                EndDialog(hDlg, TRUE);
                return TRUE;

            case 141: /* filtro dell' aria -------------------------------------------------- */
            case 142:
            case 143:
            case 144:
                if (!(await CompraPezzo(hDlg, id))) return TRUE;
                T.ScooterData.filtro = id - 140; /* (1 - 4) */
                T.showscooter = 0;
                await CalcolaVelocita(hDlg);
                EndDialog(hDlg, TRUE);
                return TRUE;

            case IDOK:
            case IDCANCEL:
                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

// -----------------------------------------------------------------------

export function MostraSpeed() {
    switch (T.ScooterData.attivita) {
        case 1:
            return `${T.ScooterData.speed}Km/h`;
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
            return `(${n_attivita[T.ScooterData.attivita]})`;
        default:
            return '';
    }
}

// -----------------------------------------------------------------------
// Concessionario...  7 Maggio 1998
// -----------------------------------------------------------------------

export async function Concessionario(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 101: /* Compra Scooter Malagutty	  */
            case 102: /* Compra Scooter di altre marche */
                T.scelta = -1;
                await DialogBox(hInst, LOWORD(wParam) - 101 + 78, hDlg, AcquistaScooter);
                if (T.scelta !== -1) {
                    if (T.ScooterData.stato !== -1) {
                        await MessageBox(hDlg,
                            `Per il tuo vecchio scooter da rottamare ti diamo ${MostraSoldi(1000)} di supervalutazione...`,
                            'Incentivi', MB_OK | MB_ICONINFORMATION);
                        T.Soldi += 1000;

                        T.ScooterData = { ...ScooterMem[0] }; /* nessuno scooter			*/
                        T.benzina = 0; /* serbatoio vuoto	7 Maggio 1998	*/
                        T.ScooterData.stato = -1;
                    }
                    if (ScooterMem[T.scelta].prezzo > T.Soldi) {
                        await MessageBox(hDlg,
                            'Ti piacerebbe comprare lo scooter, vero ?\nPurtroppo, non hai abbastanza soldi...',
                            'Non hai abbastanza soldi', MB_OK | MB_ICONSTOP);
                        if (T.Reputazione > 3) T.Reputazione -= 1;
                    } else {
                        T.Soldi -= ScooterMem[T.scelta].prezzo;

                        T.ScooterData = { ...ScooterMem[T.scelta] };
                        T.benzina = 20;
                        await MessageBox(hDlg, 'Fai un giro del quartiere per farti vedere con lo scooter nuovo...',
                            'Lo scooter nuovo', MB_OK | MB_ICONINFORMATION);
                        T.Reputazione += 4;
                        if (T.Reputazione > 100) T.Reputazione = 100;
                    }
                    await Evento(hDlg);
                }
                SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));
                return TRUE;

            case 103:
                if (T.ScooterData.stato !== -1) {
                    await DialogBox(hInst, VENDISCOOTER, hDlg, VendiScooter);
                } else {
                    await MessageBox(hDlg,
                        'Scusa, ma quale scooter avresti intenzione di vendere visto che non ne hai neanche uno ???',
                        'Vendi lo scooter', MB_OK | MB_ICONQUESTION);
                }

                SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));
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

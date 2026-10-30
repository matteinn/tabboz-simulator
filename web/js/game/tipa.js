// Tabboz Simulator
// Copyright (c) 1997-2000 Andrea Bonomi
//
// Port of tipa.c. Released under the GNU General Public License v3 or later.

import {
    DialogBox, EndDialog, GetDlgItem, IDCANCEL, IDOK, IDYES, InvalidateRect, LOWORD, LoadString,
    MB_ICONINFORMATION, MB_ICONQUESTION, MB_ICONSTOP, MB_OK, MB_YESNO, MessageBox, SetDlgItemText, TRUE,
    FALSE, WM_COMMAND, WM_INITDIALOG, hInst,
} from '../win32.js';
import { CERCATIPA, T, random } from '../state.js';
import { TabbozPlaySound } from './readkey.js';
import { Evento } from './eventi.js';
import { CalcolaVelocita, n_attivita } from './scooter.js';

let spostamento = 0;
let descrizione = '';
let iCercaTipa = 0; // static int i di CercaTipa
let iDueDiPicche = 0; // static int i di DueDiPicche

// figTemp, nomeTemp e tipahDlg (serve per BMPTipaWndProc in tabimg.js) sono su T.

// ------------------------------------------------------------------------------------------
// Tipa...
// ------------------------------------------------------------------------------------------

export async function Tipa(hDlg, message, wParam) {
    switch (message) {
        case WM_INITDIALOG:
            if (T.sesso === 'M') spostamento = 0;
            else spostamento = 100;
            AggiornaTipa(hDlg);
            T.tipahDlg = hDlg;
            return TRUE;

        case WM_COMMAND:
            switch (LOWORD(wParam)) {
                case 110: // Cerca tipa
                    await DialogBox(hInst, CERCATIPA + spostamento, hDlg, CercaTipa);
                    AggiornaTipa(hDlg);
                    return TRUE;

                case 111: { // Lascia tipa
                    if (T.Rapporti <= 0) {
                        if (T.sesso === 'M') {
                            await MessageBox(hDlg, "Scusa, che ragazza avresti intenzione di lasciare ???",
                                'Lascia Tipa', MB_OK | MB_ICONINFORMATION);
                        } else {
                            await MessageBox(hDlg,
                                'Scusa, che tipo avresti intenzione di lasciare, visto che sei sola come un cane ???',
                                'Lascia Tipo', MB_OK | MB_ICONINFORMATION);
                        }
                        return TRUE;
                    }

                    const tmp = `Sei proprio sicuro di voler lasciare ${T.Nometipa} ?`;

                    let lasciaoraddoppia;
                    if (T.sesso === 'M') {
                        lasciaoraddoppia = await MessageBox(hDlg, tmp, 'Lascia tipa', MB_YESNO | MB_ICONQUESTION);
                    } else {
                        lasciaoraddoppia = await MessageBox(hDlg, tmp, 'Molla tipo', MB_YESNO | MB_ICONQUESTION);
                    }

                    if (lasciaoraddoppia === IDYES) {
                        if (T.sound_active) TabbozPlaySound(603);
                        T.Rapporti = 0;

                        if (T.FigTipa >= 79 && T.sesso === 'M') {
                            await MessageBox(hDlg,
                                "Appena vengono a sapere quello che hai fatto, i tuoi amici ti prendono a scarpate.\nQualcuno, piu' furbo di te, va a consolarla...",
                                'Idiota...', MB_OK | MB_ICONINFORMATION);
                            T.Reputazione -= 8;
                            if (T.Reputazione < 0) T.Reputazione = 0;
                        }

                        if (T.FigTipa <= 40 && T.sesso === 'M') {
                            T.Reputazione += 4;
                            if (T.Reputazione > 100) T.Reputazione = 100;
                        }

                        await Evento(hDlg);
                    }
                    AggiornaTipa(hDlg);
                    return TRUE;
                }

                case 112:
                    if (T.Rapporti <= 0) {
                        if (T.sesso === 'M') {
                            await MessageBox(hDlg, 'Scusa, che ragazza vorresti chiamare ???',
                                'Non sei molto intelligente...', MB_OK | MB_ICONINFORMATION);
                        } else {
                            await MessageBox(hDlg, 'Scusa, che ragazzo vorresti chiamare, visto che sei sola ???',
                                'Non sei molto intelligente...', MB_OK | MB_ICONINFORMATION);
                        }
                        return TRUE;
                    }

                    if (T.Soldi <= 5 && T.AbbonamentData.creditorest < 2 && T.CellularData.stato < 0) {
                        await MessageBox(hDlg,
                            'Sei fai ancora una telefonata, ti spezzo le gambe, disse tuo padre con un accetta in mano...',
                            'Non toccare quel telefono...', MB_OK | MB_ICONSTOP);
                    } else {
                        if (T.sound_active) TabbozPlaySound(602);
                        // 5 Maggio 1999 - Telefono di casa o telefonino ???

                        if (T.AbbonamentData.creditorest >= 2 && T.CellularData.stato > -1) {
                            T.AbbonamentData.creditorest -= 2;
                        } else {
                            // Soldi e' un u_long: se hai il telefonino ma meno di 5 soldi,
                            // nel C la sottrazione "gira" e diventi ricchissimo.
                            T.Soldi = (T.Soldi - 5) >>> 0;
                        }

                        if (T.Rapporti <= 60) T.Rapporti++;
                    }
                    AggiornaTipa(hDlg);
                    return TRUE;

                case 113:
                    if (T.Rapporti <= 0) {
                        if (T.sesso === 'M') {
                            await MessageBox(hDlg, 'Scusa, con che tipa vorresti uscire ???',
                                'Non sei molto intelligente...', MB_OK | MB_ICONINFORMATION);
                        } else {
                            await MessageBox(hDlg, 'Scusa, ma con chi vorresti uscire, ???',
                                'Non sei molto intelligente...', MB_OK | MB_ICONINFORMATION);
                        }
                        return TRUE;
                    }

                    if (T.ScooterData.stato <= 0 && T.sesso === 'M') {
                        await MessageBox(hDlg, "Finche' non comprerai lo scooter, non usciremo piu' insieme...",
                            'Compra lo scooter', MB_OK | MB_ICONSTOP);
                        return TRUE;
                    }

                    if (T.ScooterData.attivita !== 1 && T.sesso === 'M') {
                        await MessageBox(hDlg,
                            `Finche' il tuo scooter restera' ${n_attivita[T.ScooterData.attivita]} non potremo uscire insieme...`,
                            'Risistema la scooter', MB_OK | MB_ICONINFORMATION);
                        return TRUE;
                    }

                    if (T.ScooterData.stato <= 35 && T.sesso === 'M') {
                        await MessageBox(hDlg, "Finche' non riparerai lo scooter, non usciremo piu' insieme...",
                            'Ripara lo scooter', MB_OK | MB_ICONSTOP);
                        return TRUE;
                    }

                    if (T.Soldi < 15) {
                        if (T.sesso === 'M') {
                            await MessageBox(hDlg, "Se mi vuoi portare fuori, cerca di avere almeno un po' di soldi...",
                                'Sei povero', MB_OK | MB_ICONSTOP);
                        } else {
                            await MessageBox(hDlg, "Oh tipa... cioe' non posso pagare sempre tutto io, cioe' ohhhh...",
                                'Che palle', MB_OK | MB_ICONSTOP);
                        }
                        return TRUE;
                    }

                    T.Soldi -= 15;

                    T.Rapporti += 5;
                    if (T.Rapporti > 100) T.Rapporti = 100;

                    if (T.FigTipa > T.Fama) T.Fama++;
                    if (T.Fama > 100) T.Fama = 100;

                    T.benzina -= 3;
                    if (T.benzina < 1) T.benzina = 0;
                    await CalcolaVelocita(hDlg);

                    AggiornaTipa(hDlg);
                    return TRUE;

                // (case 130 dell' EM non serve: i clic sull' immagine arrivano gia' a BMPTipaWndProc)

                case IDCANCEL:
                case IDOK:
                    T.tipahDlg = null; // Non si sa' mai...
                    EndDialog(hDlg, TRUE);
                    return TRUE;

                default:
                    return TRUE;
            }
    }

    return FALSE;
}

// ------------------------------------------------------------------------------------------
// Due Donne - 22 Aprile 1999
// ------------------------------------------------------------------------------------------

export async function DueDonne(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        SetDlgItemText(hDlg, 2, `Resto con ${T.Nometipa}`);
        let tmp;
        if (T.Nometipa === T.nomeTemp) {
            // Se le tipe si chiamano tutte e due con lo stesso nome
            if (T.sesso === 'M') tmp = 'Preferisco quella nuova';
            else tmp = 'Preferisco quello nuovo';
        } else {
            tmp = `Preferisco ${T.nomeTemp}`;
        }
        SetDlgItemText(hDlg, 102, tmp);
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 101: { // Ottima scelta...
                let tmp;
                if (T.sesso === 'M') {
                    tmp = `Mentre sei appartato con la ${T.nomeTemp}, arriva la tua ragazza, ${T.Nometipa}, ti tira uno schiaffo e ti lascia.` +
                        `Capendo finalmente di che pasta sei fatto, anche la ${T.nomeTemp} si allontana...`;
                } else {
                    tmp = `${T.Nometipa} viene a sapere che di ${T.nomeTemp}, gli spacca la faccia e ti molla...` +
                        `Dopo questa tragica esperienza anche ${T.nomeTemp} sparisce...`;
                }

                T.Rapporti = 0;
                T.Reputazione -= 8;
                if (T.Reputazione < 0) T.Reputazione = 0;
                T.Fama -= 4;
                if (T.Fama < 0) T.Fama = 0;

                await MessageBox(hDlg, tmp, "La vita e' bella", MB_OK | MB_ICONSTOP);
                EndDialog(hDlg, TRUE);
                return TRUE;
            }

            case 102: // Preferisci quella nuova...
                T.Nometipa = T.nomeTemp;
                T.FigTipa = T.figTemp;
                T.Rapporti = 30 + random(15);
                T.Fama += Math.trunc(T.FigTipa / 10);
                if (T.Fama > 100) T.Fama = 100;
                T.Reputazione += Math.trunc(T.FigTipa / 13);
                if (T.Reputazione > 100) T.Reputazione = 100;
                EndDialog(hDlg, TRUE);
                return TRUE;

            case IDCANCEL: // Resti con la tua vecchia ragazza, bravo...
            default:
                EndDialog(hDlg, TRUE);
                return TRUE;
        }
    }

    return FALSE;
}

// ------------------------------------------------------------------------------------------
// Cerca Tipa
// ------------------------------------------------------------------------------------------

export async function CercaTipa(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        T.figTemp = random(71) + 30; // 30 -> 100

        if (T.sesso === 'M') {
            DescrizioneTipa(T.figTemp);
            iCercaTipa = 200 + random(20); // 200 -> 219 [nomi tipe]
        } else {
            DescrizioneTipo(T.figTemp);
            iCercaTipa = 1200 + random(20); // 1200 -> 1219 [nomi tipi]
        }

        SetDlgItemText(hDlg, 107, descrizione);
        T.nomeTemp = LoadString(hInst, iCercaTipa);

        SetDlgItemText(hDlg, 105, T.nomeTemp);
        SetDlgItemText(hDlg, 106, `${T.figTemp}/100`);

        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case IDCANCEL:
                EndDialog(hDlg, TRUE);
                return TRUE;

            case 101:
                // Calcola se ce la fa o meno con la tipa... ------------------------------------

                if (T.figTemp * 2 + random(50) <= T.Fama + T.Reputazione + random(30)) {
                    // E' andata bene... ----------------------------------------------------

                    if (T.sesso === 'M') {
                        await MessageBox(hDlg,
                            'Con il tuo fascino nascosto da tabbozzo, seduci la tipa e ti ci metti insieme.',
                            "E' andata bene !", MB_OK | MB_ICONINFORMATION);
                    } else {
                        await MessageBox(hDlg, "Ora non ti puoi piu' lamentare di essere sola...",
                            'Qualcono ti caga...', MB_OK | MB_ICONINFORMATION);
                    }

                    // ...ma comunque controlla che tu non abbia gia' una tipa -------------------------
                    if (T.Rapporti > 0) {
                        // hai gia' una tipa..
                        await DialogBox(hInst, 92 + spostamento, hDlg, DueDonne);
                    } else {
                        // bravo, no hai una tipa...
                        T.Nometipa = T.nomeTemp;
                        T.FigTipa = T.figTemp;
                        T.Rapporti = 30 + random(15);
                        T.Fama += Math.trunc(T.FigTipa / 10);
                        if (T.Fama > 100) T.Fama = 100;
                        T.Reputazione += Math.trunc(T.FigTipa / 13);
                        if (T.Reputazione > 100) T.Reputazione = 100;
                    }
                } else {
                    // 2 di picche... -------------------------------------------------------
                    if (T.sound_active) TabbozPlaySound(601);

                    await DialogBox(hInst, 95, hDlg, DueDiPicche);
                }
                await Evento(hDlg);
                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

// ------------------------------------------------------------------------------------------
// Abbina una descrizione(breve) alla figosita' di una tipa.
// ------------------------------------------------------------------------------------------

export function DescrizioneTipa(f) {
    let buf;

    if (f > 97) buf = 'Ultramegafiga';
    else if (f > 90) buf = 'Fighissima';
    else if (f > 83) buf = 'Molto figa';
    else if (f > 72) buf = 'Figa';
    else if (f > 67) buf = 'Abbastanza Figa';
    else if (f > 55) buf = 'Interessante';
    else if (f > 45) buf = 'Passabile';
    else if (f > 35) buf = "Puo' piacere..";
    else buf = "E' un tipo...";

    descrizione = buf;
}

// ------------------------------------------------------------------------------------------
// Abbina una descrizione(breve) alla figosita' di un tipo.
// ------------------------------------------------------------------------------------------

export function DescrizioneTipo(f) {
    let buf;

    if (f > 97) buf = 'Ultramegafigo';
    else if (f > 90) buf = 'Bellissimo';
    else if (f > 83) buf = 'Molto figo';
    else if (f > 72) buf = 'Bello';
    else if (f > 67) buf = 'Abbastanza Figo';
    else if (f > 55) buf = 'Interessante';
    else if (f > 45) buf = 'Passabile';
    else if (f > 35) buf = "Puo' piacere..";
    else buf = 'Inutile...';

    descrizione = buf;
}

// ------------------------------------------------------------------------------------------
// 2 di picche (la vita e' bella...)
// ------------------------------------------------------------------------------------------

export async function DueDiPicche(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        // un giorno fortunato...
        T.DDP++; // log due di picche...
        T.Reputazione -= 2; // decremento reputazione
        if (T.Reputazione < 0) T.Reputazione = 0;

        T.Fama -= 2; // decremento figosita'
        if (T.Fama < 0) T.Fama = 0;

        // IN QUESTA PARTE C'ERA UN BUG CHE FACEVA CRASCIARE IL TABBOZ SIMULATOR...

        if (T.sesso === 'M') iDueDiPicche = 300 + random(20); // 300 -> 319 [sfighe varie]
        else iDueDiPicche = 1300 + random(20); // 300 -> 319 [sfighe varie]

        SetDlgItemText(hDlg, 105, LoadString(hInst, iDueDiPicche));

        iDueDiPicche = 0;

        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 201:
                iDueDiPicche++;
                if (iDueDiPicche > 5) {
                    await MessageBox(hDlg,
                        `Fino ad ora hai preso ${T.DDP} due di picche !\nNon ti preoccupare, capita a tutti di prendere qualche due di picche nella vita ...`,
                        "La vita e' bella...", MB_OK | MB_ICONINFORMATION);
                    iDueDiPicche = 0;
                }
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

// ------------------------------------------------------------------------------------------
// AggiornaTipa
// ------------------------------------------------------------------------------------------

export function AggiornaTipa(hDlg) {
    if (!hDlg) return; // SetDlgItemText su una finestra che non c'e' non fa niente

    if (T.Rapporti === 0) {
        // sic: nel C il secondo SetDlgItemText sovrascrive sempre il primo
        if (T.sesso === 'M') SetDlgItemText(hDlg, 101, 'Cerca Tipa');
        SetDlgItemText(hDlg, 101, 'Cerca Tipo');

        SetDlgItemText(hDlg, 105, '');
        SetDlgItemText(hDlg, 106, '');
        SetDlgItemText(hDlg, 107, '');
    } else {
        if (T.sesso === 'M') SetDlgItemText(hDlg, 101, 'Cerca Nuova Tipa');
        else SetDlgItemText(hDlg, 101, 'Cerca Nuovo Tipo');
        SetDlgItemText(hDlg, 105, T.Nometipa);
        SetDlgItemText(hDlg, 106, `${T.FigTipa}`);
        SetDlgItemText(hDlg, 107, `${T.Rapporti}/100`);
    }
    SetDlgItemText(hDlg, 104, `${T.Fama}/100`);

    // la tipa puo' essere cambiata (vestita da Babbo Natale, al mare...): ridisegnala
    InvalidateRect(GetDlgItem(hDlg, 130));
}

// ------------------------------------------------------------------------------------------
// 4 gennaio 1999
// ------------------------------------------------------------------------------------------

export async function MostraSalutieBaci(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 205:
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

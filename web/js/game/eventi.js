// Tabboz Simulator
// Copyright (c) 1997-2000 Andrea Bonomi
//
// Port of eventi.c: what happens every time a day goes by.
// Released under the GNU General Public License v3 or later.

import {
    DialogBox, EndDialog, IDCANCEL, IDNO, IDOK, IDYES, LOWORD, LoadString, MB_ICONINFORMATION,
    MB_ICONQUESTION, MB_ICONSTOP, MB_OK, MB_YESNO, MessageBox, SetDlgItemText, TRUE, FALSE, WM_COMMAND,
    WM_INITDIALOG, hInst,
} from '../win32.js';
import { T, random } from '../state.js';
import { TabbozPlaySound } from './readkey.js';
import { Giorno } from './tempo.js';
import { CalcolaStudio, MaterieMem } from './scuola.js';
import { ScooterMem } from './scooter.js';
import { DueDonne } from './tipa.js';
import { SalvaTutto } from './zarrosim.js';

/********************************************************************/
/* EVENTI CASUALI...                                                */
/********************************************************************/

export async function Evento(hInstance) {
    let i;
    let messaggio;

    if (T.Fortuna < 0) T.Fortuna = 0; /* Prima che qualcuno bari... */
    if (T.Fortuna > 100) T.Fortuna = 100;

    await Giorno(hInstance);

    if (T.Tempo_trascorso_dal_pestaggio > 0) T.Tempo_trascorso_dal_pestaggio--;

    /* Sigarette -------------------------------------------------------- */
    if (T.sizze > 0) {
        T.sizze--;
        if (T.sizze === 0) {
            await MessageBox(hInstance, 'Apri il tuo pacchetto di sigarette e lo trovi disperatamente vuoto...',
                'Sei senza sigarette !', MB_OK | MB_ICONSTOP);
            if (T.Reputazione > 10) T.Reputazione -= 3;
        } else if (T.sizze < 3) {
            await MessageBox(hInstance, 'Ti accorgi che stai per finire le tue sizze.',
                'Sigarette...', MB_OK | MB_ICONINFORMATION);
        }
    }

    /* Cellulare ----------------------------------------16 Apr 1999----- */

    if (T.AbbonamentData.creditorest > 0 && T.CellularData.stato > -1) {
        T.AbbonamentData.creditorest -= 1;
        if (T.Fama < 55) T.Fama++;
        if (T.AbbonamentData.creditorest === 0) {
            await MessageBox(hInstance,
                'Cerchi di telefonare e ti accorgi di aver finito i soldi a tua disposizione...',
                'Telefonino', MB_OK | MB_ICONSTOP);
        } else if (T.AbbonamentData.creditorest < 3) {
            await MessageBox(hInstance, 'Ti accorgi che stai per finire la ricarica del tuo telefonino.',
                'Telefonino', MB_OK | MB_ICONINFORMATION);
        }
    }

    if (T.CellularData.stato === 1) {
        // Cellulate 'morente'...
        T.CellularData.stato = -1;
        await MessageBox(hInstance,
            'Dopo una vita di duro lavoro, a furia di prendere botte, il tuo cellulare si spacca...',
            'Telefonino', MB_OK | MB_ICONSTOP);
    }

    /* Rapporti Tipa ---------------------------------------------------- */

    if (T.Rapporti > 3) {
        i = random(5) - 3;
        if (i > 0) T.Rapporti--;
    }

    if (T.Rapporti > 0 && T.Rapporti < 98) {
        i = random((T.Rapporti + T.Fortuna + T.Fama) * 3 + 1) + 1;
        if (i < 11) {
            /* da 1 a 10, la donna ti molla... */
            if (T.sound_active) TabbozPlaySound(603);
            T.Rapporti = 0;
            T.FigTipa = 0;

            if (T.sesso === 'M') {
                messaggio = LoadString(hInst, 1040 + i); /* 1041 -> 1050 */
                await MessageBox(hInstance, messaggio, 'La tipa ti molla...', MB_OK | MB_ICONSTOP);
            } else {
                messaggio = LoadString(hInst, 1340 + i);
                await MessageBox(hInstance, messaggio, 'Vieni mollata...', MB_OK | MB_ICONSTOP);
            }

            T.Reputazione -= 11 - i; // quelle con numero piu' basso, sono peggiori...
            if (T.Reputazione < 0) T.Reputazione = 0;
        }
    }

    /* Lavoro ----------------------------------------------------------- */

    if (T.impegno > 3) {
        i = random(7) - 3;
        if (i > 0) T.impegno--;
    }

    if (T.numeroditta > 0) {
        i = random(T.impegno * 2 + T.Fortuna * 3);
        if (i < 2) {
            /* perdi il lavoro */
            T.impegno = 0;
            T.giorni_di_lavoro = 0;
            T.stipendio = 0;
            T.numeroditta = 0;

            if (T.sound_active) TabbozPlaySound(504);

            await MessageBox(hInstance, `Un bel giorno ti svegli e scopri di essere stat${T.ao} licenziat${T.ao}.`,
                'Perdi il lavoro...', MB_OK | MB_ICONSTOP);
        }
    }

    /* Paghetta --------------------------------------------------------- */

    if (T.x_giornoset === 6) {
        /* Il Sabato c'e' la paghetta... */
        if (T.Studio >= 45) {
            T.Soldi += T.Paghetta;

            if (T.Studio >= 80) {
                if (T.sound_active) TabbozPlaySound(1100);
                T.Soldi += T.Paghetta;

                await MessageBox(hInstance, 'Visto che vai bene a scuola, ti diamo il doppio della paghetta...',
                    'Paghetta settimanale', MB_OK | MB_ICONINFORMATION);
            }
        } else {
            if (T.sound_active) TabbozPlaySound(1200);
            T.Soldi += Math.trunc(T.Paghetta / 2);

            await MessageBox(hInstance, "Finche' non andrai bene a scuola, ti daremo solo meta' della paghetta...",
                'Paghetta settimanale', MB_OK | MB_ICONINFORMATION);
        }
    }

    /* Eventi casuali --------------------------------------------------- */
    const caso = random(100 + T.Fortuna * 2);

    if (caso < 51) {
        switch (caso) {
            // -------------- Metalloni e Manovali -------------------------------------

            case 1: case 2: case 3: case 4: case 5:
            case 6: case 7: case 8: case 9: case 10:
                if (T.sesso === 'F') break; // Se sei una tipa non vieni pestata...

                T.Reputazione -= caso;
                if (T.Reputazione < 0) T.Reputazione = 0;

                i = 100 + random(6); /* 100 - 105 */
                await DialogBox(hInst, i, hInstance, MostraMetallone);

                T.Tempo_trascorso_dal_pestaggio = 5;
                break;

            // -------------- Scooter -----------------------------------------------------

            case 11: case 12: case 13: case 14: case 15:
            case 16: case 17: case 18: case 19: case 20:
                if (T.ScooterData.stato !== -1 && T.ScooterData.attivita === 1) {
                    if (T.CellularData.stato > -1) {
                        // A furia di prendere botte, il cellulare si spacca...
                        T.CellularData.stato -= random(8);
                        // 0 = 'morente', -1 = 'morto'
                        if (T.CellularData.stato < 0) T.CellularData.stato = 0;
                    }

                    if (caso < 17) {
                        T.ScooterData.stato -= 35;
                        await DialogBox(hInst, 106, hInstance, MostraMetallone); // Camionista
                    } else {
                        T.ScooterData.stato -= 20;
                        await DialogBox(hInst, 107, hInstance, MostraMetallone); // Muro !
                    }

                    T.Reputazione -= 2;
                    if (T.Reputazione < 0) T.Reputazione = 0;

                    if (T.ScooterData.stato <= 0) {
                        await MessageBox(hInstance,
                            "Quando ti rialzi ti accorgi che il tuo scooter e' ormai ridotto ad un ammasso di rottami.",
                            'Scooter Distrutto', MB_OK | MB_ICONSTOP);
                        T.ScooterData = { ...ScooterMem[0] };
                    }
                }
                break;

            // -------------- Figosita' ----------------------------------------------------

            case 21: // + gravi
            case 22:
            case 23:
            case 24:
            case 25:
            case 26:
            case 27:
            case 28:
            case 29: // - gravi
            case 30:
                // nel C i case cadono uno nell'altro: i piu' gravi tolgono piu' figosita'
                if (caso <= 23) T.Fama -= 5;
                if (caso <= 25) T.Fama -= 1;
                if (caso <= 27) T.Fama -= 1;
                messaggio = LoadString(hInst, 1000 + caso);
                await MessageBox(hInstance, messaggio, `Sei fortunat${T.ao}...`, MB_OK | MB_ICONSTOP);
                T.Fama -= 2;
                if (T.Fama < 0) T.Fama = 0;
                break;

            // -------------- Skuola ----------------------------------------------------------

            case 31: case 32: case 33: case 34: case 35:
            case 36: case 37: case 38: case 39: case 40:
                // Durante i giorni di vacanza non ci sono eventi riguardanti la scuola
                if (T.x_vacanza === 0) {
                    i = random(9) + 1;
                    messaggio = LoadString(hInst, 1000 + caso) + MaterieMem[i].nome;
                    await MessageBox(hInstance, messaggio, 'Scuola...', MB_OK | MB_ICONSTOP);

                    if (MaterieMem[i].xxx >= 2) MaterieMem[i].xxx -= 2;
                    CalcolaStudio();
                    T.ScuolaRedraw = 1; /* E' necessario ridisegnare la finestra della scuola... */
                }
                break;

            // -------------- Tipa/o ------------------------------------------------------------

            case 41:
            case 42: {
                // Una tipa/o ci prova... 7 Maggio 1999
                if (T.Fama < 35) break; // Figosita' < 35 = nessuna speranza...

                T.figTemp = random(T.Fama - 30) + 30; // Figosita' minima tipa = 30...

                let tmp;
                if (T.sesso === 'M') {
                    T.nomeTemp = LoadString(hInst, 200 + random(20)); // 200 -> 219 [nomi tipe]
                    tmp = `Una tipa, di nome ${T.nomeTemp} (Figosita' ${T.figTemp}/100), ci prova con te'...\nCi stai ???`;
                } else {
                    T.nomeTemp = LoadString(hInst, 1200 + random(20)); // [nomi tipi]
                    tmp = `Una tipo, di nome ${T.nomeTemp} (Figosita' ${T.figTemp}/100), ci prova con te'...\nCi stai ???`;
                }

                if ((await MessageBox(hInstance, tmp, 'Qualcuno ti caga...', MB_YESNO)) === IDNO) {
                    if (T.figTemp >= 79 && T.Rapporti < 1 && T.sesso === 'M') {
                        // Se non hai gia' una tipa e rifiuti una figona...
                        await MessageBox(hInstance,
                            'Appena vengono a sapere che non ti vuoi mettere insieme ad una figona come quella, i tuoi amici ti prendono a scarpate.',
                            'Idiota...', MB_OK | MB_ICONSTOP);
                        T.Reputazione -= 4;
                        if (T.Reputazione < 0) T.Reputazione = 0;
                    }
                    break;
                }

                // Controlla che tu non abbia gia' una tipa -------------------------
                if (T.Rapporti > 0) {
                    // hai gia' una tipa..
                    await DialogBox(hInst, T.sesso === 'M' ? 92 : 192, hInstance, DueDonne);
                } else {
                    // bravo, no hai una tipa...
                    T.Nometipa = T.nomeTemp;
                    T.FigTipa = T.figTemp;
                    T.Rapporti = 45 + random(15);
                    T.Fama += Math.trunc(T.FigTipa / 10);
                    if (T.Fama > 100) T.Fama = 100;
                    T.Reputazione += Math.trunc(T.FigTipa / 13);
                    if (T.Reputazione > 100) T.Reputazione = 100;
                }
                break;
            }

            case 43: // Domande inutili... 11 Giugno 1999
            case 44:
                if (T.Rapporti > 0 && T.sesso === 'M') {
                    if (caso === 43) {
                        i = await MessageBox(hInstance, 'Mi ami ???', 'Domande inutili della Tipa...',
                            MB_YESNO | MB_ICONQUESTION);
                        if (i !== IDYES) {
                            await MessageBox(hInstance,
                                "Sei sempre il solito stronzo.. non capisco perche' resto ancora con uno come cosi'...",
                                'Risposta sbagliata...', MB_OK | MB_ICONSTOP);
                            T.Rapporti -= 45;
                            if (T.Rapporti < 5) T.Rapporti = 5;
                        }
                    } else {
                        i = await MessageBox(hInstance, 'Ma sono ingrassata ???', 'Domande inutili della Tipa...',
                            MB_YESNO | MB_ICONQUESTION);
                        if (i !== IDNO) {
                            await MessageBox(hInstance, 'Sei un bastardo, non capisci mai i miei problemi...',
                                'Risposta sbagliata...', MB_OK | MB_ICONSTOP);
                            T.Rapporti -= 20;
                            if (T.Rapporti < 5) T.Rapporti = 5;
                        }
                    }
                }
                break;

            case 45:
            case 46:
            case 47:
            case 48:
                // Evento riguardante la tipa/o (da fare...)
                break;

            // -------------- Vari ed eventuali ---------------------------------------------

            case 49:
            case 50:
                if (T.CellularData.stato > -1) {
                    T.CellularData.stato -= random(8);
                    // 0 = 'morente', -1 = 'morto'
                    if (T.CellularData.stato < 0) T.CellularData.stato = 0;
                    await MessageBox(hInstance, 'Il telefonino di cade di tasca e vola per terra...',
                        'Telefonino', MB_OK | MB_ICONSTOP);
                }
                break;

            default:
        }
    }

    SalvaTutto();
}

//
//	MOSTRA METALLONE, non e' solo per i metalloni, e' molto utile anche per mostrare
//	tutte quelle finestre in cui non c'e' altro di particolare se non il pulsante di
//	[OK] ed un nome casuale di [VIA]...
//

export async function MostraMetallone(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        const tmp = LoadString(hInst, 450 + random(50));

        /* 15 giugno 1998 - La prima lettera viene scritta minuscola (appare "via..." al posto di "Via..." ) */
        SetDlgItemText(hDlg, 111, tmp.charAt(0).toLowerCase() + tmp.slice(1));

        if (T.sound_active) TabbozPlaySound(1400);
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
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

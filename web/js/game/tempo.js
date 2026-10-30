// Tabboz Simulator
// Copyright (c) 1997-2000 Andrea Bonomi
//
// Port of tempo.c: calendar, holidays, salary and school report.
// Released under the GNU General Public License v3 or later.

import {
    DialogBox, EndDialog, IDCANCEL, IDOK, LOWORD, MB_ICONINFORMATION, MB_ICONSTOP, MB_OK, MessageBox,
    SetDlgItemText, TRUE, FALSE, WM_COMMAND, WM_INITDIALOG, hInst,
} from '../win32.js';
import { T } from '../state.js';
import { TabbozPlaySound } from './readkey.js';
import { MostraSoldi } from './zarrosim.js';
import { MaterieMem } from './scuola.js';

export const InfoMese = [
    { nome: 'Gennaio', num_giorni: 31 },
    { nome: 'Febbraio', num_giorni: 28 },
    { nome: 'Marzo', num_giorni: 31 },
    { nome: 'Aprile', num_giorni: 30 },
    { nome: 'Maggio', num_giorni: 31 },
    { nome: 'Giugno', num_giorni: 30 },
    { nome: 'Luglio', num_giorni: 31 },
    { nome: 'Agosto', num_giorni: 31 },
    { nome: 'Settembre', num_giorni: 30 },
    { nome: 'Ottobre', num_giorni: 31 },
    { nome: 'Novembre', num_giorni: 30 },
    { nome: 'Dicembre', num_giorni: 31 },
];

export const InfoSettimana = [
    { nome: "Lunedi'", num_giorni: 0 },
    { nome: "Martedi'", num_giorni: 0 },
    { nome: "Mercoledi'", num_giorni: 0 },
    { nome: "Giovedi'", num_giorni: 0 },
    { nome: "Venerdi'", num_giorni: 0 },
    { nome: 'Sabato', num_giorni: 0 },
    { nome: 'Domenica', num_giorni: 1 },
];

const InfoVacanze = [
    { nome: 'Capodanno', giorno: 1, mese: 1, descrizione: "Oggi e' capodanno !" },
    { nome: 'Epifania', giorno: 6, mese: 1, descrizione: 'Epifania...' },
    { nome: 'Anniversario Liberazione', giorno: 25, mese: 4, descrizione: 'Oggi mi sento liberato' },
    {
        nome: 'Festa dei lavoratori', giorno: 1, mese: 5,
        descrizione: 'Nonostante nella tua vita, tu non faccia nulla, oggi fai festa anche tu...',
    },
    { nome: 'Ferragosto', giorno: 15, mese: 8, descrizione: "Oggi e' ferragosto..." },
    { nome: 'Tutti i Santi', giorno: 1, mese: 11, descrizione: "Figata, oggi e' vacanza..." },
    { nome: "Sant' Ambrogio", giorno: 7, mese: 12, descrizione: 'Visto che siamo a Milano, oggi facciamo festa.' },
    { nome: 'Immacolata Concezione', giorno: 8, mese: 12, descrizione: "Oggi e' festa..." },
    { nome: 'Natale', giorno: 25, mese: 12, descrizione: 'Buon Natale !!!' },
    { nome: 'Santo Stefano', giorno: 26, mese: 12, descrizione: 'Buon Santo Stefano...' },
];

// ------------------------------------------------------------------------------------------
// Giorno...
// ------------------------------------------------------------------------------------------

export async function Giorno(hInstance) {
    T.x_giorno++;
    if (T.x_giorno > InfoMese[T.x_mese - 1].num_giorni) {
        if (T.x_mese === 2 && T.x_anno_bisesto === 1 && T.x_giorno === 29) {
            await MessageBox(hInstance, 'Anno bisesto, anno funesto...', 'Anno Bisestile', MB_OK | MB_ICONSTOP);
        } else {
            T.x_giorno = 1;
            T.x_mese += 1;
        }
    }

    if (T.x_mese > 12) {
        T.x_mese = 1;
        T.x_anno_bisesto = +1; // sic: nel C c'e' "= +1", non "+= 1"
        if (T.x_anno_bisesto > 3) T.x_anno_bisesto = 0;
    }

    T.x_giornoset++;
    if (T.x_giornoset > 7) {
        T.x_giornoset = 1;
        if (T.current_testa > 0) {
            T.current_testa--; // Ogni 7 giorni diminuisce l' abbronzatura - 26 Feb 1999
            T.TabbozRedraw = 1; // e si deve aggiornare il disegno...
        }
    }

    /* ---------------> S T I P E N D I O <--------------- */

    if (T.impegno > 0) {
        T.giorni_di_lavoro += 1;

        if (T.x_giorno === 27 && T.giorni_di_lavoro > 3) {
            /* Stipendio calcolato secondo i giorni effettivi di lavoro */
            let stipendietto;
            if (T.giorni_di_lavoro > 29) stipendietto = T.stipendio;
            else stipendietto = Math.trunc((T.stipendio * T.giorni_di_lavoro) / 30);

            T.giorni_di_lavoro = 1;

            await MessageBox(hInstance,
                `Visto che sei stat${T.ao} ${T.un_una} brav${T.ao} dipendente sottomess${T.ao}, ora ti arriva il tuo misero stipendio di ${MostraSoldi(stipendietto)}`,
                'Stipendio !', MB_OK | MB_ICONINFORMATION);

            T.Soldi += stipendietto;
        }
    }

    /* ---------------> P A L E S T R A <---------------    21 Apr 1998	*/

    if (T.scad_pal_mese === T.x_mese && T.scad_pal_giorno === T.x_giorno) {
        await MessageBox(hInstance, "E' appena scaduto il tuo abbonamento della palestra...",
            'Palestra', MB_OK | MB_ICONINFORMATION);
        T.scad_pal_giorno = 0;
        T.scad_pal_mese = 0;
    }

    /* Calcola i giorni di vacanza durante l' anno ( da finire...)	*/
    T.x_vacanza = 0;
    T.current_tipa = 0;

    switch (T.x_mese) {
        case 1: /* Gennaio */
            if (T.x_giorno < 7) {
                T.x_vacanza = 1;
                if (T.Rapporti > 0) T.current_tipa = 1; /* Tipa vestita da Babbo Natale...*/
            }
            break; /* Vacanze di Natale */

        case 6: /* Giugno */
            if (T.x_giorno === 15) {
                await MessageBox(hInstance, 'Da domani iniziano le vacanza estive !',
                    'Ultimo giorno di scuola', MB_OK | MB_ICONINFORMATION);
            }

            if (T.x_giorno === 22) {
                /* Pagella */
                await DialogBox(hInst, 110, hInstance, MostraPagella);
            }
            if (T.x_giorno > 15) T.x_vacanza = 1;
            break;

        case 7: /* Luglio e */
        case 8: /* Agosto   */
            T.x_vacanza = 1;
            if (T.Rapporti > 93 && T.FigTipa > 95) T.current_tipa = 2; /* Tipa al mare...*/
            break;

        case 9: /* Settembre */
            if (T.x_giorno < 15) T.x_vacanza = 1;
            if (T.x_giorno === 15) {
                await MessageBox(hInstance, 'Questa mattina devi tornare a scuola...',
                    'Primo giorno di scuola', MB_OK | MB_ICONINFORMATION);
                T.Studio = 0; /* Azzera le materie...	*/
                for (let i = 1; i < 10; i++) MaterieMem[i].xxx = 0;
            }
            break;

        case 12: /* Dicembre */
            if (T.x_giorno > 22) {
                T.x_vacanza = 1; /* Vacanze di Natale */
                if (T.Rapporti > 0) T.current_tipa = 1; /* Tipa vestita da Babbo Natale...*/
            }

            if (T.x_giorno === 25) {
                if (T.current_pantaloni === 19 && T.current_gibbotto === 19) {
                    await MessageBox(hInstance, 'Con il tuo vestito da Babbo Natale riesci a stupire tutti...',
                        'Natale...', MB_OK | MB_ICONINFORMATION);
                    T.Fama += 20;
                    if (T.Fama > 100) T.Fama = 100;
                }
            }

            if (T.x_giorno === 28 && (T.current_pantaloni === 19 || T.current_gibbotto === 19)) {
                await MessageBox(hInstance, "Natale e' gia' passato... Togliti quel dannato vestito...",
                    'Natale...', MB_OK | MB_ICONINFORMATION);
                T.Fama -= 5;
                if (T.Fama < 0) T.Fama = 0;
            }
            break;
    }

    /* Domeniche e festivita' varie				VACANZE DI TIPO 2 */

    if (T.x_giornoset === 7) T.x_vacanza = 2; /* Domenica */

    for (const vacanza of InfoVacanze) {
        if (vacanza.mese === T.x_mese && vacanza.giorno === T.x_giorno) {
            await MessageBox(hInstance, vacanza.descrizione, vacanza.nome, MB_OK | MB_ICONINFORMATION);
            T.x_vacanza = 2; /* 2 = sono chiusi anche i negozi... */
        }
    }
}

// ------------------------------------------------------------------------------------------
// Mostra la pagella...
// ------------------------------------------------------------------------------------------

export async function MostraPagella(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        let k = 0;
        for (let i = 1; i < 10; i++) {
            if (MaterieMem[i].xxx < 6) k++; /* k = materie insuff o grav. insuf. */
            if (MaterieMem[i].xxx < 4) k++;
            SetDlgItemText(hDlg, i + 119, `${MaterieMem[i].xxx}`);
        }

        // Condotta... + un e' figo, + sembra un bravo ragazzo...
        SetDlgItemText(hDlg, 129, T.Fama > 75 ? '8' : '9');

        let tmp;
        if (k > 4) {
            if (T.sound_active) TabbozPlaySound(401);
            tmp = `NON ammess${T.ao}`; /* bocciata/o */
        } else {
            tmp = `ammess${T.ao}`; /* promossa/o */
            T.Soldi += 200;
        }

        SetDlgItemText(hDlg, 119, tmp);
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

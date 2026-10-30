// Tabboz Simulator
// Copyright (c) 1997-2000 Andrea Bonomi
//
// Port of telefono.c. Released under the GNU General Public License v3 or later.

import {
    DialogBox, EndDialog, IDCANCEL, IDOK, IDYES, LOWORD, MB_ICONINFORMATION, MB_ICONQUESTION, MB_OK,
    MB_YESNO, MessageBox, SetDlgItemText, TRUE, FALSE, WM_COMMAND, WM_INITDIALOG, hInst,
} from '../win32.js';
import { CELLULRABBONAM, COMPRACELLULAR, T, newAbbonamento, newCellular } from '../state.js';
import { TabbozPlaySound } from './readkey.js';
import { MostraSoldi, nomoney } from './zarrosim.js';

export const CellularMem = [
    newCellular(0, 2, 100, 290, 'Motorolo d170'),
    newCellular(0, 7, 100, 590, 'Motorolo 8700'),
    newCellular(1, 10, 100, 990, 'Macro TAC 8900'),
];

// ------------------------------------------------------------------------------------------
//  Controlla se e' un giorno di vacanza...
// ------------------------------------------------------------------------------------------

async function CellularVacanza(hDlg) {
    if (T.x_vacanza !== 2) return 0;
    await MessageBox(hDlg, "Stranamente, in un giorno di vacanza, il negozio e' chiuso...",
        'Telefonino', MB_OK | MB_ICONINFORMATION);
    return -1;
}

// ------------------------------------------------------------------------------------------
//  Compra Cellulare
// ------------------------------------------------------------------------------------------

let sceltaCellulare = 0;

async function CompraCellulare(hDlg, message, wParam) {
    /* 31 Marzo 1999 */
    if (message === WM_INITDIALOG) {
        SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));
        for (let i = 0; i < 3; i++) SetDlgItemText(hDlg, 120 + i, MostraSoldi(CellularMem[i].prezzo));
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 110:
            case 111:
            case 112:
                sceltaCellulare = LOWORD(wParam) - 110;
                return TRUE;

            case IDCANCEL:
                EndDialog(hDlg, TRUE);
                return TRUE;

            case IDOK:
                if (T.Soldi < CellularMem[sceltaCellulare].prezzo) {
                    // Controlla se ha abbastanza soldi...
                    await nomoney(hDlg, CELLULRABBONAM);
                    EndDialog(hDlg, TRUE);
                    return TRUE;
                }

                T.Soldi -= CellularMem[sceltaCellulare].prezzo;
                T.CellularData = { ...CellularMem[sceltaCellulare] };
                T.Fama += CellularMem[sceltaCellulare].fama;
                if (T.Fama > 100) T.Fama = 100;

                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

// ------------------------------------------------------------------------------------------
//  Abbonamento
// ------------------------------------------------------------------------------------------

export const AbbonamentMem = [
    newAbbonamento(1, 0, 50, 1, 100, 'Onmitel'), // Abbonamenti
    newAbbonamento(1, 0, 50, 1, 100, 'DIM'),
    newAbbonamento(1, 1, 100, 1, 100, 'Vind'),
    newAbbonamento(0, 0, 50, 1, 60, 'Onmitel'), // Ricariche
    newAbbonamento(0, 0, 100, 1, 110, 'Onmitel'),
    newAbbonamento(0, 0, 50, 1, 60, 'DIM'), // Ricariche
    newAbbonamento(0, 0, 100, 1, 110, 'DIM'),
    newAbbonamento(0, 1, 50, 1, 50, 'Vind'), // Ricariche
    newAbbonamento(0, 1, 100, 1, 100, 'Vind'),
];

let sceltaAbbonamento = 0;

async function AbbonaCellulare(hDlg, message, wParam) {
    /* 31 Marzo 1999 */
    if (message === WM_INITDIALOG) {
        SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));
        if (T.AbbonamentData.creditorest > -1) SetDlgItemText(hDlg, 105, T.AbbonamentData.nome);
        for (let i = 0; i < 9; i++) SetDlgItemText(hDlg, 110 + i, MostraSoldi(AbbonamentMem[i].prezzo));
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 110:
            case 111:
            case 112:
            case 113:
            case 114:
            case 115:
            case 116:
            case 117:
            case 118:
                sceltaAbbonamento = LOWORD(wParam) - 110;
                return TRUE;

            case IDCANCEL:
                EndDialog(hDlg, TRUE);
                return TRUE;

            case IDOK: {
                const scelta = AbbonamentMem[sceltaAbbonamento];
                if (T.Soldi < scelta.prezzo) {
                    // Controlla se ha abbastanza soldi...
                    await nomoney(hDlg, CELLULRABBONAM);
                    EndDialog(hDlg, TRUE);
                    return TRUE;
                }

                if (scelta.abbonamento === 1) {
                    // Abbonamento, no problem...
                    T.Soldi -= scelta.prezzo;
                    T.AbbonamentData = { ...scelta };
                    if (T.sound_active && T.CellularData.stato > -1) TabbozPlaySound(602);

                    EndDialog(hDlg, TRUE);
                } else {
                    // Ricarica...
                    if (T.AbbonamentData.creditorest > -1 && T.AbbonamentData.nome === scelta.nome) {
                        T.Soldi -= scelta.prezzo;
                        T.AbbonamentData.creditorest += scelta.creditorest;
                        if (T.sound_active && T.CellularData.stato > -1) TabbozPlaySound(602);
                        EndDialog(hDlg, TRUE);
                    } else {
                        await MessageBox(hDlg, 'Oh, che  te ne fai di una ricarica se non hai la sim ???',
                            'Telefonino', MB_OK | MB_ICONINFORMATION);
                    }
                }
                return TRUE;
            }

            default:
                return TRUE;
        }
    }

    return FALSE;
}

// ------------------------------------------------------------------------------------------
//  Cellulare
// ------------------------------------------------------------------------------------------

function AggiornaCell(hDlg) {
    SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));

    if (T.CellularData.stato > -1) SetDlgItemText(hDlg, 120, T.CellularData.nome);
    else SetDlgItemText(hDlg, 120, '');

    if (T.AbbonamentData.creditorest > -1) {
        SetDlgItemText(hDlg, 121, T.AbbonamentData.nome); // Abbonamento
        SetDlgItemText(hDlg, 122, MostraSoldi(T.AbbonamentData.creditorest)); // Credito
    } else {
        SetDlgItemText(hDlg, 121, '');
        SetDlgItemText(hDlg, 122, '');
    }
}

export async function Cellular(hDlg, message, wParam) {
    /* 31 Marzo 1999 */
    if (message === WM_INITDIALOG) {
        AggiornaCell(hDlg);
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 110:
                if ((await CellularVacanza(hDlg)) === 0) {
                    await DialogBox(hInst, COMPRACELLULAR, hDlg, CompraCellulare);
                    AggiornaCell(hDlg);
                }
                return TRUE;

            case 111:
                if ((await CellularVacanza(hDlg)) === 0) {
                    if (T.CellularData.stato > -1) {
                        const offerta = Math.trunc(T.CellularData.prezzo / 2) + 15;
                        const scelta = await MessageBox(hDlg,
                            `Ti posso dare ${MostraSoldi(offerta)} per il tuo telefonino... vuoi vendermelo ?`,
                            'Telefonino', MB_YESNO | MB_ICONQUESTION);
                        if (scelta === IDYES) {
                            T.CellularData.stato = -1;
                            T.Soldi += offerta;
                        } else {
                            await MessageBox(hDlg, 'Allora vai a farti fottere, pirletta !',
                                'Telefonino', MB_OK | MB_ICONINFORMATION);
                        }
                    } else {
                        await MessageBox(hDlg, 'Che telefonino vuoi vendere, pirletta ?',
                            'Telefonino', MB_OK | MB_ICONINFORMATION);
                    }
                    AggiornaCell(hDlg);
                }
                return TRUE;

            case 112:
                if ((await CellularVacanza(hDlg)) === 0) {
                    await DialogBox(hInst, CELLULRABBONAM, hDlg, AbbonaCellulare);
                    AggiornaCell(hDlg);
                }
                return TRUE;

            case 150:
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

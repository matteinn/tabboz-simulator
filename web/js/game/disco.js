// Tabboz Simulator
// Copyright (c) 1997-2000 Andrea Bonomi
//
// Port of disco.c. Released under the GNU General Public License v3 or later.

import {
    EndDialog, IDCANCEL, IDOK, LOWORD, LoadString, MB_ICONINFORMATION, MB_OK, MessageBox, SetDlgItemText,
    TRUE, FALSE, WM_COMMAND, WM_INITDIALOG, hInst,
} from '../win32.js';
import { DISCO, T, random } from '../state.js';
import { TabbozPlaySound } from './readkey.js';
import { MostraSoldi, nomoney } from './zarrosim.js';
import { Evento } from './eventi.js';

let numdisco = 0;

// Per una questione di svogliatezza del programmatore, viene usata STSCOOTER
// anche x i vestiti e per le discoteche.

export const DiscoMem = [
    { speed: 0, cc: 0, xxx: 0, fama: 0, mass: 0, maneuver: 0, prezzo: 0, stato: 0, nome: '---' },
    { speed: 0, cc: 30, xxx: 2, fama: 15, mass: 1, maneuver: 0, prezzo: 36, stato: 0, nome: '' },
    { speed: 0, cc: 0, xxx: 1, fama: 7, mass: 4, maneuver: 0, prezzo: 26, stato: 0, nome: '' },
    { speed: 0, cc: 0, xxx: 1, fama: 8, mass: 1, maneuver: 0, prezzo: 30, stato: 0, nome: '' },
    { speed: 0, cc: 35, xxx: 3, fama: 15, mass: 1, maneuver: 0, prezzo: 36, stato: 0, nome: '' },
    { speed: 0, cc: 0, xxx: 2, fama: 6, mass: 3, maneuver: 0, prezzo: 26, stato: 0, nome: '' },
    { speed: 0, cc: 0, xxx: 2, fama: 5, mass: 2, maneuver: 0, prezzo: 22, stato: 0, nome: '' },
    { speed: 0, cc: 0, xxx: 3, fama: 8, mass: 1, maneuver: 0, prezzo: 30, stato: 0, nome: '' },
    { speed: 1, cc: 0, xxx: 2, fama: 9, mass: 7, maneuver: 0, prezzo: 36, stato: 0, nome: '' },
];
/*	    |	|  |  |   \       \costo 					*/
/*	    |   |  |  |    \giorno di chiusura (1=lunedi',etc... - 0=nessuno) [24 marzo 1998] */
/*	    \	\  \  \incremento fama						*/
/*           \   \  \incremento reputazione					*/
/*            \   \figosita' minima x entrare (selezione all' ingresso) 	*/
/*	       1=disco fuori porta - ci puoi arrivare solo se hai lo scooter... */

//********************************************************************
// Routine per il pagamento della Discoteca.
//********************************************************************

async function PagaDisco(hInstance) {
    if (numdisco !== 0) {
        if (DiscoMem[numdisco].speed === 1) {
            if (T.ScooterData.stato === -1) {
                await MessageBox(hInstance, 'Senza lo scooter non puoi andare nelle discoteche fuori porta...',
                    'Discoteca fuori porta', MB_OK | MB_ICONINFORMATION);
                await Evento(hInstance);
                return;
            }
        }

        if (DiscoMem[numdisco].mass === T.x_giornoset) {
            /* [24 Marzo 1998] versione 0.6.2a */
            await MessageBox(hInstance, "Un cartello recita che oggi e' il giorno di chiusura settimanale...",
                'Giorno di chiusura', MB_OK | MB_ICONINFORMATION);
            return;
        }

        let Prezzo;
        if (T.sesso === 'M') Prezzo = DiscoMem[numdisco].prezzo;
        else Prezzo = DiscoMem[numdisco].prezzo - 10;

        if (Prezzo > T.Soldi) {
            /* check costo */
            await nomoney(hInstance, DISCO);
        } else {
            if (DiscoMem[numdisco].cc > T.Fama && T.sesso === 'M') {
                /* check selezione all'ingresso */
                if (T.sound_active) TabbozPlaySound(302);
                await MessageBox(hInstance,
                    "Mi dispiace signore, conciato cosi', qui non puo' entrare...\nVenga vestito meglio la prossima volta, signore.",
                    "Selezione all' ingresso", MB_OK | MB_ICONINFORMATION);
                if (T.Reputazione > 2) T.Reputazione -= 1;
                if (T.Fama > 2) T.Fama -= 1;
            } else {
                if (T.sound_active) TabbozPlaySound(303 + random(3)); // suoni: 0303 -> 0305
                T.Soldi -= Prezzo;
                T.Fama += DiscoMem[numdisco].fama;
                T.Reputazione += DiscoMem[numdisco].xxx;
                if (T.Fama > 100) T.Fama = 100;
                if (T.Reputazione > 100) T.Reputazione = 100;
            }
        }
        await Evento(hInstance);
    }
}

//******************************************************************
// Disco...
//******************************************************************

export async function Disco(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        numdisco = 0;
        SetDlgItemText(hDlg, 120, `O tip${T.ao}, in che disco andiamo ?`);

        /* [24 Marzo 1998] -  Perche' Discoteca era fino ad */
        /* oggi l'unica finestra che non mostrava i soldi   */
        /* che il tabbozzo ha ??? 			    */
        SetDlgItemText(hDlg, 110, MostraSoldi(T.Soldi));
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
            case 108: {
                numdisco = LOWORD(wParam) - 100;
                const buf = LoadString(hInst, LOWORD(wParam));

                let prezzo;
                if (T.sesso === 'M') prezzo = MostraSoldi(DiscoMem[numdisco].prezzo); // Le donne pagano meno...
                else prezzo = MostraSoldi(DiscoMem[numdisco].prezzo - 10);

                SetDlgItemText(hDlg, 120, buf.replace('%s', () => prezzo));
                return TRUE;
            }

            case IDCANCEL:
                EndDialog(hDlg, TRUE);
                return TRUE;

            case IDOK:
                await PagaDisco(hDlg);
                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

// Tabboz Simulator
// Copyright (c) 1997-2000 Andrea Bonomi
//
// Port of scuola.c. Released under the GNU General Public License v3 or later.

import {
    BM_SETCHECK, EndDialog, GetDlgItem, IDCANCEL, IDOK, IDYES, LOWORD, MB_ICONINFORMATION, MB_ICONQUESTION,
    MB_ICONSTOP, MB_OK, MB_YESNO, MessageBox, SendMessage, SetDlgItemText, TRUE, FALSE, WM_COMMAND,
    WM_INITDIALOG,
} from '../win32.js';
import { T, random } from '../state.js';
import { TabbozPlaySound } from './readkey.js';
import { MostraSoldi } from './zarrosim.js';
import { Evento } from './eventi.js';

/* Per una questione di svogliatezza del programmatore, viene usata STSCOOTER anche x i vestiti, */
/* le materie scolastiche e qualche altra cosa che adesso non mi viene in mente...               */
//                       xxx = voto in una materia
export const MaterieMem = [
    { nome: '---', xxx: 0 },
    { nome: 'Agraria', xxx: 0 },
    { nome: 'Fisica', xxx: 0 },
    { nome: "Attivita' culturali", xxx: 0 },
    { nome: "Attivita' matematiche", xxx: 0 },
    { nome: 'Scienze industriali', xxx: 0 },
    { nome: 'Elettrochimica', xxx: 0 },
    { nome: 'Petrolchimica', xxx: 0 },
    { nome: 'Filosofia aziendale', xxx: 0 },
    { nome: 'Metallurgia', xxx: 0 },
];

function NomiPulsanti(hDlg) {
    SetDlgItemText(hDlg, 101, `Corrompi il prof di ${MaterieMem[T.scelta].nome}`);
    if (T.sesso === 'M') SetDlgItemText(hDlg, 102, `Minaccia il prof di ${MaterieMem[T.scelta].nome}`);
    else SetDlgItemText(hDlg, 102, `Seduci il prof di ${MaterieMem[T.scelta].nome}`);
    SetDlgItemText(hDlg, 103, `Studia ${MaterieMem[T.scelta].nome}`);
}

/********************************************************************/
/* Scuola...                                                        */
/********************************************************************/

export async function Scuola(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        T.scelta = 1;
        SendMessage(GetDlgItem(hDlg, 110), BM_SETCHECK, TRUE, 0); /* Seleziona agraria */
        NomiPulsanti(hDlg);
        CalcolaStudio();
        ScriviVoti(hDlg); /* Scrive i voti, soldi, reputazione e studio nelle apposite caselle */
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 101: /* Corrompi i professori */
                if (!(await CheckVacanza(hDlg))) {
                    /* 21 Apr 1998 - I valori dei soldi e' meglio che siano sempre pari, in modo da facilitare la divisione x gli euro... */
                    const i = 30 + random(30) * 2;
                    const i2 = await MessageBox(hDlg,
                        `Ma... forse per ${MostraSoldi(i)} potrei dimenticare i tuoi ultimi compiti in classe...`,
                        'Corrompi i professori', MB_YESNO | MB_ICONQUESTION);
                    if (i2 === IDYES) {
                        if (T.Soldi >= i) {
                            T.Soldi -= i;
                            MaterieMem[T.scelta].xxx += 3;
                            if (MaterieMem[T.scelta].xxx > 10) MaterieMem[T.scelta].xxx = 10;
                        } else {
                            if (MaterieMem[T.scelta].xxx < 2) MaterieMem[T.scelta].xxx -= 2;
                            await MessageBox(hDlg,
                                'Cosa ??? Prima cerchi di corrompermi, poi si scopre che non hai abbastanza soldi !!!',
                                'Errore critico', MB_OK | MB_ICONSTOP);
                        }
                    }
                    await Evento(hDlg);
                    Aggiorna(hDlg);
                }
                return TRUE;

            case 102: /* Minaccia-Seduci i professori */
                if (!(await CheckVacanza(hDlg))) {
                    if (T.sesso === 'M') {
                        // Maschietto - minaccia prof.
                        if (T.Reputazione >= 30 || random(10) < 1) {
                            MaterieMem[T.scelta].xxx += 2;
                            if (MaterieMem[T.scelta].xxx > 10) MaterieMem[T.scelta].xxx = 10;
                        } else {
                            if (T.sound_active) TabbozPlaySound(402);
                            await MessageBox(hDlg,
                                "Cosa ??? Credi di farmi paura piccolo pezzettino di letame vestito da zarro... Deve ancora nasce chi puo' minacciarmi...",
                                'Bella figura', MB_OK | MB_ICONINFORMATION);
                            if (T.Reputazione > 3) T.Reputazione -= 2;
                            if (MaterieMem[T.scelta].xxx > 2) MaterieMem[T.scelta].xxx -= 1;
                        }
                    } else {
                        // Femminuccia - seduci prof.
                        if (T.Fama >= 50 || random(10) < 2) {
                            MaterieMem[T.scelta].xxx += 2;
                            if (MaterieMem[T.scelta].xxx > 10) MaterieMem[T.scelta].xxx = 10;
                        } else {
                            if (T.sound_active) TabbozPlaySound(402);
                            await MessageBox(hDlg, 'Infastidito dalla tua presenza, il prof ti manda via a calci.',
                                'Bella figura', MB_OK | MB_ICONINFORMATION);
                            if (T.Reputazione > 3) T.Reputazione -= 2;
                            if (MaterieMem[T.scelta].xxx > 2) MaterieMem[T.scelta].xxx -= 1;
                        }
                    }
                    Aggiorna(hDlg);
                    await Evento(hDlg);
                }
                return TRUE;

            case 103: /* Studia */
                if (!(await CheckVacanza(hDlg))) {
                    if (T.Reputazione > 10) T.Reputazione -= 5; /* Studiare costa fatica... */
                    if (T.Fama > 5) T.Fama -= 1; /* (oltre che Reputazione e Fama...) */
                    MaterieMem[T.scelta].xxx += 1;
                    if (MaterieMem[T.scelta].xxx > 10) MaterieMem[T.scelta].xxx = 10;
                    Aggiorna(hDlg);
                    await Evento(hDlg);
                }
                return TRUE;

            case 110:
            case 111:
            case 112:
            case 113:
            case 114:
            case 115:
            case 116:
            case 117:
            case 118:
                T.scelta = LOWORD(wParam) - 109;
                NomiPulsanti(hDlg);
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

/* Scrive i voti nelle apposite caselle */
export function ScriviVoti(parent) {
    T.ScuolaRedraw = 0;

    SetDlgItemText(parent, 104, MostraSoldi(T.Soldi));
    SetDlgItemText(parent, 105, `${T.Reputazione}/100`);
    SetDlgItemText(parent, 106, `${T.Studio}/100`);

    for (let i = 1; i < 10; i++) SetDlgItemText(parent, i + 119, `${MaterieMem[i].xxx}`);
}

/* Calcola Studio */
export function CalcolaStudio() {
    let i2 = 0;
    for (let i = 1; i < 10; i++) i2 += MaterieMem[i].xxx;
    i2 = i2 * 10;
    T.Studio = Math.trunc(i2 / 9);
}

/* Aggiorna */
export function Aggiorna(parent) {
    CalcolaStudio();
    if (T.ScuolaRedraw === 1) ScriviVoti(parent);

    SetDlgItemText(parent, 104, MostraSoldi(T.Soldi));
    SetDlgItemText(parent, 105, `${T.Reputazione}/100`);
    SetDlgItemText(parent, 106, `${T.Studio}/100`);
    SetDlgItemText(parent, T.scelta + 119, `${MaterieMem[T.scelta].xxx}`);
}

export async function CheckVacanza(parent) {
    if (T.x_vacanza !== 0) {
        await MessageBox(parent, 'Non puoi andare a scuola in un giorno di vacanza !',
            'Scuola', MB_OK | MB_ICONINFORMATION);
        return TRUE;
    }
    return FALSE;
}

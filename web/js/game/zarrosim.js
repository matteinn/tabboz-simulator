// Tabboz Simulator
// Copyright (c) 1997-2000 Andrea Bonomi
//
// Port of zarrosim.c. This file is part of Tabboz Simulator, released under the
// GNU General Public License v3 or later.

import {
    AppendMenu, CreatePopupMenu, DeleteMenu, DialogBox, DrawMenuBar, EnableWindow, EndDialog, GetDlgItem,
    GetMenu, GetOpenFileName, GetSaveFileName, GetSubMenu, GetSystemMenu, IDCANCEL, IDOK, IDYES, InsertMenu,
    InvalidateRect, IsIconic, KillTimer, LoadString, MB_ICONHAND, MB_ICONINFORMATION, MB_ICONQUESTION,
    MB_ICONSTOP, MB_OK, MB_YESNO, MF_BYPOSITION, MF_POPUP,
    MessageBox, MF_BYCOMMAND, MF_SEPARATOR, MF_STRING, PBM_SETPOS, SC_CLOSE, SendMessage, SetDlgItemText,
    SetFocus, SetTimer, ShowWindow, SW_HIDE, SW_SHOWNORMAL, TRUE, FALSE, WM_COMMAND, WM_INITDIALOG,
    WM_SYSCOMMAND, WM_TIMER, BM_SETCHECK, CB_ADDSTRING, CB_SETCURSEL, GetDlgItemText, LOWORD, hInst,
} from '../win32.js';
import {
    ABOUT, ATTESAMAX, BAUHOUSE, BUILD_DATE, CONFIGURATION, COMPAGNIA, CELLULAR, CELLULRABBONAM, DISCO,
    FAMIGLIA, FORMAT, LAVORO, LOGO, MAIN, PALESTRA, PERSONALINFO, QX_ABOUT, QX_CELLULAR, QX_CLOSE,
    QX_COMPAGNIA, QX_CONFIG, QX_DISCO, QX_FAMIGLIA, QX_INFO, QX_LAVORO, QX_LOAD, QX_LOGO, QX_NOME, QX_PALESTRA,
    QX_SAVE, QX_SCOOTER, QX_SCUOLA, QX_SOLDI, QX_TABACCHI, QX_TIPA, QX_VESTITI, QX_VESTITI1, QX_VESTITI2,
    QX_VESTITI3, QX_VESTITI4, QX_VESTITI5, SCOOTER, SCUOLA, SPEGNIMI, T, TABACCAIO, TIPA, VERSION,
    VESTITI, atoi, atol, random,
} from '../state.js';
import {
    CodificaAnsi, DecodificaAnsi, LeggiProfilo, RRKey, ScriviProfilo, SpegniISuoni, TabbozAddKey,
    TabbozPlaySound, TabbozReadKey, UsaProfilo,
} from './readkey.js';
import { Giorno, InfoMese, InfoSettimana } from './tempo.js';
import { Evento } from './eventi.js';
import { CalcolaStudio, MaterieMem, Scuola } from './scuola.js';
import { RegisterBMPTipaClass, RegisterBMPViewClass } from './tabimg.js';
import { CalcolaVelocita, Scooter, ScooterMem, n_attivita } from './scooter.js';
import { RunPalestra, RunTabacchi, RunVestiti, Vestiti } from './vestiti.js';
import { Disco } from './disco.js';
import { Tipa } from './tipa.js';
import { Lavoro } from './lavoro.js';
import { Cellular } from './telefono.js';

let t_random = 0; // Attesa a random tra i vari eventi timer

//*******************************************************************
// Calcola Sesso 29 Maggio 1999 - Maschietto o Femminucica
//*******************************************************************

export function CalcolaSesso() {
    if (T.sesso === 'M') {
        T.ao = 'o';
        T.un_una = 'un';
    } else {
        T.ao = 'a';
        T.un_una = 'una';
    }
}

//*******************************************************************
// ResetMe  26 Marzo 1999 - Reset del Tabboz Simulator
//*******************************************************************

export function ResetMe(primavolta) {
    T.TabbozRedraw = 1;
    T.Soldi = 10;
    T.Paghetta = 30;
    T.Reputazione = 0;
    T.Fama = 0;
    T.Rapporti = 0;
    T.Stato = 100;
    T.impegno = 0;
    T.giorni_di_lavoro = 0;
    T.numeroditta = 0;

    T.Residenza = 'Milano';
    T.Nometipa = '';

    T.City = LoadString(hInst, 400 + random(22));

    const tmp = LoadString(hInst, 450 + random(50));
    T.Street = `${tmp} n. ${1 + random(150)}`;

    for (let i = 1; i < 10; i++) MaterieMem[i].xxx = 0;

    CalcolaStudio();

    T.x_mese = 9;
    T.x_giorno = 30;
    T.x_giornoset = 1;
    T.x_anno_bisesto = 0;

    T.comp_mese = random(12) + 1;
    T.comp_giorno = random(InfoMese[T.comp_mese - 1].num_giorni) + 1;

    if (primavolta) {
        // Se e' la prima volta che uso il tabboz resetta anche la configurazione...
        T.STARTcmdShow = 1;
        T.timer_active = 1;
        T.sound_active = 1;
        T.euro = 0;
        T.sesso = 'M';
        T.Nome = 'Tizio';
        T.Cognome = 'Caio';
        CalcolaSesso();
    }

    // Ognuno col suo nome di default (il C rinominava solo la tabbozza, e un tabbozzo
    // riformattato restava "Nessuna In Particolare").
    if (T.sesso === 'F') {
        T.Nome = 'Nessuna';
        T.Cognome = 'In Particolare';
    } else {
        T.Nome = 'Tizio';
        T.Cognome = 'Caio';
    }

    T.sizze = 0;
    T.current_testa = 0;
    T.current_gibbotto = 0;
    T.current_pantaloni = 0;
    T.current_scarpe = 0;

    T.ScooterData.stato = -1;

    T.AbbonamentData.creditorest = -1;
    T.CellularData.stato = -1;
}

//*******************************************************************
// Formattazione iniziale Tabbozzo (scelta sesso, nome...) 14-01-2000
//*******************************************************************

let tmpsesso = 'M';

export async function FormatTabboz(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        if (T.firsttime === 1) EnableWindow(GetDlgItem(hDlg, 2), 0);
        SendMessage(GetDlgItem(hDlg, 102), BM_SETCHECK, TRUE, 0);
        tmpsesso = random(2) === 1 ? 'M' : 'F';

        SendMessage(GetDlgItem(hDlg, 110), CB_ADDSTRING, 0, '3.5", 1.44MB, 512 bytes/sector');
        SendMessage(GetDlgItem(hDlg, 110), CB_SETCURSEL, 0, 0);
        return TRUE;
    }

    if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 100:
                tmpsesso = 'M';
                break;
            case 101:
                tmpsesso = 'F';
                break;
            case 102:
                tmpsesso = random(2) === 1 ? 'M' : 'F';
                break;

            case IDOK:
                await formatProgress(hDlg);
                // Il C chiamava ResetMe prima di cambiare sesso, e il nome di default era
                // quello del sesso precedente: al primo avvio la tabbozza si chiamava "Tizio Caio".
                T.sesso = tmpsesso;
                CalcolaSesso();
                ResetMe(0);
                EndDialog(hDlg, TRUE);
                return TRUE;

            case IDCANCEL:
                if (T.firsttime === 1) {
                    T.sesso = tmpsesso;
                    CalcolaSesso();
                }
                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

// The format dialog has a progress bar the C code never moves; fill it before resetting.
async function formatProgress(hDlg) {
    for (const id of [1, 2, 100, 101, 102]) EnableWindow(GetDlgItem(hDlg, id), 0);
    const bar = GetDlgItem(hDlg, 111);
    for (let pos = 0; pos <= 100; pos += 5) {
        SendMessage(bar, PBM_SETPOS, pos, 0);
        SetDlgItemText(hDlg, 112, `Formattazione in corso... ${pos}%`);
        await new Promise((r) => setTimeout(r, 40));
    }
    SetDlgItemText(hDlg, 112, 'Formattazione completata.');
    await new Promise((r) => setTimeout(r, 300));
}

//*******************************************************************
// InitTabboz
//*******************************************************************

export async function InitTabboz() {
    // Inizializza un po' di variabile...
    T.boolean_shutdown = 0; /* 0=resta dentro, 1=uscita, 2=shutdown */

    T.Fortuna = 0; /* Uguale a me...               */
    T.ScooterData = { ...ScooterMem[0] }; /* nessuno scooter */
    T.Attesa = ATTESAMAX; /* attesa per avere soldi...    */
    T.ImgSelector = 0; /* W l' arte di arrangiarsi...  */
    T.timer_active = 1;
    T.fase_di_avvio = 1;
    T.Tempo_trascorso_dal_pestaggio = 0;
    T.current_tipa = 0;

    // Ottieni i nomi dei creatori di sto coso...
    T.Andrea = LoadString(hInst, 10);
    T.Caccia = LoadString(hInst, 11);
    T.Daniele = LoadString(hInst, 12);
    T.Obscured = LoadString(hInst, 2);

    RegisterBMPViewClass(hInst);
    RegisterBMPTipaClass(hInst);

    T.firsttime = 0;
    await CaricaTutto();

    // 15 Mar 1998 - Ora mostra anche il logo iniziale
    if (T.STARTcmdShow) await DialogBox(hInst, LOGO, null, Logo);

    // 14 Gen 1999 - Formattazione iniziale Tabbozzo
    if (T.firsttime === 1) {
        await DialogBox(hInst, FORMAT, null, FormatTabboz);
        SalvaTutto();
    }
}

//*******************************************************************
//  Carica le caratteristiche dal registro...
//*******************************************************************

export async function CaricaTutto() {
    T.Soldi = atol(RRKey('Soldi'));
    T.Paghetta = atol(RRKey('Paghetta'));
    T.Reputazione = vvc(atoi(RRKey('Reputazione')));
    T.Studio = vvc(atoi(RRKey('Studio')));
    T.Fama = vvc(atoi(RRKey('Fama')));
    T.Rapporti = vvc(atoi(RRKey('Rapporti')));
    T.Stato = vvc(atoi(RRKey('Stato')));
    T.DDP = atol(RRKey('DdP'));
    T.FigTipa = vvc(atoi(RRKey('FigTipa')));

    T.Nome = TabbozReadKey('Nome') ?? '';
    T.Cognome = TabbozReadKey('Cognome') ?? '';
    T.Nometipa = TabbozReadKey('Nometipa') ?? '';

    const city = TabbozReadKey('City');
    if (city === null) T.firsttime = 1;
    else T.City = city;

    T.Residenza = TabbozReadKey('Residenza') ?? T.Residenza;
    T.Street = TabbozReadKey('Street') ?? T.Street;

    // la serie di 9 "A" messe nella riga sotto NON E' CASUALE
    // non sostituirla con altre lettere !
    const materie = TabbozReadKey('Materie') ?? 'AAAAAAAAA';

    for (let i = 1; i < 10; i++) {
        MaterieMem[i].xxx = (materie.charCodeAt(i - 1) || 0) - 65;
        if (MaterieMem[i].xxx < 0 || MaterieMem[i].xxx > 10) MaterieMem[i].xxx = 0;
    }
    CalcolaStudio();

    T.Fortuna = vvc(atoi(RRKey('Fortuna')));

    // Se e' la prima volta che parte il Tabboz Simulator, la data e' impostata al 30 Settembre
    T.x_mese = atoi(RRKey('Mese'));
    if (T.x_mese < 1) T.x_mese = 9;
    T.x_giorno = atoi(RRKey('Giorno'));
    if (T.x_giorno < 1) T.x_giorno = 30;
    T.x_giornoset = atoi(RRKey('GiornoSet'));
    if (T.x_giornoset < 1) T.x_giornoset = 1;
    T.x_anno_bisesto = atoi(RRKey('AnnoBisestile'));
    if (T.x_anno_bisesto > 3) T.x_anno_bisesto = 3;

    // Se non e' gia' settato,setta il compleanno
    T.comp_mese = atoi(RRKey('CompMese'));
    if (T.comp_mese < 1) T.comp_mese = random(12) + 1;

    T.comp_giorno = atoi(RRKey('CompGiorno'));
    if (T.comp_giorno < 1) T.comp_giorno = random(InfoMese[T.comp_mese - 1].num_giorni) + 1;

    T.numeroditta = vvc(atoi(RRKey('NumeroDitta')));
    T.scad_pal_giorno = vvc(atoi(RRKey('ScadPalGiorno')));
    T.scad_pal_mese = vvc(atoi(RRKey('ScadPalMese')));

    T.impegno = vvc(atoi(RRKey('Impegno')));
    T.giorni_di_lavoro = vvc(atoi(RRKey('GiorniDiLavoro')));
    T.stipendio = atoi(RRKey('Stipendio'));
    if (T.stipendio < 0) T.stipendio = 0;

    T.sizze = atoi(RRKey('Sigarette'));
    if (T.sizze < 0) T.sizze = 0;

    T.current_testa = vvc(atoi(RRKey('Testa')));
    T.current_gibbotto = vvc(atoi(RRKey('Giubbotto')));
    T.current_pantaloni = vvc(atoi(RRKey('Pantaloni')));
    T.current_scarpe = vvc(atoi(RRKey('Scarpe')));

    T.euro = atoi(RRKey('Euro'));
    if (T.euro < 0) T.euro = 0;

    T.sesso = RRKey('Sesso').charAt(0);
    if (T.sesso !== 'M' && T.sesso !== 'F') T.sesso = 'M';

    CalcolaSesso();

    T.STARTcmdShow = readFlag('STARTcmdShow');
    T.timer_active = readFlag('TimerActive');
    T.sound_active = readFlag('SoundActive');

    const sd = T.ScooterData;
    sd.speed = Math.max(0, atoi(RRKey('Scooter\\Speed')));
    sd.marmitta = Math.max(0, atoi(RRKey('Scooter\\Marmitta')));
    sd.carburatore = Math.max(0, atoi(RRKey('Scooter\\Carburatore')));
    sd.cc = Math.max(0, atoi(RRKey('Scooter\\CC')));
    sd.filtro = Math.max(0, atoi(RRKey('Scooter\\Filtro')));
    sd.prezzo = Math.max(0, atoi(RRKey('Scooter\\Prezzo')));
    sd.attivita = Math.max(0, atoi(RRKey('Scooter\\Attivita')));
    sd.stato = atoi(RRKey('Scooter\\Stato')); /* -1 = nessuno */

    T.benzina = Math.max(0, atoi(RRKey('Scooter\\Benzina')));

    sd.nome = TabbozReadKey('Scooter\\Nome') ?? 'nessuno';

    //  Cellulare ----------------------

    T.AbbonamentData.dualonly = atoi(RRKey('Cellular\\DualOnly'));
    T.AbbonamentData.creditorest = atoi(RRKey('Cellular\\CreditoRest'));
    const nomeAbb = TabbozReadKey('Cellular\\NomeAbb');
    if (nomeAbb === null) T.AbbonamentData.creditorest = -1;
    else T.AbbonamentData.nome = nomeAbb;

    T.CellularData.dual = atoi(RRKey('Cellular\\DualBand'));
    T.CellularData.stato = atoi(RRKey('Cellular\\Stato'));
    T.CellularData.prezzo = atoi(RRKey('Cellular\\Prezzo'));
    const nomeCel = TabbozReadKey('Cellular\\Nome');
    if (nomeCel === null) T.CellularData.stato = -1;
    else T.CellularData.nome = nomeCel;

    if (T.firsttime) ResetMe(1);

    /* Controllo eventuali errori nella data (o data non settata...) */
    if (T.x_giorno < 1) T.x_giorno = 1;
    if (T.x_giorno > 31) T.x_giorno = 1;
    if (T.x_mese < 1) T.x_mese = 1;
    if (T.x_mese > 12) T.x_mese = 1;
    if (T.x_giornoset < 1) T.x_giornoset = 1;
    if (T.x_giornoset > 7) T.x_giornoset = 1;

    T.x_giorno--; /* Per evitare che avanzi di giorno ogni volta che si apre il programma */
    T.x_giornoset--;
    await Giorno(null);
}

// Flags default to 1 when the key is missing, like the C code's "if (x < 0) x = 1".
function readFlag(key) {
    const v = TabbozReadKey(key);
    return v === null ? 1 : atoi(v) < 0 ? 1 : atoi(v);
}

//*******************************************************************
//      Fine Programma
//*******************************************************************
export function FineProgramma() {
    TabbozAddKey('Exe', 'zarrosim');
    SalvaTutto();
}

//*******************************************************************
//      Salva le caratteristiche nel registro
//*******************************************************************

export function SalvaTutto() {
    TabbozAddKey('Soldi', T.Soldi);
    TabbozAddKey('Paghetta', T.Paghetta);
    TabbozAddKey('Reputazione', T.Reputazione);
    TabbozAddKey('Studio', T.Studio);
    TabbozAddKey('Fama', T.Fama);
    TabbozAddKey('Rapporti', T.Rapporti);
    TabbozAddKey('Stato', T.Stato);
    TabbozAddKey('DdP', T.DDP);
    TabbozAddKey('FigTipa', T.FigTipa);

    TabbozAddKey('Nome', T.Nome);
    TabbozAddKey('Cognome', T.Cognome);
    TabbozAddKey('Nometipa', T.Nometipa);
    TabbozAddKey('City', T.City);
    TabbozAddKey('Residenza', T.Residenza);
    TabbozAddKey('Street', T.Street);

    let materie = '';
    for (let i = 1; i < 10; i++) materie += String.fromCharCode(65 + MaterieMem[i].xxx);
    TabbozAddKey('Materie', materie);

    TabbozAddKey('Fortuna', T.Fortuna);

    TabbozAddKey('Mese', T.x_mese);
    TabbozAddKey('Giorno', T.x_giorno);
    TabbozAddKey('GiornoSet', T.x_giornoset);
    TabbozAddKey('AnnoBisestile', T.x_anno_bisesto);

    TabbozAddKey('CompMese', T.comp_mese);
    TabbozAddKey('CompGiorno', T.comp_giorno);

    TabbozAddKey('NumeroDitta', T.numeroditta);
    TabbozAddKey('ScadPalGiorno', T.scad_pal_giorno);
    TabbozAddKey('ScadPalMese', T.scad_pal_mese);

    TabbozAddKey('Impegno', T.impegno);
    TabbozAddKey('GiorniDiLavoro', T.giorni_di_lavoro);
    TabbozAddKey('Stipendio', T.stipendio);

    TabbozAddKey('Sigarette', T.sizze);

    TabbozAddKey('Testa', T.current_testa);
    TabbozAddKey('Giubbotto', T.current_gibbotto);
    TabbozAddKey('Pantaloni', T.current_pantaloni);
    TabbozAddKey('Scarpe', T.current_scarpe);

    TabbozAddKey('Euro', T.euro);
    TabbozAddKey('STARTcmdShow', T.STARTcmdShow);
    TabbozAddKey('TimerActive', T.timer_active);
    TabbozAddKey('SoundActive', T.sound_active);
    TabbozAddKey('Sesso', T.sesso);
    TabbozAddKey('Debug', T.debug_active);

    const sd = T.ScooterData;
    TabbozAddKey('Scooter\\Speed', sd.speed);
    TabbozAddKey('Scooter\\Marmitta', sd.marmitta);
    TabbozAddKey('Scooter\\Carburatore', sd.carburatore);
    TabbozAddKey('Scooter\\CC', sd.cc);
    TabbozAddKey('Scooter\\Filtro', sd.filtro);
    TabbozAddKey('Scooter\\Prezzo', sd.prezzo);
    TabbozAddKey('Scooter\\Attivita', sd.attivita);
    TabbozAddKey('Scooter\\Stato', sd.stato);
    TabbozAddKey('Scooter\\Benzina', T.benzina);
    TabbozAddKey('Scooter\\Nome', sd.nome);

    TabbozAddKey('Cellular\\DualOnly', T.AbbonamentData.dualonly);
    TabbozAddKey('Cellular\\CreditoRest', T.AbbonamentData.creditorest);
    TabbozAddKey('Cellular\\NomeAbb', T.AbbonamentData.nome);

    TabbozAddKey('Cellular\\DualBand', T.CellularData.dual);
    TabbozAddKey('Cellular\\Stato', T.CellularData.stato);
    TabbozAddKey('Cellular\\Prezzo', T.CellularData.prezzo);
    TabbozAddKey('Cellular\\Nome', T.CellularData.nome);

    TabbozAddKey('Version', VERSION);
}

/********************************************************************/
/* About...                                                         */
/********************************************************************/

export async function About(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        SetDlgItemText(hDlg, 110, T.Andrea);
        SetDlgItemText(hDlg, 111, T.Caccia);
        SetDlgItemText(hDlg, 112, T.Daniele);
        SetDlgItemText(hDlg, 115, `${VERSION}, ${BUILD_DATE}`);
        SetDlgItemText(hDlg, 116, T.Obscured); /* Obscured Truckware (se il nome e' diverso, crash ! ) */
        T.cheat = 0;
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case IDOK:
            case IDCANCEL:
                EndDialog(hDlg, TRUE);
                return TRUE;

            case 203:
            case 113:
                await Atinom(hDlg);
                return TRUE;

            case 257:
                T.cheat = T.cheat + 1;
                if (T.cheat >= 10) {
                    /* Lunedi' 13 Aprile 1998 - Ora il trukko viene un attimo modificato... */
                    const buf = `${T.Nome} ${T.Cognome}`;

                    if (LoadString(hInst, 13) === buf) {
                        /* Dino... */
                        T.Soldi = T.Soldi + 1000;
                        T.Reputazione = random(4);
                        T.Fama = random(40);
                    }

                    if (LoadString(hInst, 14) === buf) {
                        /* Fratello di Dino... */
                        T.Soldi = T.Soldi + 1000;
                        T.Reputazione = random(30);
                        T.Fama = random(5);
                    }

                    if (T.Daniele === buf) {
                        /* Murdock, ti regala una macchinina... */
                        T.ScooterData = { ...ScooterMem[7] };
                        T.benzina = 850;
                        T.Reputazione = 100;
                    }

                    if (T.Caccia === buf) {
                        /* Caccia fa' aumentare i dindi... */
                        T.Soldi = T.Soldi + 10000;
                        T.Fama = 100;
                    }

                    if (T.Andrea === buf) {
                        /* Io porto la scuola e la tipa al 100% */
                        for (let i = 1; i < 10; i++) MaterieMem[i].xxx = 10;
                        CalcolaStudio();
                        if (T.Rapporti > 1) T.Rapporti = 100;
                        T.impegno = 100;
                        T.numeroditta = 1;
                        T.stipendio = 5000;
                    }

                    T.cheat = 0;
                }
                return TRUE;
            default:
                return TRUE;
        }
    }

    return FALSE;
}

/********************************************************************/
/* Logo...                                                          */
/********************************************************************/

export async function Logo(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        if (T.sound_active) TabbozPlaySound(0);
        if (T.fase_di_avvio === 1) SetTimer(hDlg, WM_TIMER, 10000); /* 10 Secondi */
        return TRUE;
    }

    if (message === WM_TIMER) {
        if (T.fase_di_avvio === 1) {
            KillTimer(hDlg, WM_TIMER); /* Distrugge il timer... */
            EndDialog(hDlg, TRUE);
        }
    }

    if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case IDOK:
            case IDCANCEL:
            case 202:
            case 203:
                if (T.fase_di_avvio === 1) KillTimer(hDlg, WM_TIMER);
                EndDialog(hDlg, TRUE);
                return TRUE;
            default:
                return TRUE;
        }
    }

    return FALSE;
}

/********************************************************************/
/* Spegnimi... 11 giugno 1998                                       */
/********************************************************************/

export async function Spegnimi(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        T.boolean_shutdown = 1; // Uscita normale...

        SendMessage(GetDlgItem(hDlg, 102), BM_SETCHECK, FALSE, 0);
        SendMessage(GetDlgItem(hDlg, 101), BM_SETCHECK, TRUE, 0);

        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 101: // Un bug nella v 0.8.51pr impediva l' uscita corretta...
                T.boolean_shutdown = 1; // 1=uscita
                return TRUE;

            case 102:
                T.boolean_shutdown = 2; // 2=shutdown
                return TRUE;

            case 110:
                await MessageBox(hDlg,
                    "'Spegni il computer ed esci di casa'\n\nPubblicita' Progresso per il recupero dei giovani disadattati a causa dei computer sponsorizzata da Obscured Truckware.",
                    'Guida del Tabboz Simulator', MB_OK);
                return TRUE;

            case IDOK:
                SpegniISuoni();
                EndDialog(hDlg, TRUE);
                return TRUE;

            case IDCANCEL:
                T.boolean_shutdown = 0; // non e' proprio un boolean, ma va bene lo stesso...
                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

/********************************************************************/
/* Configuration...                                                 */
/********************************************************************/

export async function Configuration(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        if (T.STARTcmdShow) SendMessage(GetDlgItem(hDlg, 106), BM_SETCHECK, TRUE, 0);
        if (T.euro) SendMessage(GetDlgItem(hDlg, 107), BM_SETCHECK, TRUE, 0);
        if (T.timer_active) SendMessage(GetDlgItem(hDlg, 108), BM_SETCHECK, TRUE, 0);
        if (T.debug_active) SendMessage(GetDlgItem(hDlg, 109), BM_SETCHECK, TRUE, 0);
        if (T.sound_active) SendMessage(GetDlgItem(hDlg, 110), BM_SETCHECK, TRUE, 0);

        if (T.Fortuna >= 20) SendMessage(GetDlgItem(hDlg, 101), BM_SETCHECK, TRUE, 0);
        else if (T.Fortuna >= 15) SendMessage(GetDlgItem(hDlg, 102), BM_SETCHECK, TRUE, 0);
        else if (T.Fortuna >= 10) SendMessage(GetDlgItem(hDlg, 103), BM_SETCHECK, TRUE, 0);
        else if (T.Fortuna >= 5) SendMessage(GetDlgItem(hDlg, 104), BM_SETCHECK, TRUE, 0);
        else SendMessage(GetDlgItem(hDlg, 105), BM_SETCHECK, TRUE, 0);

        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 101:
                T.Fortuna = 20;
                return TRUE; /* Livelli di Difficolta' */
            case 102:
                T.Fortuna = 15;
                return TRUE;
            case 103:
                T.Fortuna = 10;
                return TRUE;
            case 104:
                T.Fortuna = 5;
                return TRUE;
            case 105:
                T.Fortuna = 0;
                return TRUE;
            case 106:
                T.STARTcmdShow = T.STARTcmdShow ? 0 : 1;
                return TRUE;
            case 107:
                T.euro = T.euro ? 0 : 1;
                return TRUE;
            case 108:
                T.timer_active = T.timer_active ? 0 : 1;
                return TRUE;
            case 109:
                T.debug_active = T.debug_active ? 0 : 1;
                return TRUE;
            case 110:
                T.sound_active = T.sound_active ? 0 : 1;
                return TRUE;

            case 203: // Reset - 26 Marzo 1999
                await DialogBox(hInst, FORMAT, hDlg, FormatTabboz);
                return TRUE;

            case IDOK:
            case IDCANCEL:
                SalvaTutto();
                EndDialog(hDlg, TRUE);
                return TRUE;
            default:
                return TRUE;
        }
    }

    return FALSE;
}

/********************************************************************/
/* Personal Information...                                          */
/********************************************************************/

export async function PersonalInfo(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        SetDlgItemText(hDlg, 103, ` ${T.comp_giorno} ${InfoMese[T.comp_mese - 1].nome}`); // Data di nascita
        SetDlgItemText(hDlg, 104, `${T.comp_giorno * 13 + T.comp_mese * 3 + 6070}`); // Numero documento di nascita (inutile ma da' spessore...)

        let tmp;
        if (T.numeroditta < 1) {
            // Professione
            tmp = T.sesso === 'M' ? 'Studente' : 'Studentessa';
        } else {
            tmp = `Sfruttat${T.ao}`;
        }
        SetDlgItemText(hDlg, 108, tmp);

        SetDlgItemText(hDlg, 109, `Nat${T.ao} il`); // Nata/o il
        SetDlgItemText(hDlg, 110, T.sesso === 'M' ? 'Celibe' : 'Libera');

        SetDlgItemText(hDlg, 111, T.Residenza); // Residenza
        SetDlgItemText(hDlg, 107, T.Street); // Indirizzo (inutile ma da' spessore...)
        SetDlgItemText(hDlg, 105, T.City); // Citta' di nascita (inutile ma da' spessore...)
        SetDlgItemText(hDlg, 101, T.Cognome); // Cognome
        SetDlgItemText(hDlg, QX_NOME, T.Nome); // Nome
        SetFocus(GetDlgItem(hDlg, QX_NOME));

        return FALSE; // il focus e' gia' stato impostato
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 111:
                T.Residenza = GetDlgItemText(hDlg, 111);
                break;
            case 107:
                T.Street = GetDlgItemText(hDlg, 107);
                break;
            case 105:
                T.City = GetDlgItemText(hDlg, 105);
                break;
            case 101: /* Cognome del tabbozzo */
                T.Cognome = GetDlgItemText(hDlg, 101);
                break;
            case QX_NOME: /* Nome del tabbozzo */
                T.Nome = GetDlgItemText(hDlg, QX_NOME);
                break;

            case IDOK:
            case IDCANCEL:
                SalvaTutto();
                EndDialog(hDlg, TRUE);
                return TRUE;

            default:
                return TRUE;
        }
    }

    return FALSE;
}

/********************************************************************/
/* Famiglia...                                                      */
/********************************************************************/

export async function Famiglia(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        SetDlgItemText(hDlg, 103, `Papa', mi dai ${MostraSoldi(100)} ?`);
        SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));
        SetDlgItemText(hDlg, 105, MostraSoldi(T.Paghetta));
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 101: /* Chiedi aumento paghetta */
                if (T.Studio > 40) {
                    // Paghetta e' un u_long: in C la sottrazione e' senza segno, e quando
                    // Paghetta supera Studio + Fortuna il risultato "gira" ed e' enorme.
                    if (((T.Studio - T.Paghetta + T.Fortuna) >>> 0) > 75 + random(50) && T.Paghetta < 96) {
                        await MessageBox(hDlg, `Va bene... ti daremo ${MostraSoldi(5)} di paghetta in piu'...`,
                            'Aumento paghetta !', MB_OK | MB_ICONINFORMATION);
                        T.Paghetta += 5;
                        await Evento(hDlg);
                    } else {
                        await MessageBox(hDlg,
                            "Vedi di scordartelo... Dovra' passare molto tempo prima che ti venga aumentata la paghetta...",
                            'Errore irrecuperabile', MB_OK | MB_ICONHAND);
                        await Evento(hDlg);
                    }
                } else {
                    await MessageBox(hDlg, 'Quando andrai meglio a scuola, forse...',
                        'Errore irrecuperabile', MB_OK | MB_ICONHAND);
                }
                SetDlgItemText(hDlg, 105, MostraSoldi(T.Paghetta));
                return TRUE;

            case 102: // Chiedi paghetta extra
                if (T.Studio >= 40) {
                    if (T.Attesa === 0) {
                        T.Attesa = ATTESAMAX;
                        T.Soldi += 10;
                        await Evento(hDlg);
                    } else {
                        await MessageBox(hDlg,
                            'Ma insomma ! Non puoi continuamente chiedere soldi ! Aspetta ancora qualche giorno. Fai qualche cosa di economico nel frattempo...',
                            'Non te li diamo', MB_OK | MB_ICONHAND);
                        await Evento(hDlg);
                    }
                } else {
                    await MessageBox(hDlg,
                        "Quando andrai meglio a scuola potrai tornare a chiederci dei soldi, non ora. " +
                        "Ma non lo sai che per la tua vita e' importante studiare, e dovresti impegnarti " +
                        `di piu, perche' quando ti impegni i risultati si vedono, solo che sei svogliat${T.ao} ` +
                        "e non fai mai nulla, mi ricordo che quando ero giovane io era tutta un altra cosa... " +
                        "allora si' che i giovani studiavano...",
                        'Errore irrecuperabile', MB_OK | MB_ICONHAND);
                }

                SetDlgItemText(hDlg, 104, MostraSoldi(T.Soldi));
                return TRUE;

            case 103: // Papa, mi dai 100000 lire ?
                if (T.sound_active) TabbozPlaySound(801);
                await MessageBox(hDlg, 'Non pensarci neanche lontanamente...',
                    'Errore irrecuperabile', MB_OK | MB_ICONHAND);
                await Evento(hDlg);
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

//*******************************************************************
// Compagnia...
//*******************************************************************

export async function Compagnia(hDlg, message, wParam) {
    if (message === WM_INITDIALOG) {
        SetDlgItemText(hDlg, 104, `${T.Reputazione}/100`);
        return TRUE;
    } else if (message === WM_COMMAND) {
        switch (LOWORD(wParam)) {
            case 101: { // Gareggia con lo scooter...
                if (T.ScooterData.stato <= 0) {
                    await MessageBox(hDlg, 'Con quale scooter vorresti gareggiare, visto che non lo possiedi ?',
                        'Gareggia con lo scooter', MB_OK | MB_ICONINFORMATION);
                    return TRUE;
                }
                if (T.ScooterData.attivita !== 1) {
                    await MessageBox(hDlg,
                        `Purtroppo non pui gareggiare visto che il tuo scooter e' ${n_attivita[T.ScooterData.attivita]}.`,
                        'Gareggia con lo scooter', MB_OK | MB_ICONINFORMATION);
                    return TRUE;
                }

                if (T.sound_active) TabbozPlaySound(701);
                const i = 1 + random(6); // 28 Aprile 1998 - (E' cambiato tutto cio' che riguarda gli scooter...)
                const i2 = await MessageBox(hDlg, `Accetti la sfida con un tabbozzo che ha un ${ScooterMem[i].nome} ?`,
                    'Gareggia con lo scooter', MB_YESNO | MB_ICONQUESTION);

                if (T.ScooterData.stato > 30) T.ScooterData.stato -= random(2);

                if (i2 === IDYES) {
                    if (ScooterMem[i].speed + 80 + random(40) > T.ScooterData.speed + T.ScooterData.stato + T.Fortuna) {
                        // perdi
                        if (T.Reputazione > 80) T.Reputazione -= 3;
                        if (T.Reputazione > 10) T.Reputazione -= 2;
                        await MessageBox(hDlg, "Dopo pochi metri si vede l' inferiorita' del tuo scooter...",
                            'Hai perso', MB_OK | MB_ICONSTOP);
                    } else {
                        // vinci
                        T.Reputazione += 10;
                        if (T.Reputazione > 100) T.Reputazione = 100;
                        await MessageBox(hDlg, "Con il tuo scooter, bruci l' avversario in partenza...",
                            'Hai vinto', MB_OK | MB_ICONINFORMATION);
                    }
                } else {
                    if (T.Reputazione > 80) T.Reputazione -= 3; // Se non accetti la sfida, perdi rep...
                    if (T.Reputazione > 10) T.Reputazione -= 2;
                }
                T.benzina -= 5;
                if (T.benzina < 1) T.benzina = 0;
                T.showscooter = 0;
                await CalcolaVelocita(hDlg);

                await Evento(hDlg);
                SetDlgItemText(hDlg, 104, `${T.Reputazione}/100`);
                return TRUE;
            }

            case 102:
                // Uscendo con la propria compagnia si puo' arrivare
                // solamente a reputazione = 57
                if (T.Reputazione < 57) T.Reputazione += 1;
                if (T.Reputazione < 37) T.Reputazione += 1; // Se la rep e' bassa, sale + in fretta
                if (T.Reputazione < 12) T.Reputazione += 1;

                await Evento(hDlg);
                EndDialog(hDlg, TRUE);
                return TRUE;

            case 103: /* 12 Giugno 1998 - Qualche mese dopo gli altri pulsanti della finestra... */
                if (T.Reputazione < 16) {
                    await MessageBox(hDlg,
                        'Con la scarsa reputazione che hai, tutti trovano qualcosa di meglio da fare piuttosto che venire.',
                        'Chiama la Compagnia', MB_OK | MB_ICONSTOP);
                    await Evento(hDlg);
                    return TRUE;
                }
                if (T.Tempo_trascorso_dal_pestaggio > 0) {
                    if (random(2) === 1) {
                        await MessageBox(hDlg,
                            "Dopo aver visto i tuoi amici, chi ti ha picchiato non si fara' piu' vedere in giro x un bel pezzo...",
                            'Chiama la Compagnia', MB_OK | MB_ICONINFORMATION);
                        if (T.Reputazione < 80) T.Reputazione += 3;
                    } else {
                        await MessageBox(hDlg,
                            "Anche i tuoi amici, al gran completo, vengono sacagnati di botte da chi ti aveva picchiato, accorgendosi cosi' che non sei solo tu ad essere una chiavica, ma lo sono anche loro...",
                            'Chiama la Compagnia', MB_OK | MB_ICONINFORMATION);
                        if (T.Reputazione < 95) T.Reputazione += 5;
                    }
                    await Evento(hDlg);
                } else {
                    await MessageBox(hDlg, "Visto che non c'e' nessuno da minacciare, tutti se ne vanno avviliti...",
                        "Chiama la Compagnia (perche'?)", MB_OK | MB_ICONSTOP);
                }
                SetDlgItemText(hDlg, 104, `${T.Reputazione}/100`);
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

//*******************************************************************
// Nomoney...
//*******************************************************************

export async function nomoney(parent, tipo) {
    switch (tipo) {
        case DISCO:
            await MessageBox(parent,
                `Appena entrat${T.ao} ti accorgi di non avere abbastanza soldi per pagare il biglietto.\n Un energumeno buttafuori ti deposita gentilmente in un cassonetto della spazzatura poco distante dalla discoteca.`,
                'Bella figura', MB_OK | MB_ICONSTOP);
            if (T.Reputazione > 3) T.Reputazione -= 1;
            break;
        case VESTITI:
            await MessageBox(parent, `Con cosa avresti intenzione di pagare, stronzett${T.ao} ??? Caramelle ???`,
                'Bella figura', MB_OK | MB_ICONSTOP);
            if (T.Fama > 12) T.Fama -= 3;
            if (T.Reputazione > 4) T.Reputazione -= 2;
            break;
        case PALESTRA:
            if (T.sesso === 'M') {
                await MessageBox(parent,
                    "L' enorme istruttore di bodybulding ultra-palestrato ti suona come una zampogna e ti scaraventa fuori dalla palestra.",
                    'Non hai abbastanza soldi...', MB_OK | MB_ICONSTOP);
            } else {
                await MessageBox(parent,
                    "L' enorme istruttore di bodybulding ultra-palestrato ti scaraventa fuori dalla palestra.",
                    'Non hai abbastanza soldi...', MB_OK | MB_ICONSTOP);
            }
            if (T.Fama > 14) T.Fama -= 4; /* Ah,ah ! fino al 10 Jan 1999 c'era scrittto Reputazione-=4... */
            if (T.Reputazione > 18) T.Reputazione -= 4;
            break;
        case SCOOTER:
            if (T.sesso === 'M') {
                await MessageBox(parent,
                    "L' enorme meccanico ti affera con una sola mano, ti riempe di pugni, e non esita a scaraventare te ed il tuo motorino fuori dall' officina.",
                    'Non hai abbastanza soldi', MB_OK | MB_ICONSTOP);
                if (T.Reputazione > 7) T.Reputazione -= 5;
                if (T.ScooterData.stato > 7) T.ScooterData.stato -= 5;
            } else {
                await MessageBox(parent, "Con un sonoro calcio nel culo, vieni buttata fuori dall' officina.",
                    'Non hai abbastanza soldi', MB_OK | MB_ICONSTOP);
                if (T.Reputazione > 6) T.Reputazione -= 4;
                if (T.Fama > 3) T.Fama -= 2;
            }
            break;
        case TABACCAIO:
            await MessageBox(parent,
                `Fai fuori dal mio locale, brut${T.ao} pezzente !, esclama il tabaccaio con un AK 47 in mano...`,
                'Non hai abbastanza soldi...', MB_OK | MB_ICONSTOP);
            if (T.Fama > 2) T.Fama -= 1;
            break;
        case CELLULRABBONAM:
            await MessageBox(parent, `Forse non ti sei accorto di non avere abbastanza soldi, stronzett${T.ao}...`,
                'Non hai abbastanza soldi...', MB_OK | MB_ICONSTOP);
            if (T.Fama > 2) T.Fama -= 1;
            break;
    }
}

//*******************************************************************
// Aggiorna la finestra principale
//*******************************************************************

export function AggiornaPrincipale(parent) {
    ShowWindow(parent, SW_SHOWNORMAL);

    SetDlgItemText(parent, QX_NOME, `${T.Nome} ${T.Cognome}`);
    SetDlgItemText(parent, QX_SOLDI, MostraSoldi(T.Soldi));
    SetDlgItemText(parent, 151, `${T.Fama}/100`); // Figosita'
    SetDlgItemText(parent, 152, `${T.Reputazione}/100`); // Reputazione
    SetDlgItemText(parent, 153, `${T.Studio}/100`); // Profitto scolastico

    if (T.Rapporti !== 0) {
        SetDlgItemText(parent, 155, T.Nometipa); // Nometipa
        SetDlgItemText(parent, 154, `${T.Rapporti}/100`); // Rapporti con la tipa
    } else {
        SetDlgItemText(parent, 155, ' ');
        SetDlgItemText(parent, 154, ' ');
    }

    if (T.ScooterData.stato !== -1) {
        SetDlgItemText(parent, 150, T.ScooterData.nome); // Nomescooter
        SetDlgItemText(parent, 156, `${T.ScooterData.stato}/100`); // Stato scooter
    } else {
        SetDlgItemText(parent, 150, ' ');
        SetDlgItemText(parent, 156, ' ');
    }

    SetDlgItemText(parent, 157,
        `${InfoSettimana[T.x_giornoset - 1].nome} ${T.x_giorno} ${InfoMese[T.x_mese - 1].nome}`); // Calendario

    const menu = GetMenu(parent);
    DeleteMenu(menu, QX_TIPA, MF_BYCOMMAND);
    if (T.sesso === 'M') {
        // Non usare la variabile "ao" xche' qui e' necessario
        AppendMenu(GetSubMenu(menu, 1), MF_STRING, QX_TIPA, '&Tipa...');
        SetDlgItemText(parent, 133, 'Tipa'); // che ci sia scritto Tipa x il maschietto e
        SetDlgItemText(parent, 170, 'Rapporto con la tipa');
    } else {
        //  Tipo x la femminuccia...
        AppendMenu(GetSubMenu(menu, 1), MF_STRING, QX_TIPA, '&Tipo...');
        SetDlgItemText(parent, 133, 'Tipo');
        SetDlgItemText(parent, 170, 'Rapporto con il tipo');
    }
    DrawMenuBar(parent);
}

//*******************************************************************
// TabbozWndProc - la finestra principale
//*******************************************************************

// Apre una finestra "di attivita'": la principale si nasconde finche' resta aperta.
async function Attivita(hWnd, id, proc) {
    ShowWindow(hWnd, SW_HIDE);
    await DialogBox(hInst, id, hWnd, proc);
    AggiornaPrincipale(hWnd);
}

export async function TabbozWndProc(hWnd, message, wParam) {
    switch (message) {
        case WM_SYSCOMMAND:
            switch (LOWORD(wParam)) {
                case QX_ABOUT:
                    /* Display about box. */
                    await DialogBox(hInst, ABOUT, hWnd, About);
                    AggiornaPrincipale(hWnd);
                    return TRUE;

                case SC_CLOSE:
                    await DialogBox(hInst, SPEGNIMI, hWnd, Spegnimi);
                    if (T.boolean_shutdown !== 0) EndDialog(hWnd, TRUE); // Chiudi la baracca...
                    return TRUE;
            }
            return FALSE;

        case WM_INITDIALOG:
            T.hWndMain = hWnd;

            // Il menu' File (Apri, Salva con nome, Chiudi) e' arrivato con la 0.92; le risorse
            // della 0.9beta non ce l'hanno, quindi lo aggiungiamo qui.
            const file = CreatePopupMenu();
            AppendMenu(file, MF_STRING, QX_LOAD, '&Apri...');
            AppendMenu(file, MF_STRING, QX_SAVE, '&Salva con nome...');
            AppendMenu(file, MF_SEPARATOR, 0, null);
            AppendMenu(file, MF_STRING, QX_CLOSE, '&Chiudi...');
            InsertMenu(GetMenu(hWnd), 0, MF_BYPOSITION | MF_POPUP, file, '&File');

            // Scrive quanti soldi ci sono... ( ed ora scrive anche molta altra roba...)
            AggiornaPrincipale(hWnd);

            /* 11 Jun 98 - Modifika il menu' di sistema... */
            AppendMenu(GetSystemMenu(hWnd, 0), MF_SEPARATOR, 0, null);
            AppendMenu(GetSystemMenu(hWnd, 0), MF_STRING, QX_ABOUT, '&About Tabboz Simulator...');

            /* Inizio implementazione timer: 9 giugno 1998 */
            SetTimer(hWnd, WM_TIMER, 60000); /* 60 secondi.. */
            t_random = 1;

            T.fase_di_avvio = 0; /* 11 Giugno 1998 */
            T.TabbozRedraw = 1;
            return TRUE;

        case WM_TIMER:
            if (T.timer_active === 1) {
                /* Il timer viene contollato SOLO se la finestra e' ridotta ad ICONA */
                if (IsIconic(T.hWndMain) !== 0) {
                    if (t_random > 0) {
                        /* Per un altro minuto siamo a posto... */
                        t_random--;
                        break;
                    }
                    t_random = 1;

                    KillTimer(hWnd, WM_TIMER); /* Distrugge il timer... */
                    ShowWindow(T.hWndMain, SW_SHOWNORMAL); /* Ingrandisce la finestra */
                    await Giorno(hWnd);
                    AggiornaPrincipale(hWnd);
                    SalvaTutto();

                    SetTimer(hWnd, WM_TIMER, 60000);
                }
            }
            return TRUE;

        case WM_COMMAND:
            switch (LOWORD(wParam)) {
                case QX_LOAD:
                    await OpenFileDlg(hWnd);
                    InvalidateRect(hWnd); // il tabbozzo caricato puo' essere vestito diversamente
                    AggiornaPrincipale(hWnd);
                    break;

                case QX_SAVE:
                    await SaveFileDlg(hWnd);
                    AggiornaPrincipale(hWnd);
                    break;

                case QX_CLOSE:
                    await DialogBox(hInst, SPEGNIMI, hWnd, Spegnimi);
                    if (T.boolean_shutdown !== 0) EndDialog(hWnd, TRUE); // Chiudi la baracca...
                    return TRUE;

                case QX_ABOUT:
                    await DialogBox(hInst, ABOUT, hWnd, About);
                    AggiornaPrincipale(hWnd);
                    break;

                case QX_LOGO:
                    await DialogBox(hInst, LOGO, hWnd, Logo);
                    AggiornaPrincipale(hWnd);
                    break;

                case QX_CONFIG:
                    await DialogBox(hInst, CONFIGURATION, hWnd, Configuration);
                    AggiornaPrincipale(hWnd);
                    break;

                case QX_INFO:
                    await DialogBox(hInst, PERSONALINFO, hWnd, PersonalInfo);
                    AggiornaPrincipale(hWnd);
                    break;

                case QX_FAMIGLIA:
                    await Attivita(hWnd, FAMIGLIA, Famiglia);
                    break;
                case QX_DISCO:
                    await Attivita(hWnd, DISCO, Disco);
                    break;
                case QX_COMPAGNIA:
                    await Attivita(hWnd, COMPAGNIA, Compagnia);
                    break;
                case QX_SCUOLA:
                    if (T.x_vacanza === 0) {
                        await Attivita(hWnd, SCUOLA, Scuola);
                    } else {
                        await MessageBox(hWnd, 'Non puoi andare a scuola in un giorno di vacanza !',
                            'Scuola', MB_OK | MB_ICONINFORMATION);
                    }
                    break;
                case QX_SCOOTER:
                    await Attivita(hWnd, SCOOTER, Scooter);
                    break;
                case QX_VESTITI:
                    await Attivita(hWnd, VESTITI, Vestiti);
                    break;
                case QX_TABACCHI:
                    ShowWindow(hWnd, SW_HIDE);
                    await RunTabacchi(hWnd);
                    AggiornaPrincipale(hWnd);
                    break;
                case QX_PALESTRA:
                    ShowWindow(hWnd, SW_HIDE);
                    await RunPalestra(hWnd);
                    AggiornaPrincipale(hWnd);
                    break;
                case QX_CELLULAR: // 31 Marzo 1999
                    await Attivita(hWnd, CELLULAR, Cellular);
                    break;
                case QX_VESTITI1:
                case QX_VESTITI2:
                case QX_VESTITI3:
                case QX_VESTITI4:
                case QX_VESTITI5:
                    ShowWindow(hWnd, SW_HIDE);
                    await RunVestiti(hWnd, LOWORD(wParam) - QX_VESTITI1 + BAUHOUSE);
                    AggiornaPrincipale(hWnd);
                    break;
                case QX_TIPA:
                    await Attivita(hWnd, T.sesso === 'M' ? TIPA : 190, Tipa);
                    break;
                case QX_LAVORO:
                    await Attivita(hWnd, LAVORO, Lavoro);
                    break;
                default:
                    break;
            }
            SalvaTutto();
            break;
    }

    return FALSE;
}

//*******************************************************************

export function MostraSoldi(i) {
    if (T.euro) return `${Math.trunc(i / 2)}e`;
    if (i === 0) return '0 L.';
    return `${i}000 L.`;
}

/*********************************************************************/

export async function Atinom(hInstance) {
    await MessageBox(hInstance,
        "Il biglietto e' valido solo dopo la convalida.Il biglietto deve essere conservato per tutta la durata " +
        'del viaggio. Il diritto a viaggiare cessa al termine della tratta corrispondente al valore del biglietto. ' +
        'Il passeggero che al controllo non fosse in grado di presentare il biglietto o lo presentasse irriconoscibile, ' +
        "o comunque non valido, verra' abbattuto. La notifica del decesso verra' inviata ai parenti solo previo pagamento " +
        'delle spese postali.',
        'Norme di utilizzo', MB_OK | MB_ICONINFORMATION);
}

/*********************************************************************/

export function vvc(i) {
    /* 15 Giugno 1998 - v0.7.1 - Verifica Valori Chiave */
    if (i < 0) return 0;
    if (i > 100) return 100;
    return i;
}

//*******************************************************************
// Dialog x la scelta del file da aprire...
//*******************************************************************

const TBZ = { filter: '.tbz', description: 'Tabboz Files (*.tbz)' };

export async function OpenFileDlg(hwnd) {
    const file = await GetOpenFileName(TBZ);
    if (!file) return;

    const profilo = LeggiProfilo(DecodificaAnsi(file.bytes));
    if (!profilo || !profilo.has('city')) {
        // senza questo controllo CaricaTutto prenderebbe il file per un primo avvio e resetterebbe tutto
        await MessageBox(hwnd, `${file.name}\n\nQuesto file non e' un salvataggio del Tabboz Simulator.`,
            'Apri', MB_OK | MB_ICONSTOP);
        return;
    }

    // Come in InitTabboz: senza questo, dopo un primo avvio firsttime resta a 1 e CaricaTutto
    // azzera il tabbozzo invece di caricarlo (il bug c'era gia' nella 0.92).
    T.firsttime = 0;
    UsaProfilo(profilo);
    try {
        await CaricaTutto();
    } finally {
        UsaProfilo(null);
    }
    T.TabbozRedraw = 1;
}

//*******************************************************************
// Dialog x la scelta del file da salvare...
//*******************************************************************

export async function SaveFileDlg(hwnd) {
    const nome = `${T.Nome} ${T.Cognome}`.replace(/[\\/:*?"<>|]/g, '').trim() || 'Tabboz';
    const file = await GetSaveFileName({ ...TBZ, suggestedName: `${nome}.tbz` });
    if (!file) return;

    const profilo = new Map();
    UsaProfilo(profilo);
    try {
        SalvaTutto();
    } finally {
        UsaProfilo(null);
    }
    try {
        await file.write(CodificaAnsi(ScriviProfilo(profilo)));
    } catch {
        await MessageBox(hwnd, `Impossibile salvare ${file.name}.`, 'Salva con nome', MB_OK | MB_ICONSTOP);
    }
}

//*******************************************************************
// PROCEDURA PRINCIPALE

export async function WinMain() {
    /* Inizializza il programma */
    await InitTabboz();

    /* Finestra principale */
    await DialogBox(hInst, MAIN, null, TabbozWndProc);

    /* Chiusura */
    FineProgramma();
    return T.boolean_shutdown;
}

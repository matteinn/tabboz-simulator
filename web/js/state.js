// Global state of the Tabboz Simulator.
//
// The C code keeps everything in globals shared through zarrosim.h; here they live on T,
// so every module reads and writes the same values (T.Soldi, T.Reputazione, ...).

export const VERSION = 'Version 0.92q';
export const BUILD_DATE = 'Web edition';

export const ATTESAMAX = 5;

// Dialog resource IDs (zarrosim.h)
export const MAIN = 1;
export const ABOUT = 2;
export const DISCO = 4;
export const FAMIGLIA = 5;
export const COMPAGNIA = 6;
export const SCOOTER = 7;
export const VESTITI = 8;
export const TIPA = 9;
export const SCUOLA = 10;
export const PERSONALINFO = 11;
export const LOGO = 12;
export const LAVORO = 13;
export const CONFIGURATION = 14;
export const FORMAT = 15;
export const SPEGNIMI = 16;

export const ACQUISTASCOOTER = 70;
export const VENDISCOOTER = 71;
export const RIPARASCOOTER = 72;
export const TAROCCASCOOTER = 73;

export const BAUHOUSE = 80;
export const ZOCCOLARO = 81;
export const FOOTSMOCKER = 82;
export const ALTRIVESTITI4 = 83;
export const ALTRIVESTITI5 = 84;
export const ALTRIVESTITI6 = 85;

export const TABACCAIO = 88;
export const PALESTRA = 89;

export const CERCATIPA = 91;
export const LASCIATIPA = 92;
export const ESCICONLATIPA = 93;
export const DUEDIPICCHE = 95;

export const CELLULAR = 120;
export const COMPRACELLULAR = 121;
export const VENDICELLULAR = 122;
export const CELLULRABBONAM = 123;

// Menu / button command IDs (zarrosim.h)
export const QX_NOME = 102;
export const QX_BMP = 103;
export const QX_SOLDI = 105;
export const QX_LOAD = 106;
export const QX_SAVE = 107;
export const QX_CLOSE = 108;
export const QX_ABOUT = 120;
export const QX_LOGO = 121;
export const QX_SCOOTER = 130;
export const QX_VESTITI = 131;
export const QX_DISCO = 132;
export const QX_TIPA = 133;
export const QX_COMPAGNIA = 134;
export const QX_FAMIGLIA = 135;
export const QX_SCUOLA = 136;
export const QX_LAVORO = 137;
export const QX_INFO = 139;
export const QX_CONFIG = 140;
export const QX_TABACCHI = 141;
export const QX_PALESTRA = 142;
export const QX_VESTITI1 = 143;
export const QX_VESTITI2 = 144;
export const QX_VESTITI3 = 145;
export const QX_VESTITI4 = 146;
export const QX_VESTITI5 = 147;
export const QX_CELLULAR = 155;

// NEWSTSCOOTER
export function newScooter(speed, marmitta, carburatore, cc, filtro, prezzo, attivita, stato, nome, fama) {
    return { speed, marmitta, carburatore, cc, filtro, prezzo, attivita, stato, nome, fama };
}

// STCEL
export function newCellular(dual, fama, stato, prezzo, nome) {
    return { dual, fama, stato, prezzo, nome };
}

// STABB
export function newAbbonamento(abbonamento, dualonly, creditorest, fama, prezzo, nome) {
    return { abbonamento, dualonly, creditorest, fama, prezzo, nome };
}

export const T = {
    // generic
    cheat: 0,
    scelta: 0,
    Andrea: '',
    Caccia: '',
    Daniele: '',
    Obscured: '',
    firsttime: 0,
    ImgSelector: 0,
    TabbozRedraw: 0,
    ScuolaRedraw: 0,
    showscooter: 0,
    hWndMain: null,

    // character
    Attesa: 0,
    Fama: 0,
    Reputazione: 0,
    Studio: 0,
    Soldi: 0, // u_long
    Paghetta: 0, // u_long
    Nome: '',
    Cognome: '',
    Nometipa: '',
    City: '',
    Residenza: '',
    Street: '',
    FigTipa: 0,
    Rapporti: 0,
    Stato: 0,
    DDP: 0, // u_long
    Fortuna: 0,
    sizze: 0,
    Tempo_trascorso_dal_pestaggio: 0,
    current_testa: 0,
    current_gibbotto: 0,
    current_pantaloni: 0,
    current_scarpe: 0,
    current_tipa: 0,

    comp_giorno: 0,
    comp_mese: 0,

    timer_active: 1,
    fase_di_avvio: 1,
    sound_active: 1,
    euro: 0,
    sesso: 'M',
    ao: 'o',
    un_una: 'un',
    STARTcmdShow: 1,
    boolean_shutdown: 0,
    debug_active: 0,

    // lavoro.c
    numeroditta: 0,
    impegno: 0,
    stipendio: 0,
    giorni_di_lavoro: 0,

    // scooter.c
    benzina: 0,
    antifurto: 0,
    ScooterData: newScooter(0, 0, 0, 0, 0, 0, 0, -1, 'nessuno', 0),

    // telefono.c
    CellularData: newCellular(0, 0, -1, 0, ''),
    AbbonamentData: newAbbonamento(0, 0, -1, 0, 0, ''),

    // tempo.c
    x_giorno: 30,
    x_mese: 9,
    x_giornoset: 1,
    x_vacanza: 0,
    x_anno_bisesto: 0,
    scad_pal_giorno: 0,
    scad_pal_mese: 0,

    // tipa.c (shared with eventi.c and tabimg.c)
    figTemp: 0,
    nomeTemp: '',
    tipahDlg: null,
};

// Borland C random(n): an integer in [0, n)
export function random(n) {
    return Math.trunc(Math.random() * n);
}

// C atoi/atol: leading integer of the string, 0 if there is none
export function atoi(s) {
    const n = parseInt(String(s ?? '').trim(), 10);
    return Number.isNaN(n) ? 0 : n;
}

export const atol = atoi;

// C integer division
export function idiv(a, b) {
    return Math.trunc(a / b);
}

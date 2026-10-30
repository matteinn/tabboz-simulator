// Tabboz Simulator
// Copyright (c) 1997-2000 Andrea Bonomi
//
// Port of tabimg.c: the picture of the tabbozzo (BMPView) and of the tipa (BMPTipa).
// Released under the GNU General Public License v3 or later.

import {
    BeginPaint, DialogBox, EndPaint, HIWORD, LOWORD, LoadBitmap, LoadCursor, LoadTransparentBitmap,
    MB_ICONINFORMATION, MB_ICONQUESTION, MB_OK, MessageBox, RegisterClass, SetWindowPos, SWP_NOMOVE,
    SWP_NOZORDER, WM_CREATE, WM_LBUTTONDOWN, WM_PAINT, hInst,
} from '../win32.js';
import { PERSONALINFO, T } from '../state.js';
import { TabbozPlaySound } from './readkey.js';
import { AggiornaPrincipale, PersonalInfo } from './zarrosim.js';
import { Giorno } from './tempo.js';
import { AggiornaTipa } from './tipa.js';

const IMG_SIZEX = 143;
const IMG_SIZEY = 275;
const IMG_X_INC = 10;
const IMG_Y_INC = 0;

const GIALLO = [255, 255, 0]; // il colore trasparente dei pezzi del tabbozzo

/*********************************************************************/
// WM_PAINT handler for BMPView

let paintSerial = 0;

async function WMPaint(hwnd) {
    const serial = ++paintSerial;
    T.TabbozRedraw = 0;

    let ids;
    if (T.sesso === 'M') {
        ids = {
            sfondo: 1560,
            pantaloni: T.current_pantaloni + 1520,
            scarpe: T.current_scarpe + 1540,
            giubbotto: T.current_gibbotto + 1500,
            testa: T.current_testa + 1390,
        };
    } else {
        ids = {
            sfondo: 1561,
            pantaloni: T.current_pantaloni + 1525,
            scarpe: T.current_scarpe + 1540,
            giubbotto: T.current_gibbotto + 1507,
            testa: T.current_testa + 1370,
        };
    }

    const entries = await Promise.all(
        Object.entries(ids).map(async ([k, id]) => [k, await LoadTransparentBitmap(id, GIALLO)]),
    );
    if (serial !== paintSerial) return 0; // nel frattempo e' partito un altro disegno
    const bmp = Object.fromEntries(entries);

    SetWindowPos(hwnd, null, 0, 0, IMG_SIZEX, IMG_SIZEY, SWP_NOMOVE | SWP_NOZORDER);
    const hdc = BeginPaint(hwnd);
    hdc.fillStyle = '#c0c0c0'; // (HBRUSH)COLOR_WINDOW e' il pennello di COLOR_MENU
    hdc.fillRect(0, 0, IMG_SIZEX, IMG_SIZEY);

    // Mantenere l' ordine !!!
    const draw = (img, x, y) => img && hdc.drawImage(img, x, y);
    draw(bmp.sfondo, 0, 0);

    if (T.sesso === 'M') draw(bmp.pantaloni, 18 + IMG_X_INC, 93 + IMG_Y_INC);
    else draw(bmp.pantaloni, 23 + IMG_X_INC, 120 + IMG_Y_INC);

    draw(bmp.scarpe, -16 + IMG_X_INC, 205 + IMG_Y_INC);

    if (T.sesso === 'M') {
        draw(bmp.giubbotto, -30 + IMG_X_INC, 18 + IMG_Y_INC);
        draw(bmp.testa, 32 + IMG_X_INC, 3 + IMG_Y_INC);
    } else {
        draw(bmp.giubbotto, -27 + IMG_X_INC, 39 + IMG_Y_INC);
        draw(bmp.testa, 30 + IMG_X_INC, 1 + IMG_Y_INC);
    }

    EndPaint(hwnd);
    return 0;
}

/*********************************************************************/
// Classe BMPView

export async function BMPViewWndProc(hWnd, msg) {
    switch (msg) {
        case WM_CREATE:
            return 0;
        case WM_PAINT:
            return WMPaint(hWnd);
        case WM_LBUTTONDOWN:
            /* Display Personal Information box. */
            await DialogBox(hInst, PERSONALINFO, hWnd.dlg, PersonalInfo);
            AggiornaPrincipale(T.hWndMain);
            return 0;
    }
    return 0;
}

/*********************************************************************/
// Registra la Classe BMPView

export function RegisterBMPViewClass() {
    return RegisterClass({ lpszClassName: 'BMPView', lpfnWndProc: BMPViewWndProc });
}

/*********************************************************************/
// Questa parte si okkupa del disegno della tipa... 6 Maggio 1999

async function WMTipaPaint(hwnd) {
    const hbmp = await LoadBitmap(hInst, T.current_tipa + 1204);
    if (!hbmp) return 0;
    SetWindowPos(hwnd, null, 0, 0, hbmp.naturalWidth, hbmp.naturalHeight, SWP_NOMOVE | SWP_NOZORDER);
    const hdc = BeginPaint(hwnd);
    hdc.drawImage(hbmp, 0, 0);
    EndPaint(hwnd);
    return 0;
}

/*********************************************************************/
// Classe BMPTipa

export async function BMPTipaWndProc(hWnd, msg, wParam, lParam) {
    switch (msg) {
        case WM_CREATE:
            return 0;
        case WM_PAINT:
            return WMTipaPaint(hWnd);
        case WM_LBUTTONDOWN: {
            const x = LOWORD(lParam);
            const y = HIWORD(lParam);
            if ((x >= 138 && x <= 170 && y >= 50 && y <= 65) || // Coordinate Tette
                (x >= 104 && x <= 136 && y >= 78 && y <= 166)) { // Coordinate Culo
                // Palpatina...
                if (T.Rapporti < 0) {
                    // niente
                } else if (T.Rapporti < 20 + Math.trunc(T.FigTipa / 2)) {
                    // + e' figa, - te la da' (perla di saggezza)
                    if (T.sound_active) TabbozPlaySound(604);
                    await MessageBox(hWnd.dlg, 'Brutto porco, che cazzo tocchi ?', 'Palpatina...', MB_OK);
                    if (T.Rapporti > 5) T.Rapporti -= 3;
                    AggiornaTipa(T.tipahDlg);
                } else if (T.Rapporti < 30 + Math.trunc(T.FigTipa / 2)) {
                    await MessageBox(hWnd.dlg, 'Dai, smettila... Voi uomini pensato solo a quello...',
                        'Palpatina...', MB_OK | MB_ICONQUESTION);
                } else {
                    await MessageBox(hWnd.dlg, 'Mmhhhhhhhh.........', 'Palpatina...', MB_OK | MB_ICONINFORMATION);
                    await Giorno(hWnd.dlg);
                    AggiornaTipa(T.tipahDlg);
                }
            }
            return 0;
        }
    }
    return 0;
}

/*********************************************************************/
// Registra la Classe BMPTipa

export function RegisterBMPTipaClass() {
    return RegisterClass({ lpszClassName: 'BMPTipa', lpfnWndProc: BMPTipaWndProc, hCursor: LoadCursor(hInst, '10') });
}

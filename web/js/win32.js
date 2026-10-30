// A small slice of the Win32 API, just enough to run the original Tabboz Simulator
// dialog procedures in the browser.
//
// Dialogs are rendered from the templates extracted from tabboz.exe. Calls that block in
// Win32 (DialogBox, MessageBox) return promises here, so ported code awaits them.

export let RES = null;

// Pixels per dialog unit. The 10pt dialogs come out at 8x16 base units (their bitmaps fit
// exactly at 2px per unit); the 8pt MS Sans Serif ones use the usual 6x13.
function dialogUnits(tpl) {
    return tpl.fontSize === 8 ? { x: 1.5, y: 1.625, font: 11 } : { x: 2, y: 2, font: 12 };
}

// ---------------------------------------------------------------------------------------
// Constants

export const TRUE = 1;
export const FALSE = 0;

export const WM_CREATE = 0x0001;
export const WM_DESTROY = 0x0002;
export const WM_PAINT = 0x000f;
export const WM_INITDIALOG = 0x0110;
export const WM_COMMAND = 0x0111;
export const WM_SYSCOMMAND = 0x0112;
export const WM_TIMER = 0x0113;
export const WM_LBUTTONDOWN = 0x0201;

export const SC_MINIMIZE = 0xf020;
export const SC_CLOSE = 0xf060;

export const IDOK = 1;
export const IDCANCEL = 2;
export const IDABORT = 3;
export const IDRETRY = 4;
export const IDIGNORE = 5;
export const IDYES = 6;
export const IDNO = 7;

export const MB_OK = 0x00;
export const MB_OKCANCEL = 0x01;
export const MB_YESNOCANCEL = 0x03;
export const MB_YESNO = 0x04;
export const MB_ICONHAND = 0x10;
export const MB_ICONSTOP = 0x10;
export const MB_ICONERROR = 0x10;
export const MB_ICONQUESTION = 0x20;
export const MB_ICONEXCLAMATION = 0x30;
export const MB_ICONINFORMATION = 0x40;

export const BM_GETCHECK = 0x00f0;
export const BM_SETCHECK = 0x00f1;
export const BST_UNCHECKED = 0;
export const BST_CHECKED = 1;

export const EN_CHANGE = 0x0300;

export const CB_ADDSTRING = 0x0143;
export const CB_GETCURSEL = 0x0147;
export const CB_RESETCONTENT = 0x014b;
export const CB_SETCURSEL = 0x014e;

export const LB_ADDSTRING = 0x0180;
export const LB_RESETCONTENT = 0x0184;
export const LB_SETCURSEL = 0x0186;
export const LB_GETCURSEL = 0x0188;

export const PBM_SETRANGE = 0x0401;
export const PBM_SETPOS = 0x0402;

export const SW_HIDE = 0;
export const SW_SHOWNORMAL = 1;
export const SW_SHOWMINIMIZED = 2;
export const SW_SHOW = 5;
export const SW_MINIMIZE = 6;
export const SW_RESTORE = 9;

export const MF_BYCOMMAND = 0x0000;
export const MF_STRING = 0x0000;
export const MF_GRAYED = 0x0001;
export const MF_DISABLED = 0x0002;
export const MF_CHECKED = 0x0008;
export const MF_POPUP = 0x0010;
export const MF_BYPOSITION = 0x0400;
export const MF_SEPARATOR = 0x0800;
export const MF_HELP = 0x4000;

export const SWP_NOSIZE = 0x0001;
export const SWP_NOMOVE = 0x0002;
export const SWP_NOZORDER = 0x0004;

const WS_BORDER = 0x00800000;
const WS_EX_CLIENTEDGE = 0x00000200;
const WS_DISABLED = 0x08000000;
const WS_VISIBLE = 0x10000000;
const WS_GROUP = 0x00020000;
const WS_TABSTOP = 0x00010000;
const WS_MINIMIZEBOX = 0x00020000;
const WS_SYSMENU = 0x00080000;
const WS_CAPTION = 0x00c00000;
const DS_CONTEXTHELP = 0x2000;

export const hInst = 'tabboz';
export const MAKEINTRESOURCE = (id) => id;
export const MakeProcInstance = (proc) => proc;
export const FreeProcInstance = () => {};
export const LOWORD = (l) => l & 0xffff;
export const HIWORD = (l) => (l >>> 16) & 0xffff;
export const MAKELONG = (lo, hi) => ((lo & 0xffff) | ((hi & 0xffff) << 16)) >>> 0;

// ---------------------------------------------------------------------------------------
// Resources

export async function LoadResources(url = 'res/resources.json') {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Cannot load ${url}: ${response.status}`);
    RES = await response.json();
    return RES;
}

export function LoadString(_hInst, id) {
    return RES.strings[id] ?? '';
}

const bitmapCache = new Map();

export function bitmapUrl(id) {
    return `res/bmp/${id}.png`;
}

export function HasBitmap(id) {
    return Object.prototype.hasOwnProperty.call(RES.bitmaps, id);
}

// Resolves to an HTMLImageElement, or null when the bitmap does not exist.
export function LoadBitmap(_hInst, id) {
    if (!HasBitmap(id)) return Promise.resolve(null);
    if (!bitmapCache.has(id)) {
        bitmapCache.set(id, new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = bitmapUrl(id);
        }));
    }
    return bitmapCache.get(id);
}

const keyedCache = new Map();

// The bitmap with one color made transparent, as the original CreateTransparentMask did.
export async function LoadTransparentBitmap(id, [r, g, b]) {
    const key = `${id}/${r},${g},${b}`;
    if (!keyedCache.has(key)) {
        keyedCache.set(key, LoadBitmap(hInst, id).then((img) => {
            if (!img) return null;
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const px = data.data;
            for (let i = 0; i < px.length; i += 4) {
                if (px[i] === r && px[i + 1] === g && px[i + 2] === b) px[i + 3] = 0;
            }
            ctx.putImageData(data, 0, 0);
            return canvas;
        }));
    }
    return keyedCache.get(key);
}

export function iconUrl(name) {
    return `res/icons/${String(name).toUpperCase()}.png`;
}

export function cursorCss(name) {
    const hotspot = RES.cursors[name];
    if (!hotspot) return 'default';
    return `url(res/cursors/${name}.png) ${hotspot[0]} ${hotspot[1]}, pointer`;
}

// ---------------------------------------------------------------------------------------
// Sounds

let currentSound = null;

export function PlayWave(number) {
    if (!RES.sounds.includes(number)) return;
    StopSounds();
    currentSound = new Audio(`res/wav/tabs${String(number).padStart(4, '0')}.wav`);
    currentSound.play().catch(() => {});
}

export function StopSounds() {
    if (currentSound) {
        currentSound.pause();
        currentSound = null;
    }
}

// ---------------------------------------------------------------------------------------
// Window manager

const desktop = () => document.getElementById('desktop');
const stack = []; // open top-level windows, topmost last
let blocker = null;
let taskbarHooks = null;

export function SetTaskbarHooks(hooks) {
    taskbarHooks = hooks;
}

function restack() {
    stack.forEach((w, i) => {
        w.frame.style.zIndex = String(10 + i * 2);
        w.frame.classList.toggle('inactive', i !== stack.length - 1);
    });
    if (!blocker) {
        blocker = document.createElement('div');
        blocker.className = 'modal-blocker';
        desktop().appendChild(blocker);
    }
    blocker.style.zIndex = String(stack.length ? 9 + (stack.length - 1) * 2 : 0);
    blocker.hidden = stack.length < 2;
    taskbarHooks?.changed();
}

function topWindow() {
    for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].visible) return stack[i];
    }
    return null;
}

export function GetTopWindow() {
    return topWindow();
}

function fitWindow(w) {
    const outer = w.frame;
    const inner = w.el;
    inner.style.zoom = '';
    const width = inner.offsetWidth;
    const height = inner.offsetHeight;
    const area = desktop().getBoundingClientRect();
    const zoom = Math.min(1, (area.width - 8) / width, (area.height - 8) / height);
    if (zoom < 1) inner.style.zoom = String(zoom);
    if (!w.placed) {
        const depth = stack.filter((s) => s !== w && s.visible && !s.isMessageBox).length;
        const shift = w.isMessageBox ? 0 : Math.min(depth, 6) * 12;
        const left = Math.max(4, Math.round((area.width - width * zoom) / 2) + shift);
        const top = Math.max(4, Math.round((area.height - height * zoom) / 2.4) + shift);
        outer.style.left = `${left}px`;
        outer.style.top = `${top}px`;
        w.placed = true;
    } else {
        // keep it on screen after a resize
        const left = Math.min(parseFloat(outer.style.left), Math.max(4, area.width - width * zoom - 4));
        const top = Math.min(parseFloat(outer.style.top), Math.max(4, area.height - height * zoom - 4));
        outer.style.left = `${Math.max(0, left)}px`;
        outer.style.top = `${Math.max(0, top)}px`;
    }
}

// A different screen size (rotating a phone, resizing the window): center everything again.
window.addEventListener('resize', () => {
    for (const w of stack) {
        w.placed = false;
        if (w.visible) fitWindow(w);
    }
});

function makeDraggable(w, handle) {
    handle.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.target.closest('.title-buttons, .sysicon')) return;
        e.preventDefault();
        const frame = w.frame;
        const startX = e.clientX - parseFloat(frame.style.left);
        const startY = e.clientY - parseFloat(frame.style.top);
        handle.setPointerCapture(e.pointerId);
        const move = (ev) => {
            const area = desktop().getBoundingClientRect();
            const x = Math.min(Math.max(ev.clientX - startX, -frame.offsetWidth + 60), area.width - 60);
            const y = Math.min(Math.max(ev.clientY - startY, 0), area.height - 24);
            frame.style.left = `${x}px`;
            frame.style.top = `${y}px`;
        };
        const up = () => {
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', up);
            handle.removeEventListener('pointercancel', up);
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
        handle.addEventListener('pointercancel', up);
    });
}

// The access key of a label: the letter after a single '&' ("&Start" -> "s").
function mnemonicOf(text) {
    const t = String(text ?? '');
    for (let i = 0; i < t.length - 1; i++) {
        if (t[i] !== '&') continue;
        if (t[i + 1] === '&') {
            i++;
            continue;
        }
        return t[i + 1].toLowerCase();
    }
    return null;
}

function textWithMnemonic(el, text, prefix = true) {
    el.textContent = '';
    if (!prefix) {
        el.textContent = text;
        return;
    }
    let buf = '';
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '&' && i + 1 < text.length) {
            i++;
            if (text[i] === '&') {
                buf += '&';
                continue;
            }
            if (buf) el.append(buf);
            buf = '';
            const u = document.createElement('u');
            u.textContent = text[i];
            el.append(u);
            continue;
        }
        buf += ch;
    }
    if (buf) el.append(buf);
}

function createFrame(w, { title, icon, sysmenu, minimize, help, caption = true, onClose }) {
    const frame = document.createElement('div');
    frame.className = 'win-frame';
    const el = document.createElement('div');
    el.className = 'win';
    frame.appendChild(el);
    w.frame = frame;
    w.el = el;

    if (caption) {
        const bar = document.createElement('div');
        bar.className = 'titlebar';
        if (icon) {
            const img = document.createElement('img');
            img.className = 'sysicon';
            img.src = icon;
            img.alt = '';
            bar.appendChild(img);
            if (sysmenu) {
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openPopup(w, img, systemMenuItems(w), (id) => dispatch(w, WM_SYSCOMMAND, id, 0, true));
                });
            }
        }
        const text = document.createElement('span');
        text.className = 'title-text';
        text.textContent = title;
        bar.appendChild(text);
        const buttons = document.createElement('div');
        buttons.className = 'title-buttons';
        if (minimize) {
            const b = document.createElement('button');
            b.className = 'tbtn minimize';
            b.setAttribute('aria-label', 'Riduci a icona');
            b.tabIndex = -1;
            b.addEventListener('click', () => ShowWindow(w, SW_MINIMIZE));
            buttons.appendChild(b);
        }
        if (help) {
            const b = document.createElement('button');
            b.className = 'tbtn help';
            b.setAttribute('aria-label', 'Guida');
            b.tabIndex = -1;
            buttons.appendChild(b);
        }
        if (sysmenu) {
            const b = document.createElement('button');
            b.className = 'tbtn close';
            b.setAttribute('aria-label', 'Chiudi');
            b.tabIndex = -1;
            b.addEventListener('click', onClose);
            buttons.appendChild(b);
            w.closeButton = b;
        }
        bar.appendChild(buttons);
        el.appendChild(bar);
        w.titleText = text;
        makeDraggable(w, bar);
    }
    // a click anywhere on a window that is not the top one does nothing: modal semantics
    return frame;
}

function systemMenuItems(w) {
    const items = [];
    if (w.style & WS_MINIMIZEBOX) items.push({ id: SC_MINIMIZE, text: 'Riduci a &icona' });
    items.push({ id: SC_CLOSE, text: '&Chiudi' });
    return items.concat(w.systemMenu);
}

// ---------------------------------------------------------------------------------------
// Popup menus (menu bar and system menu)

let openMenu = null; // the open popup
let menuKeyboard = null; // window whose menu bar is being driven from the keyboard
let menuReturnFocus = null; // what had the focus before the menu was entered

function rememberFocus() {
    if (openMenu || menuKeyboard) return;
    const a = document.activeElement;
    menuReturnFocus = a && a !== document.body && !a.closest('.menu-popup, .menubar') ? a : null;
}

function closePopup() {
    if (!openMenu) return;
    openMenu.popup.remove();
    openMenu.anchor.classList.remove('open');
    document.removeEventListener('pointerdown', openMenu.outside, true);
    openMenu = null;
}

// Close any popup, leave the menu bar, and give the focus back to the dialog.
function leaveMenu(restoreFocus = true) {
    const w = openMenu?.w ?? menuKeyboard;
    closePopup();
    menuKeyboard = null;
    const back = menuReturnFocus;
    menuReturnFocus = null;
    const a = document.activeElement;
    if (a?.closest('.menubar')) a.blur();
    if (!restoreFocus || (document.activeElement && document.activeElement !== document.body)) return;
    if (back?.isConnected) back.focus({ preventScroll: true });
    else if (w) focusFirst(w);
}

function openPopup(w, anchor, items, onSelect, { bar = null, index = -1, keyboard = false } = {}) {
    rememberFocus();
    closePopup();
    const popup = document.createElement('div');
    popup.className = 'menu-popup';
    const rows = [];
    for (const item of items) {
        if (item.separator || (!item.items && !item.id && !item.text)) {
            const sep = document.createElement('div');
            sep.className = 'menu-sep';
            popup.appendChild(sep);
            continue;
        }
        const row = document.createElement('button');
        row.className = 'menu-item';
        row.tabIndex = -1;
        row.disabled = !!(item.flags & (MF_GRAYED | MF_DISABLED));
        if (item.flags & MF_CHECKED) row.classList.add('checked');
        row.dataset.mnemonic = mnemonicOf(item.text) ?? '';
        textWithMnemonic(row, item.text);
        row.addEventListener('pointerdown', (e) => e.preventDefault()); // menus don't take the focus
        row.addEventListener('pointerenter', () => !row.disabled && row.focus({ preventScroll: true }));
        row.addEventListener('click', (e) => {
            e.stopPropagation();
            leaveMenu();
            onSelect(item.id);
        });
        popup.appendChild(row);
        rows.push(row);
    }
    document.body.appendChild(popup);
    const r = anchor.getBoundingClientRect();
    const zoom = parseFloat(w.el.style.zoom) || 1;
    popup.style.zoom = String(zoom);
    popup.style.left = `${Math.min(r.left, window.innerWidth - popup.offsetWidth * zoom - 2) / zoom}px`;
    popup.style.top = `${r.bottom / zoom}px`;
    anchor.classList.add('open');
    const outside = (e) => {
        if (popup.contains(e.target)) return;
        if (bar && bar.contains(e.target)) return;
        leaveMenu(false);
    };
    document.addEventListener('pointerdown', outside, true);
    openMenu = { w, popup, anchor, outside, bar, index, rows };
    if (keyboard) rows.find((row) => !row.disabled)?.focus({ preventScroll: true });
}

function openTopMenu(w, index, keyboard) {
    const items = [...w.menuBar.children];
    const i = (index + items.length) % items.length;
    openPopup(w, items[i], w.menu[i].items, (id) => dispatch(w, WM_COMMAND, id, 0, true), {
        bar: w.menuBar,
        index: i,
        keyboard,
    });
}

// Alt or F10: highlight the first menu of the bar, as Windows does.
function enterMenuBar(w, index = 0) {
    rememberFocus();
    closePopup();
    menuKeyboard = w;
    const items = [...w.menuBar.children];
    items[(index + items.length) % items.length].focus({ preventScroll: true });
}

function renderMenuBar(w) {
    const bar = w.menuBar;
    bar.textContent = '';
    w.menu.forEach((top, index) => {
        const item = document.createElement('button');
        item.className = 'menubar-item';
        item.tabIndex = -1;
        if (top.flags & MF_HELP) item.classList.add('help');
        textWithMnemonic(item, top.text);
        item.addEventListener('pointerdown', (e) => e.preventDefault());
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (openMenu && openMenu.anchor === item) leaveMenu();
            else openTopMenu(w, index, false);
        });
        item.addEventListener('pointerenter', () => {
            if (openMenu && openMenu.bar === bar && openMenu.anchor !== item) openTopMenu(w, index, false);
        });
        bar.appendChild(item);
    });
}

// Keys while a menu is open or the menu bar is active. Returns true when the key was used.
function onMenuKey(e) {
    if (['Alt', 'Shift', 'Control', 'Meta'].includes(e.key)) return false;
    const ch = keyChar(e);
    if (openMenu) {
        const { w, bar, index, rows } = openMenu;
        if (bar && !menuKeyboard) menuKeyboard = w; // opened with the mouse, now driven by keys
        const enabled = rows.filter((r) => !r.disabled);
        const cur = enabled.indexOf(document.activeElement);
        const focusRow = (i) => enabled[(i + enabled.length) % enabled.length]?.focus({ preventScroll: true });
        switch (e.key) {
            case 'ArrowDown':
                focusRow(cur + 1);
                return true;
            case 'ArrowUp':
                focusRow(cur < 0 ? -1 : cur - 1);
                return true;
            case 'ArrowRight':
            case 'ArrowLeft':
                if (bar) openTopMenu(w, index + (e.key === 'ArrowRight' ? 1 : -1), true);
                return true;
            case 'Enter':
            case ' ':
                if (cur >= 0) enabled[cur].click();
                return true;
            case 'Escape':
                closePopup();
                if (bar) [...bar.children][index].focus({ preventScroll: true });
                else leaveMenu();
                return true;
            case 'F10':
                leaveMenu();
                return true;
            case 'Tab':
                return true;
        }
        if (ch) {
            const matches = enabled.filter((r) => r.dataset.mnemonic === ch);
            if (matches.length === 1) matches[0].click();
            else if (matches.length > 1) {
                const next = matches.find((r) => enabled.indexOf(r) > cur) ?? matches[0];
                next.focus({ preventScroll: true });
            }
        }
        return true;
    }
    if (menuKeyboard) {
        const w = menuKeyboard;
        const items = [...w.menuBar.children];
        const cur = Math.max(0, items.indexOf(document.activeElement));
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowLeft':
                items[(cur + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length].focus({ preventScroll: true });
                return true;
            case 'ArrowDown':
            case 'ArrowUp':
            case 'Enter':
            case ' ':
                openTopMenu(w, cur, true);
                return true;
            case 'Escape':
            case 'F10':
                leaveMenu();
                return true;
        }
        if (ch) {
            const i = w.menu.findIndex((top) => mnemonicOf(top.text) === ch);
            if (i >= 0) openTopMenu(w, i, true);
            else MessageBeep();
        }
        return true;
    }
    return false;
}

export function GetMenu(hWnd) {
    return hWnd.menu;
}

export function GetSubMenu(menu, pos) {
    return menu[pos]?.items ?? null;
}

export function GetSystemMenu(hWnd) {
    return hWnd.systemMenu;
}

export function DeleteMenu(menu, id) {
    for (let i = menu.length - 1; i >= 0; i--) {
        if (menu[i].id === id && !menu[i].items) menu.splice(i, 1);
        else if (menu[i].items) DeleteMenu(menu[i].items, id);
    }
}

export function AppendMenu(menu, flags, id, text) {
    if (!menu) return;
    menu.push(flags & MF_SEPARATOR ? { separator: true, flags } : { flags, id, text });
}

export function DrawMenuBar(hWnd) {
    if (hWnd.menuBar) renderMenuBar(hWnd);
}

export function CreatePopupMenu() {
    return [];
}

export function InsertMenu(menu, position, flags, idOrPopup, text) {
    const item = flags & MF_POPUP
        ? { flags: flags & ~MF_BYPOSITION, text, items: idOrPopup }
        : { flags: flags & ~MF_BYPOSITION, id: idOrPopup, text };
    menu.splice(Math.min(position, menu.length), 0, item);
}

// ---------------------------------------------------------------------------------------
// Common dialogs: Apri / Salva con nome
//
// The browser's file pickers where there are (Chrome, Edge), otherwise a file input to open
// and a download to save.

function pickerTypes(filter, description) {
    return [{ description, accept: { 'application/octet-stream': [filter] } }];
}

// Resolves to { name, bytes }, or null when the user cancels.
export async function GetOpenFileName({ filter, description }) {
    if (window.showOpenFilePicker) {
        try {
            const [handle] = await window.showOpenFilePicker({ types: pickerTypes(filter, description) });
            const file = await handle.getFile();
            return { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) };
        } catch (err) {
            if (err.name === 'AbortError') return null;
        }
    }
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = filter;
        input.addEventListener('change', async () => {
            const file = input.files[0];
            resolve(file ? { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) } : null);
        });
        input.addEventListener('cancel', () => resolve(null));
        input.click();
    });
}

// Resolves to { name, write(bytes) }, or null when the user cancels.
export async function GetSaveFileName({ suggestedName, filter, description }) {
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({ suggestedName, types: pickerTypes(filter, description) });
            return {
                name: handle.name,
                async write(bytes) {
                    const out = await handle.createWritable();
                    await out.write(bytes);
                    await out.close();
                },
            };
        } catch (err) {
            if (err.name === 'AbortError') return null;
        }
    }
    return {
        name: suggestedName,
        async write(bytes) {
            const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = suggestedName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        },
    };
}

// ---------------------------------------------------------------------------------------
// Dialogs

const classes = new Map(); // custom window classes (BMPView, BMPTipa)

export function RegisterClass({ lpszClassName, lpfnWndProc, hCursor = null }) {
    classes.set(lpszClassName.toLowerCase(), { proc: lpfnWndProc, cursor: hCursor });
    return lpszClassName;
}

export function LoadCursor(_hInst, name) {
    return name;
}

function dispatch(w, message, wParam = 0, lParam = 0, fromUser = false) {
    if (w.ended) return Promise.resolve(FALSE);
    if (fromUser && w.busy) return Promise.resolve(FALSE);
    if (message === WM_TIMER && w.busy) return Promise.resolve(FALSE);
    w.busy++;
    const run = w.queue.then(async () => {
        if (w.ended) return FALSE;
        try {
            let handled = await w.proc(w, message, wParam, lParam);
            if (message === WM_SYSCOMMAND && !handled) {
                // DefDlgProc: close and minimize from the system menu
                if (wParam === SC_CLOSE) handled = await w.proc(w, WM_COMMAND, IDCANCEL, 0);
                else if (wParam === SC_MINIMIZE) ShowWindow(w, SW_MINIMIZE);
            }
            return handled;
        } catch (err) {
            console.error(err);
            return FALSE;
        }
    });
    w.queue = run.finally(() => {
        w.busy--;
    });
    return run;
}

export function SendMessageToDialog(hDlg, message, wParam = 0, lParam = 0) {
    return dispatch(hDlg, message, wParam, lParam);
}

export function DialogBox(_hInst, resId, hWndParent, proc) {
    const tpl = RES.dialogs[resId];
    if (!tpl) {
        console.warn(`Missing dialog ${resId}`);
        return Promise.resolve(-1);
    }
    return new Promise((resolve) => {
        const w = {
            kind: 'dialog',
            resId,
            tpl,
            style: tpl.style,
            parent: hWndParent,
            proc,
            controls: new Map(),
            order: [],
            timers: new Map(),
            props: new Map(),
            queue: Promise.resolve(),
            busy: 0,
            ended: false,
            visible: true,
            minimized: false,
            placed: false,
            systemMenu: [],
            resolve,
        };
        const hasCaption = (tpl.style & WS_CAPTION) === WS_CAPTION;
        const sysmenu = !!(tpl.style & WS_SYSMENU);
        createFrame(w, {
            title: tpl.title,
            icon: tpl.menu ? iconUrl('1') : null,
            sysmenu,
            minimize: hasCaption && !!(tpl.style & WS_MINIMIZEBOX),
            help: !!(tpl.style & DS_CONTEXTHELP),
            caption: hasCaption,
            onClose: () => dispatch(w, WM_SYSCOMMAND, SC_CLOSE, 0, true),
        });
        if (!hasCaption) w.el.classList.add('captionless');
        w.title = tpl.title;

        if (tpl.menu) {
            const menuName = String(tpl.menu).toUpperCase();
            w.menu = structuredClone(RES.menus[menuName] ?? []);
            w.menuBar = document.createElement('div');
            w.menuBar.className = 'menubar';
            w.el.appendChild(w.menuBar);
            renderMenuBar(w);
        }

        const client = document.createElement('div');
        client.className = 'client';
        const cls = String(tpl.class ?? '').toLowerCase();
        if (cls === 'bordlg') client.classList.add('bordlg');
        w.units = dialogUnits(tpl);
        client.style.width = `${Math.round(tpl.cx * w.units.x)}px`;
        client.style.height = `${Math.round(tpl.cy * w.units.y)}px`;
        client.style.fontSize = `${w.units.font}px`;
        w.el.appendChild(client);
        w.client = client;

        tpl.controls.forEach((ctpl, index) => createControl(w, ctpl, index));

        w.onKey = (e) => onDialogKey(w, e);
        desktop().appendChild(w.frame);
        stack.push(w);
        restack();
        fitWindow(w);

        for (const c of w.order) {
            const cls2 = classes.get(c.cls);
            if (cls2) Promise.resolve(cls2.proc(c, WM_CREATE, 0, 0)).then(() => InvalidateRect(c));
        }

        dispatch(w, WM_INITDIALOG, 0, 0).then((r) => {
            if (w.ended) return;
            if (r) focusFirst(w);
        });
    });
}

function focusFirst(w) {
    if (topWindow() !== w) return;
    const def = w.order.find((c) => c.isDefault && c.enabled && c.visible && c.focusEl);
    const first = def ?? w.order.find((c) => c.focusEl && c.enabled && c.visible && c.tabstop);
    first?.focusEl.focus({ preventScroll: true });
}

// IsDialogMessage: Esc, Enter, Tab, arrows within a group, and access keys.
function onDialogKey(w, e) {
    const active = document.activeElement;
    const inside = !!active && w.el.contains(active);
    const typing = inside && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
    const ch = keyChar(e);

    if (e.key === 'Escape') {
        e.preventDefault();
        dispatch(w, WM_COMMAND, IDCANCEL, 0, true);
    } else if (e.key === 'Enter') {
        if (inside && (active.tagName === 'BUTTON' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;
        e.preventDefault();
        const def = w.order.find((c) => c.isDefault && c.enabled && c.visible);
        dispatch(w, WM_COMMAND, def ? def.id : IDOK, 0, true);
    } else if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const list = w.order.filter((c) => c.focusEl && c.tabstop && c.enabled && c.visible);
        if (!list.length) return;
        const cur = list.findIndex((c) => c.focusEl === active);
        const next = cur < 0 ? (e.shiftKey ? list.length - 1 : 0) : cur + (e.shiftKey ? -1 : 1);
        list[(next + list.length) % list.length].focusEl.focus({ preventScroll: true });
    } else if (e.key.startsWith('Arrow') && inside && active.tagName === 'BUTTON') {
        e.preventDefault();
        moveInGroup(w, e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1);
    } else if (e.key === 'F10' && w.menuBar) {
        e.preventDefault();
        enterMenuBar(w, 0);
    } else if (ch && !e.ctrlKey && !e.metaKey && (e.altKey || !typing)) {
        // a plain letter works too, unless it's being typed into a field
        if (dialogMnemonic(w, ch)) {
            e.preventDefault();
        } else if (e.altKey && w.menuBar) {
            const i = w.menu.findIndex((top) => mnemonicOf(top.text) === ch);
            if (i >= 0) {
                e.preventDefault();
                rememberFocus();
                menuKeyboard = w;
                openTopMenu(w, i, true);
            }
        }
    }
}

const MNEMONIC_CLASSES = new Set(['button', 'borbtn', 'borcheck', 'borradio', 'static', 'borstatic', 'borshade']);

function controlMnemonic(c) {
    if (!c.visible || !c.enabled || !MNEMONIC_CLASSES.has(c.cls)) return null;
    if ((c.cls === 'static' || c.cls === 'borstatic') && c.style & 0x80) return null; // SS_NOPREFIX
    return mnemonicOf(c.text);
}

// The underlined letter of a control: buttons are pressed, labels move to the next field.
function dialogMnemonic(w, ch) {
    const matches = w.order.filter((c) => controlMnemonic(c) === ch);
    if (!matches.length) return false;
    const target = (c) => {
        if (c.focusEl && !c.passive) return c;
        const after = w.order.slice(w.order.indexOf(c) + 1);
        return after.find((n) => n.focusEl && n.enabled && n.visible && n.tabstop) ?? null;
    };
    const current = w.order.findIndex((c) => c.focusEl === document.activeElement);
    const pick = matches.find((c) => w.order.indexOf(c) > current) ?? matches[0];
    const t = target(pick);
    if (!t) return true;
    t.focusEl.focus({ preventScroll: true });
    // with a single match, buttons, check boxes and radio buttons act straight away
    if (matches.length === 1 && t === pick && t.focusEl.tagName === 'BUTTON') t.focusEl.click();
    return true;
}

// Arrow keys move between the controls of a group; an automatic radio button gets checked.
function moveInGroup(w, dir) {
    const order = w.order;
    const at = order.findIndex((c) => c.focusEl === document.activeElement);
    if (at < 0) return;
    let start = at;
    while (start > 0 && !order[start].group) start--;
    let end = at + 1;
    while (end < order.length && !order[end].group) end++;
    const group = order.slice(start, end).filter((c) => c.focusEl && !c.passive && c.enabled && c.visible);
    const i = group.indexOf(order[at]);
    if (i < 0 || group.length < 2) return;
    const next = group[(i + dir + group.length) % group.length];
    next.focusEl.focus({ preventScroll: true });
    if (next.autoRadio && !next.checked) next.focusEl.click();
}

export function EndDialog(hDlg, result) {
    if (hDlg.ended) return TRUE;
    hDlg.ended = true;
    for (const t of hDlg.timers.values()) clearInterval(t);
    hDlg.timers.clear();
    for (const c of hDlg.order) {
        const cls = classes.get(c.cls);
        if (cls) cls.proc(c, WM_DESTROY, 0, 0);
    }
    if (openMenu?.w === hDlg || menuKeyboard === hDlg) leaveMenu(false);
    hDlg.frame.remove();
    const i = stack.indexOf(hDlg);
    if (i >= 0) stack.splice(i, 1);
    restack();
    const top = topWindow();
    if (top && !top.el.contains(document.activeElement)) focusFirst(top);
    hDlg.resolve(result);
    return TRUE;
}

// ---------------------------------------------------------------------------------------
// Controls

function createControl(w, tpl, index) {
    const cls = String(tpl.class).toLowerCase();
    const c = {
        kind: 'control',
        id: tpl.id,
        cls,
        style: tpl.style,
        tpl,
        dlg: w,
        text: typeof tpl.title === 'string' ? tpl.title : '',
        checked: 0,
        enabled: !(tpl.style & WS_DISABLED),
        visible: !!(tpl.style & WS_VISIBLE),
        tabstop: !!(tpl.style & WS_TABSTOP),
        group: !!(tpl.style & WS_GROUP),
        props: new Map(),
        items: [],
        selected: -1,
        el: null,
        focusEl: null,
        isDefault: false,
    };
    w.order.push(c);
    if (tpl.id !== -1 && !w.controls.has(tpl.id)) w.controls.set(tpl.id, c);

    const el = document.createElement('div');
    el.className = `ctl c-${cls}`;
    const { x: ux, y: uy } = w.units;
    el.style.left = `${Math.round(tpl.x * ux)}px`;
    el.style.top = `${Math.round(tpl.y * uy)}px`;
    el.style.width = `${Math.round(tpl.cx * ux)}px`;
    el.style.height = `${Math.round(tpl.cy * uy)}px`;
    if ((tpl.style & WS_BORDER) || (tpl.exStyle & WS_EX_CLIENTEDGE)) {
        el.classList.add(cls === 'edit' ? 'sunken' : 'border');
    }
    el.style.zIndex = cls === 'borshade' ? String(1 + index) : String(2000 - index);
    c.el = el;

    const builder = builders[cls] ?? (classes.has(cls) ? buildCustom : buildStatic);
    builder(c);
    // Group boxes, statics and shades are transparent to the mouse (HTTRANSPARENT), so
    // clicks reach the controls they overlap.
    if (c.passive) el.classList.add('passive');
    applyState(c);
    w.client.appendChild(el);
    return c;
}

function applyState(c) {
    c.el.hidden = !c.visible;
    c.el.classList.toggle('disabled', !c.enabled);
    if (c.focusEl && 'disabled' in c.focusEl) c.focusEl.disabled = !c.enabled;
}

function clickCommand(c) {
    return () => {
        if (!c.enabled) return;
        dispatch(c.dlg, WM_COMMAND, c.id & 0xffff, 0, true);
    };
}

function buildPush(c, { defaultButton = false } = {}) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'push';
    b.tabIndex = c.tabstop ? 0 : -1;
    const label = document.createElement('span');
    label.className = 'label';
    b.appendChild(label);
    c.label = label;
    c.el.appendChild(b);
    c.focusEl = b;
    c.isDefault = defaultButton;
    if (defaultButton) b.classList.add('default');
    b.addEventListener('click', clickCommand(c));
    c.render = () => textWithMnemonic(label, c.text);
    c.render();
}

function buildCheck(c, { radio, auto, bwcc, leftText }) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `check ${radio ? 'radio' : 'checkbox'}${bwcc ? ' bw' : ''}${leftText ? ' lefttext' : ''}`;
    b.setAttribute('role', radio ? 'radio' : 'checkbox');
    b.tabIndex = c.tabstop ? 0 : -1;
    const box = document.createElement(bwcc ? 'img' : 'span');
    box.className = 'box';
    if (bwcc) box.alt = '';
    const label = document.createElement('span');
    label.className = 'label';
    b.append(box, label);
    c.el.appendChild(b);
    c.focusEl = b;
    c.label = label;
    c.render = () => {
        textWithMnemonic(label, c.text);
        b.setAttribute('aria-checked', c.checked ? 'true' : 'false');
        b.classList.toggle('on', !!c.checked);
        if (bwcc) {
            const base = radio ? 130 : 110;
            box.src = `res/bwcc/${base + (c.checked ? 1 : 0) + (!c.enabled && !radio ? 4 : 0)}.png`;
        }
    };
    b.addEventListener('click', () => {
        if (!c.enabled) return;
        if (auto) {
            if (radio) {
                for (const other of radioGroup(c)) {
                    if (other !== c && other.autoRadio) {
                        other.checked = 0;
                        other.render();
                    }
                }
                c.checked = 1;
            } else {
                c.checked = c.checked ? 0 : 1;
            }
            c.render();
        }
        dispatch(c.dlg, WM_COMMAND, c.id & 0xffff, 0, true);
    });
    c.autoRadio = radio && auto;
    c.render();
}

function radioGroup(c) {
    const order = c.dlg.order;
    let start = order.indexOf(c);
    while (start > 0 && !order[start].group) start--;
    const group = [order[start]];
    for (let i = start + 1; i < order.length && !order[i].group; i++) group.push(order[i]);
    return group.filter((x) => x.autoRadio);
}

function buildGroupBox(c) {
    c.passive = true;
    c.el.classList.add('groupbox');
    const caption = document.createElement('span');
    caption.className = 'caption';
    c.el.appendChild(caption);
    c.render = () => {
        textWithMnemonic(caption, c.text);
        caption.hidden = !c.text;
    };
    c.render();
}

function buildButton(c) {
    const type = c.style & 0xf;
    const leftText = !!(c.style & 0x20);
    switch (type) {
        case 0x0: // BS_PUSHBUTTON
        case 0x1: // BS_DEFPUSHBUTTON
            buildPush(c, { defaultButton: type === 1 });
            break;
        case 0x2: // BS_CHECKBOX
        case 0x3: // BS_AUTOCHECKBOX
        case 0x5: // BS_3STATE
        case 0x6: // BS_AUTO3STATE
            buildCheck(c, { radio: false, auto: type === 3 || type === 6, bwcc: false, leftText });
            break;
        case 0x4: // BS_RADIOBUTTON
        case 0x9: // BS_AUTORADIOBUTTON
            buildCheck(c, { radio: true, auto: type === 9, bwcc: false, leftText });
            break;
        case 0x7: // BS_GROUPBOX
            buildGroupBox(c);
            break;
        default:
            buildPush(c);
    }
}

const BWCC_STANDARD = new Set([IDOK, IDCANCEL, IDABORT, IDRETRY, IDIGNORE, IDYES, IDNO]);

function buildBorBtn(c) {
    const isBitmapOnly = !!(c.style & 0x8000); // BBS_BITMAP: a picture, not a button
    const glyph = BWCC_STANDARD.has(c.id) ? c.id : null;
    const bitmap = glyph ? null : HasBitmap(c.id + 1000) ? c.id + 1000 : null;
    if (glyph === null && bitmap === null) {
        buildPush(c, { defaultButton: (c.style & 0xf) === 1 });
        c.el.classList.add('bwcc-text');
        return;
    }
    if (isBitmapOnly && bitmap) {
        c.passive = true;
        const img = document.createElement('img');
        img.className = 'picture';
        img.src = bitmapUrl(bitmap);
        img.alt = '';
        img.draggable = false;
        c.el.appendChild(img);
        c.render = () => {};
        return;
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = glyph ? 'borbtn glyph' : 'borbtn bitmap';
    b.tabIndex = c.tabstop ? 0 : -1;
    const img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    b.appendChild(img);
    c.el.appendChild(b);
    c.focusEl = b;
    c.isDefault = (c.style & 0xf) === 1 || c.id === IDOK;
    if (glyph) {
        const label = { 1: 'OK', 2: 'Cancel', 3: 'Abort', 4: 'Retry', 5: 'Ignore', 6: 'Yes', 7: 'No' }[glyph];
        b.setAttribute('aria-label', label);
        const normal = `res/bwcc/${1000 + glyph}.png`;
        const pressed = `res/bwcc/${3000 + glyph}.png`;
        const focused = `res/bwcc/${5000 + glyph}.png`;
        const show = () => {
            img.src = b.classList.contains('down') ? pressed : document.activeElement === b ? focused : normal;
        };
        b.addEventListener('pointerdown', () => {
            b.classList.add('down');
            show();
        });
        for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) {
            b.addEventListener(ev, () => {
                b.classList.remove('down');
                show();
            });
        }
        b.addEventListener('focus', show);
        b.addEventListener('blur', show);
        show();
    } else {
        img.src = bitmapUrl(bitmap);
    }
    b.addEventListener('click', clickCommand(c));
    c.render = () => {};
}

function buildBorShade(c) {
    c.passive = true;
    const kinds = { 1: 'group', 2: 'hdip', 3: 'vdip', 4: 'hbump', 5: 'vbump', 6: 'rgroup' };
    c.el.classList.add(kinds[c.style & 0xf] ?? 'group');
    c.render = () => {
        if (c.text) {
            let cap = c.el.querySelector('.caption');
            if (!cap) {
                cap = document.createElement('span');
                cap.className = 'caption';
                c.el.appendChild(cap);
            }
            textWithMnemonic(cap, c.text);
        }
    };
    c.render();
}

function buildStatic(c) {
    c.passive = !(c.style & 0x100); // SS_NOTIFY statics would want clicks
    const type = c.style & 0x1f;
    const noPrefix = !!(c.style & 0x80);
    if (c.cls === 'static' && type === 0x3) {
        // SS_ICON: the title names the icon resource; icons are drawn at 32x32
        c.el.classList.add('icon');
        const img = document.createElement('img');
        img.alt = '';
        img.draggable = false;
        c.el.appendChild(img);
        c.render = () => {
            img.src = iconUrl(c.text || c.tpl.title);
        };
        c.render();
        return;
    }
    if (c.cls === 'static' && type === 0xe) {
        const img = document.createElement('img');
        img.alt = '';
        img.className = 'picture';
        c.el.appendChild(img);
        c.render = () => {
            img.src = bitmapUrl(c.tpl.title);
        };
        c.render();
        return;
    }
    if (c.cls === 'static' && type >= 0x4 && type <= 0x9) {
        c.el.classList.add(['blackrect', 'grayrect', 'whiterect', 'blackframe', 'grayframe', 'whiteframe'][type - 4]);
        c.render = () => {};
        return;
    }
    c.el.classList.add('text');
    const align = c.cls === 'borstatic' ? c.style & 0x3 : type;
    if (align === 1) c.el.classList.add('center');
    else if (align === 2) c.el.classList.add('right');
    if (type === 0xb || type === 0xc) c.el.classList.add('nowrap');
    c.render = () => textWithMnemonic(c.el, c.text, !noPrefix);
    c.render();
}

function buildEdit(c) {
    const multiline = !!(c.style & 0x4);
    const input = document.createElement(multiline ? 'textarea' : 'input');
    if (!multiline) input.type = 'text';
    input.className = 'edit';
    input.spellcheck = false;
    input.autocomplete = 'off';
    input.readOnly = !!(c.style & 0x800);
    input.tabIndex = c.tabstop ? 0 : -1;
    c.el.appendChild(input);
    c.focusEl = input;
    input.addEventListener('input', () => {
        c.text = input.value;
        dispatch(c.dlg, WM_COMMAND, MAKELONG(c.id, EN_CHANGE), 0);
    });
    c.render = () => {
        if (input.value !== c.text) input.value = c.text;
    };
    c.render();
}

function buildCombo(c) {
    const select = document.createElement('select');
    select.className = 'combo';
    select.tabIndex = c.tabstop ? 0 : -1;
    c.el.style.height = '';
    c.el.appendChild(select);
    c.focusEl = select;
    select.addEventListener('change', () => {
        c.selected = select.selectedIndex;
    });
    c.render = () => {
        select.textContent = '';
        for (const item of c.items) {
            const opt = document.createElement('option');
            opt.textContent = item;
            select.appendChild(opt);
        }
        select.selectedIndex = c.selected;
    };
    c.render();
}

function buildListBox(c) {
    const list = document.createElement('select');
    list.className = 'listbox';
    list.size = 4;
    c.el.appendChild(list);
    c.focusEl = list;
    list.addEventListener('change', () => {
        c.selected = list.selectedIndex;
    });
    c.render = () => {
        list.textContent = '';
        for (const item of c.items) {
            const opt = document.createElement('option');
            opt.textContent = item;
            list.appendChild(opt);
        }
        list.selectedIndex = c.selected;
    };
    c.render();
}

function buildProgress(c) {
    c.el.classList.add('progress');
    const bar = document.createElement('div');
    bar.className = 'bar';
    c.el.appendChild(bar);
    c.range = [0, 100];
    c.pos = 0;
    c.render = () => {
        const [lo, hi] = c.range;
        const pct = hi > lo ? Math.max(0, Math.min(1, (c.pos - lo) / (hi - lo))) : 0;
        bar.style.width = `${pct * 100}%`;
    };
    c.render();
}

function buildCustom(c) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(c.tpl.cx * c.dlg.units.x);
    canvas.height = Math.round(c.tpl.cy * c.dlg.units.y);
    c.el.classList.add('custom');
    c.el.appendChild(canvas);
    c.canvas = canvas;
    const def = classes.get(c.cls);
    if (def.cursor) canvas.style.cursor = cursorCss(def.cursor);
    else canvas.style.cursor = 'pointer';
    canvas.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || topWindow() !== c.dlg || c.dlg.busy) return;
        const r = canvas.getBoundingClientRect();
        const x = Math.floor(((e.clientX - r.left) * canvas.width) / r.width);
        const y = Math.floor(((e.clientY - r.top) * canvas.height) / r.height);
        def.proc(c, WM_LBUTTONDOWN, 0, MAKELONG(x, y));
    });
    c.render = () => {};
}

const builders = {
    button: buildButton,
    borbtn: buildBorBtn,
    borcheck: (c) => buildCheck(c, { radio: false, auto: (c.style & 0xf) === 3, bwcc: true, leftText: !!(c.style & 0x20) }),
    borradio: (c) => buildCheck(c, { radio: true, auto: (c.style & 0xf) === 9, bwcc: true, leftText: !!(c.style & 0x20) }),
    borshade: buildBorShade,
    borstatic: buildStatic,
    static: buildStatic,
    edit: buildEdit,
    combobox: buildCombo,
    listbox: buildListBox,
    msctls_progress: buildProgress,
    msctls_progress32: buildProgress,
};

// ---------------------------------------------------------------------------------------
// Control API

export function GetDlgItem(hDlg, id) {
    return hDlg.controls.get(id) ?? null;
}

export function SetDlgItemText(hDlg, id, text) {
    const c = GetDlgItem(hDlg, id);
    if (!c) return FALSE;
    c.text = String(text);
    c.render();
    return TRUE;
}

export function GetDlgItemText(hDlg, id) {
    const c = GetDlgItem(hDlg, id);
    return c ? c.text : '';
}

export function SetWindowText(hWnd, text) {
    if (hWnd.kind === 'control') {
        hWnd.text = String(text);
        hWnd.render();
    } else if (hWnd.titleText) {
        hWnd.title = String(text);
        hWnd.titleText.textContent = hWnd.title;
        taskbarHooks?.changed();
    }
}

export function SendMessage(hWnd, message, wParam = 0, lParam = 0) {
    if (!hWnd) return 0;
    switch (message) {
        case BM_SETCHECK:
            hWnd.checked = wParam ? 1 : 0;
            hWnd.render();
            return 0;
        case BM_GETCHECK:
            return hWnd.checked;
        case CB_ADDSTRING:
        case LB_ADDSTRING:
            hWnd.items.push(String(lParam));
            hWnd.render();
            return hWnd.items.length - 1;
        case CB_RESETCONTENT:
        case LB_RESETCONTENT:
            hWnd.items = [];
            hWnd.selected = -1;
            hWnd.render();
            return 0;
        case CB_SETCURSEL:
        case LB_SETCURSEL:
            hWnd.selected = wParam;
            hWnd.render();
            return wParam;
        case CB_GETCURSEL:
        case LB_GETCURSEL:
            return hWnd.selected;
        case PBM_SETRANGE:
            hWnd.range = [LOWORD(lParam), HIWORD(lParam)];
            hWnd.render();
            return 0;
        case PBM_SETPOS:
            hWnd.pos = wParam;
            hWnd.render();
            return 0;
        default:
            return 0;
    }
}

export function SendDlgItemMessage(hDlg, id, message, wParam = 0, lParam = 0) {
    return SendMessage(GetDlgItem(hDlg, id), message, wParam, lParam);
}

export function CheckDlgButton(hDlg, id, check) {
    return SendDlgItemMessage(hDlg, id, BM_SETCHECK, check);
}

export function IsDlgButtonChecked(hDlg, id) {
    return SendDlgItemMessage(hDlg, id, BM_GETCHECK);
}

export function EnableWindow(hWnd, enable) {
    if (!hWnd) return FALSE;
    hWnd.enabled = !!enable;
    if (hWnd.kind === 'control') {
        applyState(hWnd);
        hWnd.render();
    }
    return TRUE;
}

export function SetFocus(hWnd) {
    if (hWnd?.focusEl && topWindow() === hWnd.dlg) hWnd.focusEl.focus({ preventScroll: true });
    return null;
}

export function InvalidateRect(hWnd) {
    if (!hWnd) return;
    if (hWnd.kind === 'control') {
        const cls = classes.get(hWnd.cls);
        if (cls) cls.proc(hWnd, WM_PAINT, 0, 0);
        return;
    }
    for (const c of hWnd.order) if (classes.has(c.cls)) InvalidateRect(c);
}

export function UpdateWindow(hWnd) {
    InvalidateRect(hWnd);
}

export function SetWindowPos(hWnd, _after, x, y, cx, cy, flags = 0) {
    if (hWnd.kind !== 'control') return TRUE;
    if (!(flags & SWP_NOMOVE)) {
        hWnd.el.style.left = `${x}px`;
        hWnd.el.style.top = `${y}px`;
    }
    if (!(flags & SWP_NOSIZE)) {
        hWnd.el.style.width = `${cx}px`;
        hWnd.el.style.height = `${cy}px`;
        if (hWnd.canvas && (hWnd.canvas.width !== cx || hWnd.canvas.height !== cy)) {
            hWnd.canvas.width = cx;
            hWnd.canvas.height = cy;
        }
    }
    return TRUE;
}

// Custom controls paint into a canvas; BeginPaint hands out its 2D context.
export function BeginPaint(hWnd) {
    return hWnd.canvas.getContext('2d');
}

export function EndPaint() {}

export function SetProp(hWnd, name, value) {
    hWnd.props.set(name, value);
    return TRUE;
}

export function GetProp(hWnd, name) {
    return hWnd.props.get(name) ?? null;
}

export function RemoveProp(hWnd, name) {
    const v = hWnd.props.get(name) ?? null;
    hWnd.props.delete(name);
    return v;
}

export function ShowWindow(hWnd, cmd) {
    if (!hWnd || hWnd.kind !== 'dialog' || hWnd.ended) return FALSE;
    const wasVisible = hWnd.visible;
    switch (cmd) {
        case SW_HIDE:
            hWnd.visible = false;
            break;
        case SW_MINIMIZE:
        case SW_SHOWMINIMIZED:
            hWnd.visible = false;
            hWnd.minimized = true;
            break;
        default:
            hWnd.visible = true;
            hWnd.minimized = false;
    }
    hWnd.frame.hidden = !hWnd.visible;
    if (hWnd.visible) {
        fitWindow(hWnd);
        if (!wasVisible) InvalidateRect(hWnd);
    }
    restack();
    if (hWnd.visible && topWindow() === hWnd && !hWnd.el.contains(document.activeElement)) focusFirst(hWnd);
    return wasVisible ? TRUE : FALSE;
}

export function IsIconic(hWnd) {
    return hWnd?.minimized ? TRUE : FALSE;
}

export function SetTimer(hWnd, id, elapse) {
    KillTimer(hWnd, id);
    hWnd.timers.set(id, setInterval(() => dispatch(hWnd, WM_TIMER, id, 0), elapse));
    return id;
}

export function KillTimer(hWnd, id) {
    const t = hWnd?.timers?.get(id);
    if (t) {
        clearInterval(t);
        hWnd.timers.delete(id);
    }
    return TRUE;
}

export function GetOpenWindows() {
    return stack.slice();
}

// ---------------------------------------------------------------------------------------
// MessageBox

const MB_ICONS = {
    0x10: 'stop',
    0x20: 'question',
    0x30: 'exclamation',
    0x40: 'information',
};

export function MessageBox(hWndParent, text, caption, flags = MB_OK) {
    return new Promise((resolve) => {
        const kind = flags & 0xf;
        const buttons =
            kind === MB_YESNO ? [IDYES, IDNO]
                : kind === MB_YESNOCANCEL ? [IDYES, IDNO, IDCANCEL]
                    : kind === MB_OKCANCEL ? [IDOK, IDCANCEL]
                        : [IDOK];
        const labels = { [IDOK]: 'OK', [IDCANCEL]: 'Annulla', [IDYES]: '&Sì', [IDNO]: '&No' };
        const escResult = buttons.includes(IDCANCEL) ? IDCANCEL : kind === MB_OK ? IDOK : null;

        const w = {
            kind: 'messagebox',
            isMessageBox: true,
            parent: hWndParent,
            visible: true,
            placed: false,
            busy: 0,
            ended: false,
            order: [],
            systemMenu: [],
            style: 0,
        };
        const finish = (result) => {
            if (w.ended) return;
            w.ended = true;
            w.frame.remove();
            stack.splice(stack.indexOf(w), 1);
            restack();
            const top = topWindow();
            if (top && top.kind === 'dialog') focusFirst(top);
            resolve(result);
        };
        createFrame(w, {
            title: caption ?? '',
            sysmenu: true,
            caption: true,
            onClose: () => escResult !== null && finish(escResult),
        });
        if (escResult === null) w.closeButton.disabled = true;
        w.el.classList.add('msgbox');

        const body = document.createElement('div');
        body.className = 'msgbox-body';
        const icon = MB_ICONS[flags & 0xf0];
        if (icon) {
            const i = document.createElement('div');
            i.className = `mb-icon ${icon}`;
            body.appendChild(i);
        }
        const p = document.createElement('div');
        p.className = 'msgbox-text';
        if (text instanceof Node) p.append(text); // richer content than Win32 allows
        else p.textContent = String(text);
        body.appendChild(p);
        w.el.appendChild(body);

        const row = document.createElement('div');
        row.className = 'msgbox-buttons';
        const els = buttons.map((id, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'push';
            if (i === 0) b.classList.add('default');
            const label = document.createElement('span');
            label.className = 'label';
            textWithMnemonic(label, labels[id]);
            b.appendChild(label);
            b.addEventListener('click', () => finish(id));
            row.appendChild(b);
            return b;
        });
        w.el.appendChild(row);
        w.onKey = (e) => {
            const cur = els.indexOf(document.activeElement);
            const ch = keyChar(e);
            if (e.key === 'Escape') {
                e.preventDefault();
                if (escResult !== null) finish(escResult);
            } else if (e.key === 'Enter') {
                if (cur >= 0) return; // the focused button clicks itself
                e.preventDefault();
                finish(buttons[0]);
            } else if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
                e.preventDefault();
                const dir = e.key === 'ArrowLeft' || e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey) ? -1 : 1;
                els[(Math.max(cur, 0) + dir + els.length) % els.length].focus({ preventScroll: true });
            } else if (ch && !e.ctrlKey && !e.metaKey) {
                const i = buttons.findIndex((id) => mnemonicOf(labels[id]) === ch || (id === IDYES && ch === 'y'));
                if (i >= 0) {
                    e.preventDefault();
                    finish(buttons[i]);
                }
            }
        };

        desktop().appendChild(w.frame);
        stack.push(w);
        restack();
        fitWindow(w);
        els[0].focus({ preventScroll: true });
    });
}

// ---------------------------------------------------------------------------------------
// Keyboard

export function MessageBeep() {}

// The letter of a key press. With Alt held, macOS types special characters (Option+S is
// "ß"), so fall back to the physical key.
function keyChar(e) {
    if (!e.altKey && e.key.length === 1 && /[\p{L}\p{N}]/u.test(e.key)) return e.key.toLowerCase();
    const m = /^(?:Key([A-Z])|Digit([0-9]))$/.exec(e.code ?? '');
    if (m) return (m[1] ?? m[2]).toLowerCase();
    return null;
}

let altAlone = false; // Alt pressed and released on its own toggles the menu bar

// Every key goes to the topmost window, wherever the focus happens to be.
document.addEventListener('keydown', (e) => {
    altAlone = e.key === 'Alt' ? !e.repeat || altAlone : false;
    if (e.defaultPrevented || e.isComposing) return;
    const top = topWindow();
    if (!top) return;
    if ((openMenu || menuKeyboard) && onMenuKey(e)) {
        e.preventDefault();
        return;
    }
    top.onKey?.(e);
});

document.addEventListener('keyup', (e) => {
    if (e.key !== 'Alt' || !altAlone) return;
    altAlone = false;
    const top = topWindow();
    if (openMenu || menuKeyboard) leaveMenu();
    else if (top?.menuBar) enterMenuBar(top, 0);
    else return;
    e.preventDefault();
});

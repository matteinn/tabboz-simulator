// Port of readkey.c: the Windows registry becomes localStorage, sndPlaySound an <audio>,
// and the .tbz files of "Apri..." / "Salva con nome..." are INI files as on Windows.

import { PlayWave, StopSounds } from '../win32.js';

const PREFIX = 'Tabboz Simulator 32\\';

// 21 lug 2000 - Scrittura/lettura su di un file specifico. Mentre c'e' un profilo, le chiavi
// vanno nella sezione [Tabboz] del file invece che nel registro.
let profilo = null;

export function UsaProfilo(p) {
    profilo = p;
}

export function SpegniISuoni() {
    StopSounds();
}

// Aggiunge una stringa al registro di configurazione
export function TabbozAddKey(KeyName, KeyValue) {
    if (profilo) {
        profilo.set(KeyName.toLowerCase(), [KeyName, String(KeyValue)]);
        return;
    }
    try {
        localStorage.setItem(PREFIX + KeyName, String(KeyValue));
    } catch {
        // storage disabled or full: the game keeps running, it just won't be saved
    }
}

// Legge la stringa KeyName; null se non c'e'
export function TabbozReadKey(KeyName) {
    if (profilo) {
        const v = profilo.get(KeyName.toLowerCase())?.[1];
        return v === undefined || v === '' ? null : v;
    }
    try {
        const v = localStorage.getItem(PREFIX + KeyName);
        return v === null || v === '' ? null : v;
    } catch {
        return null;
    }
}

// Inizia la riproduzione di un suono
export function TabbozPlaySound(number) {
    PlayWave(number);
}

// Legge una stringa dal profilo ('' se non c'e')
export function RRKey(xKey) {
    return TabbozReadKey(xKey) ?? '';
}

// ------------------------------------------------------------------------------------------
// File .tbz: la sezione [Tabboz] di un file INI, scritto da WritePrivateProfileString

// The [Tabboz] section of an INI text, or null when there is none. Keys are matched
// without regard to case, like GetPrivateProfileString does.
export function LeggiProfilo(text) {
    let section = null;
    let found = false;
    const p = new Map();
    for (const raw of text.split(/\r\n|\n|\r/)) {
        const line = raw.trim();
        if (!line || line.startsWith(';')) continue;
        const header = /^\[(.*)\]$/.exec(line);
        if (header) {
            section = header[1].trim().toLowerCase();
            found ||= section === 'tabboz';
            continue;
        }
        const eq = line.indexOf('=');
        if (section !== 'tabboz' || eq < 0) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if (value.length > 1 && value[0] === value.at(-1) && (value[0] === '"' || value[0] === "'")) {
            value = value.slice(1, -1);
        }
        p.set(key.toLowerCase(), [key, value]);
    }
    return found ? p : null;
}

export function ScriviProfilo(p) {
    const lines = ['[Tabboz]'];
    for (const [key, value] of p.values()) lines.push(`${key}=${value}`);
    return `${lines.join('\r\n')}\r\n`;
}

// Windows wrote INI files in the ANSI code page (1252): keep that, so files are interchangeable.
const CP1252_HIGH = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008DŽ\u008F\u0090‘’“”•–—˜™š›œ\u009DžŸ';

export function DecodificaAnsi(bytes) {
    return new TextDecoder('windows-1252').decode(bytes);
}

export function CodificaAnsi(text) {
    const out = new Uint8Array(text.length);
    let n = 0;
    for (const ch of text) {
        const c = ch.codePointAt(0);
        const high = CP1252_HIGH.indexOf(ch);
        if (c < 0x80 || (c >= 0xa0 && c <= 0xff)) out[n++] = c;
        else if (high >= 0) out[n++] = 0x80 + high;
        else out[n++] = 0x3f; // '?', as WideCharToMultiByte does
    }
    return out.slice(0, n);
}

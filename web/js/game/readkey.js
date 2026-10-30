// Port of readkey.c: the Windows registry becomes localStorage, sndPlaySound an <audio>.

import { PlayWave, StopSounds } from '../win32.js';

const PREFIX = 'Tabboz Simulator 32\\';

export function SpegniISuoni() {
    StopSounds();
}

// Aggiunge una stringa al registro di configurazione
export function TabbozAddKey(KeyName, KeyValue) {
    try {
        localStorage.setItem(PREFIX + KeyName, String(KeyValue));
    } catch {
        // storage disabled or full: the game keeps running, it just won't be saved
    }
}

// Legge la stringa KeyName; null se non c'e'
export function TabbozReadKey(KeyName) {
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

// Boot: load the resources, wait for a click (browsers only play sound after one),
// then run the original WinMain. Shutting down brings you back to the desktop.

import {
    GetTopWindow, IsIconic, LoadResources, MB_OK, MessageBox, SetTaskbarHooks, ShowWindow, SW_MINIMIZE, SW_SHOWNORMAL,
} from './win32.js';
import { T } from './state.js';
import { SalvaTutto, WinMain } from './game/zarrosim.js';

const boot = document.getElementById('boot');
const power = document.getElementById('power');
const hint = document.getElementById('boot-hint');
const taskbar = document.getElementById('taskbar');
const tasks = document.getElementById('tasks');
const clock = document.getElementById('clock');

let running = false;
let booted = false; // after the first run the desktop icon wants a double click

// ------------------------------------------------------------------ taskbar

const taskButton = document.createElement('button');
taskButton.type = 'button';
taskButton.className = 'push task';
taskButton.innerHTML = '<span class="label"><img src="res/icons/1.png" alt=""><span>Tabboz Simulator</span></span>';
taskButton.addEventListener('click', () => {
    const main = T.hWndMain;
    if (!main || main.ended) return;
    if (IsIconic(main)) ShowWindow(main, SW_SHOWNORMAL);
    else if (GetTopWindow() === main) ShowWindow(main, SW_MINIMIZE);
});

SetTaskbarHooks({
    changed() {
        const main = T.hWndMain;
        const alive = running && main && !main.ended;
        if (alive && !taskButton.isConnected) tasks.appendChild(taskButton);
        if (!alive && taskButton.isConnected) taskButton.remove();
        taskButton.classList.toggle('active', !!alive && !IsIconic(main));
    },
});

function tick() {
    const now = new Date();
    clock.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
tick();
setInterval(tick, 10000);

// ------------------------------------------------------------------ power on / off

async function start() {
    if (running) return;
    running = true;
    booted = true;
    boot.hidden = true;
    taskbar.hidden = false;

    const shutdown = await WinMain();

    running = false;
    T.hWndMain = null;
    tasks.textContent = '';
    if (shutdown === 2) {
        // "Spegni il computer ed esci di casa"
        const screen = document.createElement('div');
        screen.className = 'shutdown';
        screen.textContent = 'Ora puoi spegnere il computer.';
        document.body.appendChild(screen);
        screen.addEventListener('click', () => {
            screen.remove();
            showDesktop();
        }, { once: true });
    } else {
        showDesktop();
    }
}

function showDesktop() {
    boot.hidden = false;
    hint.textContent = 'Doppio clic per avviare';
    power.focus({ preventScroll: true });
}

power.addEventListener('click', (e) => {
    // a single tap is enough on touch screens; a mouse wants a double click, like on the desktop
    if (booted && e.pointerType === 'mouse' && e.detail < 2) return;
    start();
});
power.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') start();
});

// Only once the main window is up: leaving during the first-run Format must not save a
// half-made character, or the next visit would skip the Format screen.
// ------------------------------------------------------------------ donations

// res/donate.json holds the Lightning address and res/donate-qr.svg its QR code; without
// them the desktop shows no donation icon.
let lightning = null;

const REPO_URL = 'https://github.com/matteinn/tabboz-simulator';

async function loadDonations() {
    try {
        const response = await fetch('res/donate.json');
        if (!response.ok) return;
        lightning = (await response.json()).lightning ?? null;
    } catch {
        return;
    }
    if (!lightning) return;
    for (const id of ['donate', 'tray-donate']) {
        const button = document.getElementById(id);
        button.hidden = false;
        button.addEventListener('click', showDonations);
    }
    if (location.hash === '#dona') showDonations();
}

function showDonations() {
    const body = document.createElement('div');
    body.className = 'donate';
    body.innerHTML = `
        <p>Ti piace questa versione web di Tabboz Simulator? Offrimi un caff&egrave; con Bitcoin Lightning.</p>
        <img class="donate-qr" src="res/donate-qr.svg" alt="Codice QR dell'indirizzo Lightning" width="174" height="174">
        <div class="donate-address"><code></code><button type="button" class="push"><span class="label">Copia</span></button></div>
        <p><a class="donate-open">Apri nel wallet</a></p>
        <p>Il codice di questo porting &egrave; su <a class="donate-repo" target="_blank" rel="noopener">GitHub</a>.</p>
        <p class="donate-note">Il gioco originale &egrave; di Obscured Truckware (Andrea Bonomi, Emanuele Caccialanza, Daniele Gazzarri); le donazioni vanno a chi ha fatto questo porting.</p>`;
    body.querySelector('code').textContent = lightning;
    body.querySelector('.donate-open').href = `lightning:${lightning}`;
    body.querySelector('.donate-repo').href = REPO_URL;
    const copy = body.querySelector('.donate-address button');
    copy.addEventListener('click', async () => {
        let copied = false;
        try {
            await navigator.clipboard.writeText(lightning);
            copied = true;
        } catch {
            // no clipboard permission: select the address, and try the old way
            getSelection()?.selectAllChildren(body.querySelector('code'));
            copied = document.execCommand?.('copy') ?? false;
        }
        if (copied) copy.querySelector('.label').textContent = 'Copiato!';
    });
    MessageBox(null, body, 'Offrimi un caffè', MB_OK);
}

window.addEventListener('pagehide', () => {
    if (running && T.hWndMain) SalvaTutto();
});

try {
    await LoadResources();
    loadDonations();
    power.disabled = false;
    hint.textContent = 'Clicca per accendere';
    power.focus({ preventScroll: true });
} catch (err) {
    console.error(err);
    hint.textContent = 'Impossibile caricare le risorse del Tabboz Simulator.';
}

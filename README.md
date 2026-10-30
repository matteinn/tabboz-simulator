# Tabboz Simulator — web edition

Tabboz Simulator (Obscured Truckware, 1997–2000) recreated as a static website: the original
dialogs, art and sounds, running the original game logic in the browser.

**Play it at <https://matteinn.com/tabboz-simulator/>.**

## Run it

Any static file server will do; the page loads ES modules and `fetch`es its resources, so
opening `index.html` straight from disk won't work. For example:

```bash
python3 -m http.server 8137 --directory web
```

Then open <http://localhost:8137>. When editing the code, reload with the browser cache
disabled: Python's server lets the browser keep stale copies of the modules.

To publish it, upload the `web/` folder as it is. This repository does that on every push
to `main`, through GitHub Pages (`.github/workflows/pages.yml`).

## How it is built

- **Resources** in `web/res/` were extracted from the original 0.9beta release: the 81
  dialog templates, menu, strings, bitmaps, icons and cursors of `tabboz.exe`, the Borland
  button and check box glyphs of `BWCC32.DLL`, and the `.wav` sounds.

- **`web/js/win32.js`** is a small slice of the Win32 API: it renders the dialog templates
  (2 px per dialog unit for the 10pt dialogs, so the bitmaps fit exactly as on Windows),
  and provides `DialogBox`, `MessageBox`, `SetDlgItemText`, menus, timers and so on. Calls
  that block on Windows return promises here. It also handles the keyboard as Windows 98
  did: Alt or F10 for the menu bar, Alt+underlined letter, access keys in dialogs, Tab and
  arrow keys.

- **`web/js/game/`** is a line-by-line port of the C sources (`zarrosim.c`, `tempo.c`,
  `eventi.c`, `scuola.c`, `scooter.c`, `vestiti.c`, `tipa.c`, `disco.c`, `lavoro.c`,
  `telefono.c`, `tabimg.c`, `readkey.c`) that Andrea Bonomi published at
  <https://github.com/andreax79/tabboz> (version 0.92q, commit `142fa7d`). Globals shared
  through `zarrosim.h` live on the `T` object in `web/js/state.js`.

The interface comes from the 0.9beta executable, the logic from 0.92q. The
two match dialog for dialog; where 0.92q writes to a control the 0.9beta dialog doesn't have,
the call does nothing, as it would on Windows. Quirks of the original are kept on purpose
(for example the unsigned arithmetic that lets the pocket-money raise succeed once
*Paghetta* exceeds *Studio*).

## Differences from the Windows version

- The game is saved in the browser's `localStorage` instead of the registry, after every
  action and when the page closes. Clearing the site data starts a new tabbozzo.
- The page starts with a desktop icon to click, because browsers only play sound after a
  user gesture.
- Minimizing the main window to the taskbar lets time pass, like the original's timer.
- The *Format* dialog animates its progress bar before resetting the character, and the
  new character gets the default name of the sex you picked (the original reset the name
  before applying the sex, so a new tabbozza was called "Tizio Caio").
- The network server and the debug prompt were already disabled in the original build and
  are not included.

## Donations

If you enjoy this port, you can buy me a coffee over Bitcoin Lightning:
`mortalangle952@walletofsatoshi.com`.

On the site, the *Offrimi un caffè* desktop icon (and the taskbar icon while playing) shows
that address with its QR code; adding `#dona` to the site's address opens it directly. The
address lives in `web/res/donate.json` and its QR code in `web/res/donate-qr.svg`; delete
both to remove the icon.

## License

Tabboz Simulator is © 1997–2000 Andrea Bonomi, Emanuele Caccialanza, Daniele Gazzarri, and is
free software under the GNU General Public License v3 or later. This port is derived from it
and is distributed under the same license; see `LICENSE`.

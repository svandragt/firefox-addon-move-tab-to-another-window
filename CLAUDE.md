# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Firefox extension (Manifest V2) that adds a tab context-menu to move a tab to another browser window or to a new window. All logic lives in `background.js`; there is no build step, bundler, test suite, or linter.

## Development

Load it as a temporary add-on to test changes:

1. Open `about:debugging#/runtime/this-firefox` in Firefox
2. Click "Load Temporary Add-on" and select `manifest.json`
3. Reload the add-on from that page after editing to pick up changes
4. View `console.log` output via the add-on's "Inspect" button (the background page is non-persistent / `persistent: false`)

## Architecture

The whole extension is event-driven from `background.js`:

- On load, `removeAll()` clears any stale items from a previous (non-persistent) script run, then the parent menu `move-tab-to-window` is created.
- `updateWindowsList(currentActiveWindowId)` rebuilds the submenu: it removes every tracked item in `menuItemIds` (plus `move-tab-to-new-window` defensively), then creates one child per window (skipping the active window), plus a "Move to new window..." item.
- The submenu is rebuilt on `contextMenus.onShown` (right before the menu appears) and on `windows.onRemoved`. `onShown` followed by `contextMenus.refresh()` is what makes the menu reflect the current windows.
- `onClicked` dispatches by menu id: ids starting `move-to-window-` parse the target window id from the suffix and call `moveTabToWindow`; `move-tab-to-new-window` calls `createNewWindowWithTab`.
- Shift-clicking a target (`info.modifiers.includes("Shift")`) moves focus to the destination window after the move.

Menu item titles show the active tab's title and tab count per window.

## Releasing

1. Bump `"version"` in `manifest.json`
2. `make package` — produces `move-tab-to-another-window-<version>.zip`
3. Commit `manifest.json` with message `v<version>: <summary>`
4. `git push`
5. `gh release create v<version> move-tab-to-another-window-<version>.zip --title "v<version>" --notes "<release notes>"` — attach the zip
6. Submit the zip to [AMO](https://addons.mozilla.org/developers/)

## Gotchas

- Menu item ids encode the window id as the last `-`-delimited segment (`move-to-window-<id>`); the click handler depends on that format.
- Tracking menu items in `menuItemIds` must stay in sync with what is actually created, or stale items leak between rebuilds.

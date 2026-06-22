# Move Tab to Another Window

A Firefox extension that enables easy movement of tabs between different browser windows through a convenient context
menu.

![image](https://github.com/user-attachments/assets/4c703f16-ba26-4f31-ae3a-a914b3b529b3)


## Features

- Move tabs between existing windows with a right-click
- Create new windows from existing tabs
- Shows the number of tabs in each target window
- Displays window names based on active tab titles
- Shift-click to switch focus to the target window after moving
- Dynamic menu updates when windows change

## Installation

### From Firefox Add-ons (Recommended)

Install from the Firefox Add-ons directory — link coming once published.

### Load as Temporary Add-on (Development)

1. Open Firefox and navigate to about:debugging#/runtime/this-firefox
2. Click "Load Temporary Add-on"
3. Browse to the extension's directory and select manifest.json
4. The add-on will be installed temporarily until Firefox is restarted

## Usage

1. Right-click on any tab you want to move
2. Navigate to "Move tab to another Window"
3. Select a destination window from the list or choose "Move to new window..."
4. Hold Shift while selecting a window to switch focus to it after moving

## Browser Compatibility

- Requires Firefox 142 or later.

## Permissions

This addon requires the following permissions:

- `tabs`: To access and manage browser tabs
- `contextMenus`: To create and manage right-click menu options

## Development

1. Clone this repository
2. Open `about:debugging#/runtime/this-firefox` in Firefox
3. Click **Load Temporary Add-on** and select `manifest.json`
4. After editing, hit **Reload** on that page to pick up changes

## License

This project is open source and available under the MIT License.

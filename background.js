// Store current windows list
// noinspection JSUnresolvedReference

let currentWindows = [];
let menuItemIds = [];

// Create context menu item for moving tab to another window
browser.contextMenus.create( {
    id: "move-tab-to-window",
    title: "Move tab to another Window",
    contexts: [ "tab" ]
} );

let activeWindowId;
browser.windows.getCurrent().then( window => {
    activeWindowId = window.id;
    updateWindowsList( activeWindowId );
} );


// Function to update windows list and menu items
async function updateWindowsList(currentActiveWindowId) { // Added currentActiveWindowId parameter
    console.log( 'Updating windows list...' );
    // Get all windows
    const windows = await browser.windows.getAll( { populate: true } );
    currentWindows = windows;
    console.log(currentWindows);

    // Remove existing window menu items
    menuItemIds.forEach( id => {
        browser.contextMenus.remove( id );
    } );
    menuItemIds = [];

    // Create new menu items for each window, excluding the current one
    windows.forEach( win => {
        if ( win.id === currentActiveWindowId ) { // Skip the current window
            return;
        }
        const windowName = win.title || `Window ${win.id}`;
        const menuId = `move-to-window-${win.id}`;
        browser.contextMenus.create( {
            id: menuId,
            title: `Move to "${windowName}" (${win.tabs.length} tabs)`,
            contexts: [ "tab" ],
            parentId: "move-tab-to-window"
        } );
        menuItemIds.push( menuId );
    } );
}


// Update windows list when context menu is shown
browser.contextMenus.onShown.addListener( (info, tab) => { // tab parameter gives us windowId
    if (tab && tab.windowId) {
        updateWindowsList(tab.windowId); // Pass the current window's ID
    } else {
        // Fallback or error handling if tab info isn't available
        updateWindowsList(null);
    }
} );

// Handle clicks on dynamically created window items
browser.contextMenus.onClicked.addListener((info, tab) => {

    console.log( 'Context menu clicked:', info.menuItemId );
    if (info.menuItemId.startsWith("move-to-window-")) {
        const targetWindowId = parseInt(info.menuItemId.split("-").pop(), 10);
        const switchToTarget = info.modifiers.includes("Shift");
        moveTabToWindow(tab.id, targetWindowId, switchToTarget);
    }
});


// Function to move the tab to the selected window
function moveTabToWindow(tabId, targetWindowId, switchToTarget = false) {
    console.log( `Moving tab ${tabId} to window ${targetWindowId}... Switch focus: ${switchToTarget}` );
    browser.tabs.move(tabId, { windowId: targetWindowId, index: -1 }).then(movedTabInfo => {
        const movedTab = Array.isArray(movedTabInfo) ? movedTabInfo[0] : movedTabInfo;
        console.log(`Tab ${movedTab.id} moved to window ${targetWindowId}`);

        if (switchToTarget) {
            browser.windows.update(targetWindowId, { focused: true }).then(() => {
                console.log(`Switched focus to window ${targetWindowId}`);
                browser.tabs.update(movedTab.id, { active: true }).then(() => {
                    console.log(`Activated tab ${movedTab.id} in window ${targetWindowId}`);
                }).catch(error => {
                    console.error(`Error activating tab: ${error}`);
                });
            }).catch(error => {
                console.error(`Error focusing window: ${error}`);
            });
        }
    }).catch(error => {
        console.error(`Error moving tab: ${error}`);
    });
}
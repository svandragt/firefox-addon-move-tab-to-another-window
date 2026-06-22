let currentWindows = [];
let menuItemIds = [];
let rebuildInProgress = false;
let pendingRebuildWindowId = null;

// Create context menu items for moving tab to another window
browser.contextMenus.create( {
    id: "move-tab-to-window",
    title: "Move tab to another Window",
    contexts: [ "tab" ]
} );

// Listen for window removal
browser.windows.onRemoved.addListener( async ( windowId ) => {
    const currentWindow = await browser.windows.getCurrent();
    await updateWindowsList( currentWindow.id );
} );

async function updateWindowsList( currentActiveWindowId ) {
    if ( rebuildInProgress ) {
        pendingRebuildWindowId = currentActiveWindowId;
        return;
    }
    rebuildInProgress = true;
    try {
        await _rebuildMenu( currentActiveWindowId );
    } finally {
        rebuildInProgress = false;
        if ( pendingRebuildWindowId !== null ) {
            const id = pendingRebuildWindowId;
            pendingRebuildWindowId = null;
            await updateWindowsList( id );
        }
    }
}

async function _rebuildMenu( currentActiveWindowId ) {
    // Get all windows
    const windows = await browser.windows.getAll( { populate: true } );
    currentWindows = windows;

    // Remove ALL items first
    for ( const id of menuItemIds ) {
        try {
            await browser.contextMenus.remove( id );
        } catch ( error ) {
            // Item may already be gone
        }
    }
    menuItemIds = [];

    // Create new menu items for each window
    for ( const win of windows ) {
        if ( win.id === currentActiveWindowId ) {
            continue;
        }

        const activeTabInWin = win.tabs && win.tabs.find( tab => tab.active );
        const windowName = win.title || activeTabInWin?.title || `Window ${win.id}`;
        const menuId = `move-to-window-${win.id}`;

        try {
            await browser.contextMenus.create( {
                id: menuId,
                title: `Move to "${windowName}" (${win.tabs ? win.tabs.length : 0} tabs)`,
                contexts: [ "tab" ],
                parentId: "move-tab-to-window"
            } );
            menuItemIds.push( menuId );
        } catch ( error ) {
            // Skip windows we can't create a menu item for
        }
    }

    await browser.contextMenus.create( {
        id: "move-tab-to-new-window",
        title: `Move to new window...`,
        contexts: [ "tab" ],
        parentId: "move-tab-to-window"
    } );
    menuItemIds.push( "move-tab-to-new-window" );

    try {
        await browser.contextMenus.refresh();
    } catch ( error ) {
        // Refresh may not be available in all contexts
    }
}

async function getSelectedTabIds( tab ) {
    const highlighted = await browser.tabs.query( { highlighted: true, windowId: tab.windowId } );
    return highlighted.length > 1 ? highlighted.map( t => t.id ) : [ tab.id ];
}

// Function to create a new window with the selected tabs
async function createNewWindowWithTabs( tabIds ) {
    const newWindow = await browser.windows.create( { tabId: tabIds[0] } );
    if ( tabIds.length > 1 ) {
        await browser.tabs.move( tabIds.slice( 1 ), { windowId: newWindow.id, index: -1 } );
    }
}

// Update windows list when context menu is shown
browser.contextMenus.onShown.addListener( async ( info, tab ) => {
    try {
        if ( tab && tab.windowId ) {
            await updateWindowsList( tab.windowId );
        } else {
            const currentWindow = await browser.windows.getCurrent();
            await updateWindowsList( currentWindow.id );
        }
    } catch ( error ) {
        // Silently fail if we can't update the menu
    }
} );

// Handle clicks on dynamically created window items
browser.contextMenus.onClicked.addListener( async ( info, tab ) => {
    const tabIds = await getSelectedTabIds( tab );
    if ( info.menuItemId.startsWith( "move-to-window-" ) ) {
        const targetWindowId = parseInt( info.menuItemId.split( "-" ).pop(), 10 );
        const switchToTarget = info.modifiers.includes( "Shift" );
        moveTabsToWindow( tabIds, targetWindowId, switchToTarget );
    } else if ( info.menuItemId === "move-tab-to-new-window" ) {
        createNewWindowWithTabs( tabIds );
    }
} );

// Function to move tabs to the selected window
function moveTabsToWindow( tabIds, targetWindowId, switchToTarget = false ) {
    browser.tabs.move( tabIds, { windowId: targetWindowId, index: -1 } ).then( movedTabInfo => {
        if ( switchToTarget ) {
            const movedTab = Array.isArray( movedTabInfo ) ? movedTabInfo[0] : movedTabInfo;
            browser.windows.update( targetWindowId, { focused: true } ).then( () => {
                browser.tabs.update( movedTab.id, { active: true } );
            } );
        }
    } );
}

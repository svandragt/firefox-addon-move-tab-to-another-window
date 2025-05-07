// Store current windows list
let currentWindows = [];
let menuItemIds = [];

// Create context menu items for moving tab to another window
browser.contextMenus.create( {
    id: "move-tab-to-window",
    title: "Move tab to another Window",
    contexts: [ "tab" ]
} );

// Listen for window removal
browser.windows.onRemoved.addListener( async ( windowId ) => {
    console.log( 'Window removed:', windowId );
    // Get the current active window
    const currentWindow = await browser.windows.getCurrent();
    // Update the windows list with the current window ID
    await updateWindowsList( currentWindow.id );
} );

async function updateWindowsList( currentActiveWindowId ) {
    console.log( 'Updating windows list...', 'Current active window:', currentActiveWindowId );

    // Get all windows
    const windows = await browser.windows.getAll( { populate: true } );
    currentWindows = windows;
    console.log( 'Found windows:', windows.length, 'Windows:', windows.map( w => w.id ) );

    // Remove ALL items first
    for ( const id of menuItemIds ) {
        try {
            await browser.contextMenus.remove( id );
        } catch ( error ) {
            console.warn( `Could not remove menu item ${id}:`, error );
        }
    }
    menuItemIds = [];

    // Create new menu items for each window
    for ( const win of windows ) {
        if ( win.id === currentActiveWindowId ) {
            console.log( `Skipping current window ${win.id}` );
            continue;
        }

        const activeTabInWin = win.tabs && win.tabs.find( tab => tab.active );
        const windowName = activeTabInWin?.title || `Window ${win.id}`;
        const menuId = `move-to-window-${win.id}`;

        console.log( `Creating menu item for window ${win.id} with name "${windowName}"` );

        try {
            await browser.contextMenus.create( {
                id: menuId,
                title: `Move to "${windowName}" (${win.tabs ? win.tabs.length : 0} tabs)`,
                contexts: [ "tab" ],
                parentId: "move-tab-to-window"
            } );
            menuItemIds.push( menuId );
            console.log( `Successfully created menu item ${menuId}` );
        } catch ( error ) {
            console.error( `Error creating menu item for window ${win.id}:`, error );
        }
    }

    await browser.contextMenus.create( {
        id: "move-tab-to-new-window",
        title: `Move to new window...`,
        contexts: [ "tab" ],
        parentId: "move-tab-to-window"
    } );
    menuItemIds.push( menuId );

    // Force refresh the context menu
    try {
        await browser.contextMenus.refresh();
    } catch ( error ) {
        console.error( 'Error refreshing context menu:', error );
    }

    console.log( 'Final menuItemIds:', menuItemIds );


}

// Function to create a new window with the selected tab
function createNewWindowWithTab( tabId ) {
    console.log( `Creating new window with tab ${tabId}` );
    browser.windows.create( { tabId: tabId } ).then( newWindow => {
        console.log( `Created new window ${newWindow.id} with tab ${tabId}` );
    } ).catch( error => {
        console.error( `Error creating new window: ${error}` );
    } );
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
        console.error( "Error updating windows list onShown:", error );
    }
} );

// Handle clicks on dynamically created window items
browser.contextMenus.onClicked.addListener( ( info, tab ) => {
    console.log( 'Context menu clicked:', info.menuItemId );
    if ( info.menuItemId.startsWith( "move-to-window-" ) ) {
        const targetWindowId = parseInt( info.menuItemId.split( "-" ).pop(), 10 );
        const switchToTarget = info.modifiers.includes( "Shift" );
        moveTabToWindow( tab.id, targetWindowId, switchToTarget );
    } else if ( info.menuItemId === "move-tab-to-new-window" ) {
        createNewWindowWithTab( tab.id );
    }
} );

// Function to move the tab to the selected window
function moveTabToWindow( tabId, targetWindowId, switchToTarget = false ) {
    console.log( `Moving tab ${tabId} to window ${targetWindowId}... Switch focus: ${switchToTarget}` );
    browser.tabs.move( tabId, { windowId: targetWindowId, index: -1 } ).then( movedTabInfo => {
        const movedTab = Array.isArray( movedTabInfo ) ? movedTabInfo[0] : movedTabInfo;
        console.log( `Tab ${movedTab.id} moved to window ${targetWindowId}` );

        if ( switchToTarget ) {
            browser.windows.update( targetWindowId, { focused: true } ).then( () => {
                console.log( `Switched focus to window ${targetWindowId}` );
                browser.tabs.update( movedTab.id, { active: true } ).then( () => {
                    console.log( `Activated tab ${movedTab.id} in window ${targetWindowId}` );
                } ).catch( error => {
                    console.error( `Error activating tab: ${error}` );
                } );
            } ).catch( error => {
                console.error( `Error focusing window: ${error}` );
            } );
        }
    } ).catch( error => {
        console.error( `Error moving tab: ${error}` );
    } );
}
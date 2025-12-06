// ============================================
// FW Core - Zentrales Debug-System (NUI/Frontend)
// ============================================
// Verwendung:
//   FWDebug.log('Inventory', 'Item added', itemName, amount)
//   FWDebugTable('Player', 'State', stateObject)
// ============================================

window.FWDebug = (function() {
    let debugEnabled = false;
    
    // Lade Debug-Config vom Client
    const loadDebugConfig = () => {
        window.NUIBridge.send('getDebugConfig', {}, (enabled) => {
            debugEnabled = enabled;
            if (debugEnabled) {
                console.log('[FW Debug] 🐛 Frontend Debug-Modus aktiviert');
            }
        });
    };
    
    // Initial laden
    loadDebugConfig();
    
    // Debug Log mit Kategorie
    const debug = (category, message, ...args) => {
        if (!debugEnabled) return;
        
        const prefix = `[FW:${category}]`;
        if (args.length > 0) {
            console.log(prefix, message, '|', ...args);
        } else {
            console.log(prefix, message);
        }
    };
    
    // Debug Table (für Objekte)
    const debugTable = (category, message, obj) => {
        if (!debugEnabled) return;
        
        console.log(`[FW:${category}] ${message}:`, obj);
    };
    
    // Debug Toggle (für Live-Änderung)
    const setDebug = (enabled) => {
        debugEnabled = enabled;
        console.log('[FW Debug] Debug-Modus:', enabled ? 'AN' : 'AUS');
    };
    
    return {
        log: debug,
        table: debugTable,
        setDebug: setDebug,
        isEnabled: () => debugEnabled
    };
})();

// Globale Shortcuts
window.FWDebug.log = window.FWDebug.log;
window.FWDebugTable = window.FWDebug.table;

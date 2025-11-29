// NUIBridge.js - Brücke zwischen JS-Frontend und FiveM/Lua
// Sendet und empfängt NUI-Events

window.NUIBridge = {
    /**
     * Sendet ein Event an Lua (FiveM)
     * @param {string} action
     * @param {object} data
     * @returns {Promise<any>}
     */
    send(action, data = {}) {
        return new Promise((resolve, reject) => {
            // Für FiveM: window.fetch(`https://${GetParentResourceName()}/${action}`)
            if (typeof GetParentResourceName === 'function') {
                fetch(`https://${GetParentResourceName()}/${action}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                .then(async res => {
                    try {
                        const json = await res.json();
                        resolve(json);
                    } catch {
                        resolve();
                    }
                })
                .catch(reject);
            } else {
                // Für lokalen Browser-Test: Simuliere sofortige Antwort
                setTimeout(() => resolve(), 10);
            }
        });
    },

    /**
     * Registriert einen Listener für NUI-Events aus Lua
     * @param {string} action
     * @param {function} handler
     * @returns {function} unsubscribe
     */
    on(action, handler) {
        const listener = (event) => {
            if (event && event.data && event.data.action === action) {
                handler(event.data);
            }
        };
        window.addEventListener('message', listener);
        // Rückgabe: Unsubscribe-Funktion
        return () => window.removeEventListener('message', listener);
    }
};

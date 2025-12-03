// ============================================
// Pinia Store Mini-Implementation
// (Fallback wenn Pinia nicht verfügbar)
// ============================================

const stores = {};

export function defineStore(id, options) {
    if (stores[id]) {
        return stores[id];
    }
    
    const store = () => {
        if (!store._instance) {
            const state = typeof options.state === 'function' ? options.state() : {};
            const getters = {};
            const actions = {};
            
            // Setup Getters
            if (options.getters) {
                for (const [key, getter] of Object.entries(options.getters)) {
                    Object.defineProperty(getters, key, {
                        get: () => getter(state, getters)
                    });
                }
            }
            
            // Setup Actions
            if (options.actions) {
                for (const [key, action] of Object.entries(options.actions)) {
                    actions[key] = action.bind({ ...state, ...getters, ...actions });
                }
            }
            
            store._instance = { ...state, ...getters, ...actions };
        }
        
        return store._instance;
    };
    
    stores[id] = store;
    return store;
}

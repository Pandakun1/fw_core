// ============================================
// FW Core: Settings Store (Pinia)
// Verwaltet Client-Einstellungen mit KVP-Persistenz
// ============================================

import { defineStore } from './pinia.js';

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        // Nur Inventory Design wird gespeichert
        settings: {
            inventory_design: "forest"
        },
        
        isLoaded: false,
        isSaving: false,
    }),
    
    getters: {
        getSetting: (state) => (key) => {
            return state.settings[key];
        },
        
        getAllSettings: (state) => {
            return state.settings;
        },
        
        // Nur Inventory Design - MUST use arrow function for Pinia
        inventoryDesign: (state) => {
            const design = state.settings['inventory_design'];
            return design || 'forest';
        },
    },
    
    actions: {
        // Initialisierung: Lade Settings vom Client
        async loadSettings(settingsData) {
            FWDebug.log('Settings', 'Loading from client', settingsData);
            
            if (settingsData && typeof settingsData === 'object') {
                // DIREKTE Zuweisung statt Merge für saubere Reaktivität
                // Vue/Pinia erkennt Änderungen sofort bei direkter Objektzuweisung
                Object.keys(settingsData).forEach(key => {
                    this.settings[key] = settingsData[key];
                });
                
                this.isLoaded = true;
                FWDebug.log('Settings', 'Loaded successfully', this.settings);
                
                // Triggere Event für andere Module
                window.dispatchEvent(new CustomEvent('fw:settingsLoaded', { detail: this.settings }));
            } else {
                console.error('[Settings Store] ❌ Invalid settings data received');
            }
        },
        
        // Setze einzelne Einstellung und speichere
        setSetting(key, value) {
            if (!key || value === undefined) {
                FWDebug.log('Settings', 'Invalid key or value');
                return false;
            }
            
            FWDebug.log('Settings', 'Setting', key, '=', value);
            
            // Optimistic Update
            this.settings[key] = value;
            
            // Speichere zum Client (Fire and Forget - keine await)
            fetch(`https://${GetParentResourceName()}/saveSetting`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: key, value: value })
            }).then(response => response.json())
              .then(result => {
                  if (result.success) {
                      FWDebug.log('Settings', 'Saved to server', key);
                      
                      // Triggere Change-Event
                      window.dispatchEvent(new CustomEvent('fw:settingChanged', { 
                          detail: { key, value, settings: this.settings }
                      }));
                  }
              })
              .catch(error => {});
            
            return true;
        },
        
        // Speichere alle Settings (Bulk-Save)
        async saveAllSettings() {
            FWDebug.log('Settings', 'Saving all settings');
            
            this.isSaving = true;
            
            try {
                const response = await fetch(`https://${GetParentResourceName()}/saveSettings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ settings: this.settings })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    FWDebug.log('Settings', 'All saved');
                    return true;
                } else {
                    return false;
                }
            } catch (error) {
                return false;
            } finally {
                this.isSaving = false;
            }
        },
        
        // Setze Settings auf Defaults zurück
        async resetSettings() {
            this.isSaving = true;
            
            try {
                const response = await fetch(`https://${GetParentResourceName()}/resetSettings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.settings = result.settings;
                    
                    // Triggere Event
                    window.dispatchEvent(new CustomEvent('fw:settingsReset', { detail: this.settings }));
                    
                    return true;
                } else {
                    return false;
                }
            } catch (error) {
                return false;
            } finally {
                this.isSaving = false;
            }
        },
        
        // Hole Settings vom Client (Request)
        async requestSettings() {
            FWDebug.log('Settings', 'Requesting from client');
            
            try {
                const response = await fetch(`https://${GetParentResourceName()}/requestSettings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                
                const settings = await response.json();
                
                if (settings && typeof settings === 'object') {
                    this.loadSettings(settings);
                    return true;
                } else {
                    return false;
                }
            } catch (error) {
                return false;
            }
        },
    },
});

// ============================================
// HELPER: Get Parent Resource Name
// ============================================
function GetParentResourceName() {
    return 'fw_core'; // Hardcoded für dieses Projekt
}

// ============================================
// AUTO-INITIALIZATION
// ============================================

// Listener für Settings-Load vom Client
if (typeof window !== 'undefined') {
    window.addEventListener('message', (event) => {
        const data = event.data;
        
        if (data.action === 'loadSettings' && data.settings) {
            FWDebug.log('Settings', 'Received loadSettings from client');
            const store = useSettingsStore();
            store.loadSettings(data.settings);
        }
    });
    
    FWDebug.log('Settings', 'Store initialized');
}

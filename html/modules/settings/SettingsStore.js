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
            console.log('[Settings Store] 🔍 Getter called - state.settings:', JSON.stringify(state.settings));
            console.log('[Settings Store] 🔍 Getter result:', design);
            return design || 'forest';
        },
    },
    
    actions: {
        // Initialisierung: Lade Settings vom Client
        async loadSettings(settingsData) {
            console.log('[Settings Store] 📂 Loading settings from client:', settingsData);
            console.log('[Settings Store] 📂 Settings type:', typeof settingsData);
            console.log('[Settings Store] 📂 Settings keys:', settingsData ? Object.keys(settingsData) : 'none');
            
            if (settingsData && typeof settingsData === 'object') {
                // DIREKTE Zuweisung statt Merge für saubere Reaktivität
                // Vue/Pinia erkennt Änderungen sofort bei direkter Objektzuweisung
                Object.keys(settingsData).forEach(key => {
                    this.settings[key] = settingsData[key];
                });
                
                console.log('[Settings Store] 📦 Updated settings:', JSON.stringify(this.settings));
                console.log('[Settings Store] 🔍 Direct access this.settings.inventory_design:', this.settings.inventory_design);
                console.log('[Settings Store] 🔍 Direct access this.settings["inventory_design"]:', this.settings['inventory_design']);
                console.log('[Settings Store] 📦 inventoryDesign getter:', this.inventoryDesign);
                
                this.isLoaded = true;
                console.log('[Settings Store] ✅ Settings loaded successfully');
                
                // Triggere Event für andere Module
                window.dispatchEvent(new CustomEvent('fw:settingsLoaded', { detail: this.settings }));
            } else {
                console.error('[Settings Store] ❌ Invalid settings data received');
            }
        },
        
        // Setze einzelne Einstellung und speichere
        setSetting(key, value) {
            if (!key || value === undefined) {
                console.error('[Settings Store] ❌ Invalid key or value');
                return false;
            }
            
            console.log(`[Settings Store] 💾 Setting ${key} = ${value}`);
            
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
                      console.log(`[Settings Store] ✅ Setting ${key} saved to server`);
                      
                      // Triggere Change-Event
                      window.dispatchEvent(new CustomEvent('fw:settingChanged', { 
                          detail: { key, value, settings: this.settings }
                      }));
                  }
              })
              .catch(error => {
                  console.log('[Settings Store] Running in browser, server save skipped');
              });
            
            return true;
        },
        
        // Speichere alle Settings (Bulk-Save)
        async saveAllSettings() {
            console.log('[Settings Store] 💾 Saving all settings...');
            
            this.isSaving = true;
            
            try {
                const response = await fetch(`https://${GetParentResourceName()}/saveSettings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ settings: this.settings })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log('[Settings Store] ✅ All settings saved');
                    return true;
                } else {
                    console.error('[Settings Store] ❌ Failed to save settings:', result.error);
                    return false;
                }
            } catch (error) {
                console.error('[Settings Store] ❌ Error saving settings:', error);
                return false;
            } finally {
                this.isSaving = false;
            }
        },
        
        // Setze Settings auf Defaults zurück
        async resetSettings() {
            console.log('[Settings Store] 🔄 Resetting settings to defaults...');
            
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
                    console.log('[Settings Store] ✅ Settings reset to defaults');
                    
                    // Triggere Event
                    window.dispatchEvent(new CustomEvent('fw:settingsReset', { detail: this.settings }));
                    
                    return true;
                } else {
                    console.error('[Settings Store] ❌ Failed to reset settings');
                    return false;
                }
            } catch (error) {
                console.error('[Settings Store] ❌ Error resetting settings:', error);
                return false;
            } finally {
                this.isSaving = false;
            }
        },
        
        // Hole Settings vom Client (Request)
        async requestSettings() {
            console.log('[Settings Store] 📨 Requesting settings from client...');
            
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
                    console.error('[Settings Store] ❌ Invalid settings received from request');
                    return false;
                }
            } catch (error) {
                console.error('[Settings Store] ❌ Error requesting settings:', error);
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
            console.log('[Settings Store] 📥 Received loadSettings from client');
            const store = useSettingsStore();
            store.loadSettings(data.settings);
        }
    });
    
    console.log('[Settings Store] ⚙️ Settings Store initialized');
}

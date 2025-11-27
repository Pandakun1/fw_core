/**
 * Inventory Store - Verwaltung des Inventar-States
 */
const { defineStore } = Pinia;

// Wir definieren den Store und hängen ihn direkt an window, damit er global verfügbar ist
window.useInventoryStore = defineStore('inventory', {
    // 1. STATE (Die Daten)
    state: () => ({
        // Inventory Data
        items: [],           // Array of items
        maxWeight: 50,
        currentWeight: 0,
        maxSlots: 20,        // 5x4 Grid
        
        // Ground Items (nearby)
        groundItems: [],
        
        // UI State
        isOpen: false,
        selectedSlot: null,
        contextMenu: {
            visible: false,
            x: 0,
            y: 0,
            item: null
        },
        
        // Drag & Drop State
        draggedItem: null,
        dragSourceSlot: null
    }),

    // 2. GETTERS (Berechnete Werte)
    getters: {
        getItemBySlot: (state) => (slot) => {
            return state.items.find(item => item.slot === slot) || null;
        },

        freeSlots: (state) => {
            const usedSlots = state.items.map(item => item.slot);
            return state.maxSlots - usedSlots.length;
        },

        weightPercent: (state) => {
            if (state.maxWeight === 0) return 0;
            return Math.min(100, (state.currentWeight / state.maxWeight) * 100);
        },

        slotsGrid: (state) => {
            const grid = [];
            for (let i = 0; i < state.maxSlots; i++) {
                const item = state.items.find(item => item.slot === i);
                grid.push({
                    slot: i,
                    item: item || null
                });
            }
            return grid;
        }
    },

    // 3. ACTIONS (Funktionen)
    actions: {
        open() {
            this.isOpen = true;
            console.log('[InventoryStore] Inventory opened');
        },

        close() {
            this.isOpen = false;
            this.selectedSlot = null;
            this.hideContextMenu();
            this.clearDrag();
            // Optional: Fokus entfernen via NUI
            if(window.NUIBridge) window.NUIBridge.send('closeInventory'); 
        },

        loadInventoryData(data) {
            console.log('[InventoryStore] Loading inventory data', data);
            
            // Mapping sicherstellen (Falls data.inventory oder data.main kommt)
            this.items = data.main || data.inventory || []; 
            this.maxWeight = data.maxWeight || 50;
            this.groundItems = data.groundItems || [];
            
            this.recalculateWeight();
        },

        recalculateWeight() {
            this.currentWeight = this.items.reduce((sum, item) => {
                return sum + ((item.weight || 0) * (item.amount || 1));
            }, 0);
        },

        // Context Menu
        showContextMenu(x, y, item) {
            this.contextMenu = { visible: true, x, y, item };
        },
        hideContextMenu() {
            this.contextMenu = { visible: false, x: 0, y: 0, item: null };
        },

        // Drag & Drop
        startDrag(slot, item) {
            this.draggedItem = item;
            this.dragSourceSlot = slot;
        },
        endDrag(targetSlot) {
            if (this.dragSourceSlot === null) return;
            
            // Server Request
            if(window.NUIBridge) {
                window.NUIBridge.send('moveItem', {
                    fromSlot: this.dragSourceSlot,
                    toSlot: targetSlot
                });
            }
            
            // Optimistisches Update im UI (optional, sonst auf Server warten)
            // this.updateItem(...) 
            
            this.clearDrag();
        },
        clearDrag() {
            this.draggedItem = null;
            this.dragSourceSlot = null;
        },

        // Item Actions
        async useItem(item, slot) {
            if(window.NUIBridge) {
                await window.NUIBridge.send('useItem', { 
                    name: item.name, // WICHTIG: name statt itemName, damit Lua es direkt versteht
                    slot: slot 
                });
            }
        },

        async dropItem(item, slot, amount = 1) {
            if(window.NUIBridge) {
                await window.NUIBridge.send('dropItem', { 
                    name: item.name,
                    slot: slot, 
                    amount: amount 
                });
            }
        },

        async giveItem(item, slot, amount = 1) {
            if(window.NUIBridge) {
                await window.NUIBridge.send('giveItem', { 
                    name: item.name,
                    slot: slot, 
                    amount: amount 
                });
            }
        }
    }
});
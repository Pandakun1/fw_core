/**
 * Inventory Store
 */
// KEIN const { defineStore } = Pinia; hier!

window.useInventoryStore = Pinia.defineStore('inventory', {
    state: () => ({
        items: [],
        maxWeight: 50,
        currentWeight: 0,
        maxSlots: 20,
        groundItems: [],
        isOpen: false,
        selectedSlot: null,
        contextMenu: { visible: false, x: 0, y: 0, item: null },
        draggedItem: null,
        dragSourceSlot: null
    }),

    getters: {
        getItemBySlot: (state) => (slot) => state.items.find(item => item.slot === slot) || null,
        freeSlots: (state) => state.maxSlots - state.items.map(item => item.slot).length,
        weightPercent: (state) => state.maxWeight === 0 ? 0 : Math.min(100, (state.currentWeight / state.maxWeight) * 100),
        slotsGrid: (state) => {
            const grid = [];
            for (let i = 0; i < state.maxSlots; i++) {
                grid.push({ slot: i, item: state.items.find(item => item.slot === i) || null });
            }
            return grid;
        }
    },

    actions: {
        open() { this.isOpen = true; },
        close() { 
            this.isOpen = false; 
            this.selectedSlot = null; 
            this.hideContextMenu(); 
            this.clearDrag();
            if(window.NUIBridge) window.NUIBridge.send('closeInventory');
        },
        loadInventoryData(data) {
            this.items = data.main || data.inventory || [];
            this.maxWeight = data.maxWeight || 50;
            this.groundItems = data.groundItems || [];
            this.recalculateWeight();
        },
        recalculateWeight() {
            this.currentWeight = this.items.reduce((sum, item) => sum + ((item.weight || 0) * (item.amount || 1)), 0);
        },
        showContextMenu(x, y, item) { this.contextMenu = { visible: true, x, y, item }; },
        hideContextMenu() { this.contextMenu = { visible: false, x: 0, y: 0, item: null }; },
        startDrag(slot, item) { this.draggedItem = item; this.dragSourceSlot = slot; },
        endDrag(targetSlot) {
            if (this.dragSourceSlot === null) return;
            if(window.NUIBridge) window.NUIBridge.send('moveItem', { fromSlot: this.dragSourceSlot, toSlot: targetSlot });
            this.clearDrag();
        },
        clearDrag() { this.draggedItem = null; this.dragSourceSlot = null; },
        async useItem(item, slot) { if(window.NUIBridge) await window.NUIBridge.send('useItem', { name: item.name, slot: slot }); },
        async dropItem(item, slot, amount = 1) { if(window.NUIBridge) await window.NUIBridge.send('dropItem', { name: item.name, slot: slot, amount }); },
        async giveItem(item, slot, amount = 1) { if(window.NUIBridge) await window.NUIBridge.send('giveItem', { name: item.name, slot: slot, amount }); }
    }
});
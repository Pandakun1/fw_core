window.useInventoryStore = Pinia.defineStore('inventory', {
    state: () => ({
        items: Array(50).fill(null),
        maxWeight: 50,
        currentWeight: 0,
        maxSlots: 50,
        isOpen: false,
        layoutKey: 'briefcase',
        themeKey: 'classicLeather',
        animationKey: 'none'
    }),

    getters: {
        getItemBySlot: (state) => (slot) => {
            return state.items[slot] || null;
        },
        freeSlots: (state) => {
            return state.items.filter(item => item === null).length;
        },
        filledSlots: (state) => {
            return state.items.filter(item => item !== null).length;
        }
    },

    actions: {
        open() {
            this.isOpen = true;
        },
        close() {
            this.isOpen = false;
            if(window.NUIBridge) window.NUIBridge.send('closeInventory');
        },
        loadInventoryData(data) {
            // Convert old format to new format (50 slots)
            const newItems = Array(50).fill(null);
            
            if (data.main || data.inventory) {
                const items = data.main || data.inventory;
                items.forEach(item => {
                    if (item.slot >= 0 && item.slot < 50) {
                        newItems[item.slot] = {
                            id: item.slot,
                            name: item.label || item.name,
                            emoji: item.emoji || '📦',
                            quantity: item.amount || 1
                        };
                    }
                });
            }
            
            this.items = newItems;
            this.maxWeight = data.maxWeight || 50;
            this.recalculateWeight();
        },
        recalculateWeight() {
            this.currentWeight = this.items
                .filter(item => item !== null)
                .reduce((sum, item) => sum + ((item.weight || 1) * (item.quantity || 1)), 0);
        },
        moveItem(fromSlot, toSlot) {
            const itemA = this.items[fromSlot];
            const itemB = this.items[toSlot];
            
            if (itemA === null) return;
            
            this.items[toSlot] = itemA;
            this.items[fromSlot] = itemB;
            
            if(window.NUIBridge) window.NUIBridge.send('moveItem', { fromSlot, toSlot });
        }
    }
});
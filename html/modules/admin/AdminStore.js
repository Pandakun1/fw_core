/**
 * Admin Store
 */
// KEIN const { defineStore } = Pinia; hier!

window.useAdminStore = Pinia.defineStore('admin', {
    state: () => ({
        isOpen: false,
        selectedCategory: 'players',
        selectedPlayer: null,
        players: [],
        vehicles: [],
        items: [],
        categories: [
            { id: 'players', label: 'Spieler', icon: '👥' },
            { id: 'creators', label: 'Creator Tools', icon: '🛠️' },
            { id: 'vehicles', label: 'Fahrzeuge', icon: '🚗' },
            { id: 'items', label: 'Items', icon: '📦' },
            { id: 'noclip', label: 'Noclip', icon: '✈️' }
        ],
        noclipEnabled: false,
        godmodeEnabled: false
    }),

    getters: {
        currentCategory: (state) => state.categories.find(c => c.id === state.selectedCategory),
        onlinePlayersCount: (state) => state.players.length
    },

    actions: {
        open() { this.isOpen = true; this.loadPlayers(); },
        close() { this.isOpen = false; this.selectedPlayer = null; },
        selectCategory(categoryId) {
            this.selectedCategory = categoryId;
            if (categoryId === 'players') this.loadPlayers();
            if (categoryId === 'vehicles') this.loadVehicles();
            if (categoryId === 'items') this.loadItems();
            if (categoryId === 'creators') this.loadCreators();

        },
        selectPlayer(player) { this.selectedPlayer = player; },
        
        async loadPlayers() {
            if(!window.NUIBridge) return;
            try {
                const res = await window.NUIBridge.send('admin:getPlayers');
                this.players = res?.players || [];
            } catch (e) { console.log(e); }
        },
        async loadVehicles() {
            if(!window.NUIBridge) return;
            try {
                const res = await window.NUIBridge.send('admin:getVehicles');
                this.vehicles = res?.vehicles || [];
            } catch (e) { console.log(e); }
        },
        async loadItems() {
            if(!window.NUIBridge) return;
            try {
                const res = await window.NUIBridge.send('admin:getItems');
                this.items = res?.items || [];
            } catch (e) { console.log(e); }
        },
        
        // Actions
        teleportToPlayer(playerId) { window.NUIBridge.send('admin:teleportToPlayer', { playerId }); },
        healPlayer(playerId) { window.NUIBridge.send('admin:healPlayer', { playerId }); },
        kickPlayer(playerId, reason) { window.NUIBridge.send('admin:kickPlayer', { playerId, reason }).then(() => this.loadPlayers()); },
        spawnVehicle(model) { window.NUIBridge.send('admin:spawnVehicle', { model }); },
        giveItem(playerId, itemName, amount) { window.NUIBridge.send('admin:giveItem', { playerId, itemName, amount }); },
        
        toggleNoclip() {
            this.noclipEnabled = !this.noclipEnabled;
            window.NUIBridge.send('admin:toggleNoclip', { enabled: this.noclipEnabled });
        },
        toggleGodmode() {
            this.godmodeEnabled = !this.godmodeEnabled;
            window.NUIBridge.send('admin:toggleGodmode', { enabled: this.godmodeEnabled });
        },
        loadCreators() {
            this.creatorModeEnabled = !this.creatorModeEnabled;
            window.NUIBridge.send('admin:toggleCreatorMode', { enabled: this.creatorModeEnabled });
            // Implementation for loading creator tools
        }
        
    }
});
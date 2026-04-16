import { defineStore } from '../settings/pinia.js';

export const useGarageStore = defineStore('garage', {
    state: () => ({
        isOpen: false,
        vehicles: [],
        selectedVehicle: null,
        filter: 'all',
        isLoading: false
    }),

    getters: {
        filteredVehicles: (state) => {
            if (state.filter === 'all') return state.vehicles;
            if (state.filter === 'owned') return state.vehicles.filter(v => v.owned);
            if (state.filter === 'stored') return state.vehicles.filter(v => v.stored);
            return state.vehicles;
        },

        selectedVehicleData: (state) => {
            if (!state.selectedVehicle) return null;
            return state.vehicles.find(v => v.plate === state.selectedVehicle) || null;
        }
    },

    actions: {
        open() {
            this.isOpen = true;
        },

        close() {
            this.isOpen = false;
            this.selectedVehicle = null;
            this.filter = 'all';
        },

        async loadVehicles() {
            this.isLoading = true;
            try {
                const result = await window.NUIBridge.send('garage:getVehicles');
                this.vehicles = result.vehicles || [];
            } catch (error) {
                console.error('[GarageStore] Error loading vehicles:', error);
                this.vehicles = [];
            } finally {
                this.isLoading = false;
            }
        },

        selectVehicle(plate) {
            this.selectedVehicle = plate;
        },

        setFilter(filter) {
            this.filter = filter;
        },

        async spawnVehicle(plate) {
            try {
                await window.NUIBridge.send('garage:spawnVehicle', { plate });
                this.close();
            } catch (error) {
                console.error('[GarageStore] Error spawning vehicle:', error);
            }
        },

        async storeVehicle(plate) {
            try {
                await window.NUIBridge.send('garage:storeVehicle', { plate });
            } catch (error) {
                console.error('[GarageStore] Error storing vehicle:', error);
            }
        }
    }
});

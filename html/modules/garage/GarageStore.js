import { defineStore } from '../settings/pinia.js';

export const useGarageStore = defineStore('garage', {
    state: () => ({
        isOpen: false,
        vehicles: [],
        selectedVehicle: null,
        isLoading: false,
        search: ''
    }),

    getters: {
        ownedVehicles: (state) => {
            return (state.vehicles || []).filter((vehicle) => vehicle.owned);
        },

        filteredVehicles: (state, getters) => {
            const query = String(state.search || '').toLowerCase().trim();
            if (!query) return getters.ownedVehicles || [];

            return (getters.ownedVehicles || []).filter((vehicle) => {
                return String(vehicle.model || '').toLowerCase().includes(query)
                    || String(vehicle.plate || '').toLowerCase().includes(query)
                    || String(vehicle.state || '').toLowerCase().includes(query);
            });
        },

        selectedVehicleData: (state, getters) => {
            const list = getters.ownedVehicles || [];
            if (!state.selectedVehicle) {
                return list[0] || null;
            }
            return list.find((v) => v.plate === state.selectedVehicle) || list[0] || null;
        }
    },

    actions: {
        open() {
            this.isOpen = true;
        },

        close() {
            this.isOpen = false;
            this.selectedVehicle = null;
            this.search = '';
        },

        async loadVehicles() {
            this.isLoading = true;
            try {
                const result = await window.NUIBridge.send('garage:getVehicles');
                this.vehicles = Array.isArray(result?.vehicles) ? result.vehicles : [];
                if (!this.selectedVehicle && this.vehicles.length > 0) {
                    this.selectedVehicle = this.vehicles[0].plate;
                }
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

        setSearch(value) {
            this.search = value || '';
        },

        async spawnVehicle(plate) {
            try {
                await window.NUIBridge.send('garage:spawnVehicle', { plate });
                this.isOpen = false;
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

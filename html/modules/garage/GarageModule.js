const useNUI = window.useNUI;
const { computed, onMounted, onUnmounted, ref } = Vue;
const MathRef = window.Math;

const GarageModule = {
    name: 'GarageModule',
    props: ['data'],

    setup() {
        const { send } = useNUI();
        const isOpen = ref(true);
        const isLoading = ref(false);
        const vehicles = ref([]);
        const selectedPlate = ref(null);
        const searchQuery = ref('');

        const filteredVehicles = computed(() => {
            const query = String(searchQuery.value || '').toLowerCase().trim();
            const ownedVehicles = (vehicles.value || []).filter((vehicle) => vehicle.owned);

            if (!query) {
                return ownedVehicles;
            }

            return ownedVehicles.filter((vehicle) => {
                return String(vehicle.model || '').toLowerCase().includes(query)
                    || String(vehicle.plate || '').toLowerCase().includes(query)
                    || String(vehicle.state || '').toLowerCase().includes(query)
                    || String(vehicle.owner_identifier || '').toLowerCase().includes(query);
            });
        });

        const selectedVehicle = computed(() => {
            const list = filteredVehicles.value;
            if (!list.length) return null;
            if (!selectedPlate.value) return list[0];
            return list.find((vehicle) => vehicle.plate === selectedPlate.value) || list[0];
        });

        const loadVehicles = async () => {
            isLoading.value = true;
            try {
                const result = await window.NUIBridge.send('garage:getVehicles');
                vehicles.value = Array.isArray(result?.vehicles) ? result.vehicles : [];
                if (vehicles.value.length > 0 && !selectedPlate.value) {
                    selectedPlate.value = vehicles.value[0].plate;
                }
            } catch (error) {
                console.error('[GarageModule] Error loading vehicles:', error);
                vehicles.value = [];
            } finally {
                isLoading.value = false;
            }
        };

        const closeUi = async () => {
            console.log('[FW.Garage][UI] closeUi called');
            isOpen.value = false;
            try {
                await send('closeGarage');
            } catch (error) {
                console.error('[GarageModule] Error closing garage:', error);
            }
        };

        const handleSelectVehicle = (vehicle) => {
            if (!vehicle) return;
            selectedPlate.value = vehicle.plate;
        };

        const handleSpawn = async () => {
            if (!selectedVehicle.value) return;
            try {
                await window.NUIBridge.send('garage:spawnVehicle', { plate: selectedVehicle.value.plate });
                isOpen.value = false;
            } catch (error) {
                console.error('[GarageModule] Error spawning vehicle:', error);
            }
        };

        const handleStore = async () => {
            if (!selectedVehicle.value) return;
            try {
                await window.NUIBridge.send('garage:storeVehicle', { plate: selectedVehicle.value.plate });
                await loadVehicles();
            } catch (error) {
                console.error('[GarageModule] Error storing vehicle:', error);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                console.log('[FW.Garage][UI] ESC detected');
                e.preventDefault();
                e.stopPropagation();
                closeUi();
            }
        };

        onMounted(async () => {
            console.log('[FW.Garage][UI] GarageModule mounted');
            window.addEventListener('keydown', handleKeyDown, true);
            await loadVehicles();
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyDown, true);
        });


        return {
            isOpen,
            isLoading,
            searchQuery,
            filteredVehicles,
            selectedVehicle,
            handleSelectVehicle,
            handleSpawn,
            handleStore,
            closeUi,
            MathRef
        };
    },

    template: `
    <div v-if="isOpen" class="w-full h-full flex items-center justify-center font-sans text-white pointer-events-auto">
        <div class="w-[1180px] h-[760px] rounded-[28px] border border-[#22314a] bg-[#0a0f15]/96 shadow-[0_30px_80px_rgba(0,0,0,0.55)] overflow-hidden flex backdrop-blur-xl">
            <div class="w-[420px] border-r border-[#1f2b3f] bg-[#0d131d] flex flex-col">
                <div class="p-6 border-b border-[#1f2b3f]">
                    <div class="text-xs uppercase tracking-[0.28em] text-slate-500 mb-2">Owned Vehicles</div>
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-3xl font-bold text-white">Garage</h2>
                        <div class="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-cyan-300 text-sm font-semibold">
                            {{ filteredVehicles.length }}
                        </div>
                    </div>
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Suche Modell, Kennzeichen oder Status"
                        class="w-full rounded-2xl border border-[#233148] bg-[#0b1017] px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                    >
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-3">
                    <div v-if="isLoading" class="h-full flex items-center justify-center text-slate-400">
                        Lade Fahrzeuge...
                    </div>

                    <div v-else-if="filteredVehicles.length === 0" class="h-full flex items-center justify-center text-center px-6">
                        <div>
                            <div class="text-5xl mb-4">Fahrzeuge</div>
                            <div class="text-xl font-semibold text-white mb-2">Keine Fahrzeuge gefunden</div>
                            <div class="text-sm text-slate-400">Prüfe die DB-Einträge oder erstelle ein Testfahrzeug mit /giveownedvehicle adder</div>
                        </div>
                    </div>

                    <button
                        v-for="vehicle in filteredVehicles"
                        :key="vehicle.plate"
                        @click="handleSelectVehicle(vehicle)"
                        class="w-full text-left rounded-2xl border p-4 transition-all duration-150"
                        :class="selectedVehicle?.plate === vehicle.plate
                            ? 'border-cyan-500 bg-[#152132] shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                            : 'border-[#223048] bg-[#101722] hover:bg-[#141d2a]'"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="text-lg font-bold text-white leading-tight">{{ vehicle.model || 'Unbekannt' }}</div>
                                <div class="text-sm text-slate-400 mt-1">{{ vehicle.plate }}</div>
                            </div>
                            <div
                                class="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide"
                                :class="vehicle.stored
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'"
                            >
                                {{ vehicle.stored ? 'EINGEPARKT' : 'DRAUSSEN' }}
                            </div>
                        </div>
                        <div class="mt-4 flex items-center justify-between text-sm text-slate-400 gap-4">
                            <span>Fuel {{ MathRef.round(vehicle.fuel || 0) }}%</span>
                            <span class="truncate">{{ vehicle.owner_identifier }}</span>
                        </div>
                    </button>
                </div>
            </div>

            <div class="flex-1 bg-gradient-to-br from-[#0b1016] to-[#0f1722] flex flex-col">
                <div class="px-8 py-6 border-b border-[#1f2b3f] flex items-center justify-between">
                    <div>
                        <div class="text-xs uppercase tracking-[0.28em] text-slate-500 mb-2">Vehicle Details</div>
                        <h3 class="text-3xl font-bold text-white">{{ selectedVehicle ? selectedVehicle.model : 'Garage Übersicht' }}</h3>
                    </div>
                    <button
                        @click="closeUi"
                        class="w-12 h-12 rounded-2xl bg-[#121b28] hover:bg-[#1a2636] border border-[#233148] text-slate-300 text-xl"
                    >X</button>
                </div>

                <div class="flex-1 p-8 overflow-y-auto">
                    <div v-if="!selectedVehicle" class="h-full flex items-center justify-center text-center">
                        <div>
                            <div class="text-2xl font-semibold text-white mb-2">Wähle links ein Fahrzeug</div>
                            <div class="text-slate-400">Die Liste zeigt nur Fahrzeuge, die aktuell als owned erkannt werden.</div>
                        </div>
                    </div>

                    <div v-else class="space-y-6">
                        <div class="grid grid-cols-2 gap-5">
                            <div class="rounded-3xl border border-[#223148] bg-[#111925] p-6">
                                <div class="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Kennzeichen</div>
                                <div class="text-3xl font-bold text-white">{{ selectedVehicle.plate }}</div>
                            </div>
                            <div class="rounded-3xl border border-[#223148] bg-[#111925] p-6">
                                <div class="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Status</div>
                                <div class="text-3xl font-bold" :class="selectedVehicle.stored ? 'text-emerald-400' : 'text-amber-300'">
                                    {{ selectedVehicle.stored ? 'Eingeparkt' : 'Draußen' }}
                                </div>
                            </div>
                        </div>

                        <div class="rounded-3xl border border-[#223148] bg-[#111925] p-6">
                            <div class="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">Fahrzeugdaten</div>
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div class="rounded-2xl bg-[#0b1118] p-4 border border-[#1b2838]">
                                    <div class="text-slate-500 mb-1">Modell</div>
                                    <div class="text-white font-semibold">{{ selectedVehicle.vehicleModel || selectedVehicle.model }}</div>
                                </div>
                                <div class="rounded-2xl bg-[#0b1118] p-4 border border-[#1b2838]">
                                    <div class="text-slate-500 mb-1">Fuel</div>
                                    <div class="text-white font-semibold">{{ MathRef.round(selectedVehicle.fuel || 0) }}%</div>
                                </div>
                                <div class="rounded-2xl bg-[#0b1118] p-4 border border-[#1b2838] col-span-2">
                                    <div class="text-slate-500 mb-1">Owner Identifier</div>
                                    <div class="text-cyan-300 font-semibold break-all">{{ selectedVehicle.owner_identifier }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="rounded-3xl border border-[#223148] bg-[#111925] p-6">
                            <div class="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">Aktionen</div>
                            <div class="grid grid-cols-2 gap-4">
                                <button
                                    v-if="selectedVehicle.stored"
                                    @click="handleSpawn"
                                    class="rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white py-4 font-bold text-lg transition"
                                >Ausparken</button>
                                <button
                                    v-else
                                    @click="handleStore"
                                    class="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white py-4 font-bold text-lg transition"
                                >Einparken</button>
                                <div class="rounded-2xl border border-[#243249] bg-[#0b1118] px-4 py-4 text-slate-400 text-sm flex items-center justify-center text-center">
                                    ESC oder X schließen die UI jetzt vollständig.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};

export default GarageModule;

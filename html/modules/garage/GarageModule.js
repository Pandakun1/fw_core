import { useGarageStore } from './GarageStore.js';

const useNUI = window.useNUI;
const { ref, computed, watch, onMounted, onUnmounted } = Vue;
const MathRef = window.Math;

const GarageModule = {
    name: 'GarageModule',
    props: ['data'],

    setup() {
        const garageStore = useGarageStore();
        const { send, onClose } = useNUI();
        const searchQuery = ref('');

        const isOpen = computed(() => garageStore.isOpen);
        const vehicles = computed(() => {
            const filtered = garageStore.filteredVehicles || [];
            if (!searchQuery.value) return filtered;

            return filtered.filter((v) =>
                String(v.model || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                String(v.plate || '').toLowerCase().includes(searchQuery.value.toLowerCase())
            );
        });
        const selectedVehicle = computed(() => garageStore.selectedVehicleData);
        const isLoading = computed(() => garageStore.isLoading);

        const handleClose = () => {
            garageStore.close();
            send('closeGarage');
        };

        const handleSelectVehicle = (vehicle) => {
            garageStore.selectVehicle(vehicle.plate);
        };

        const handleSpawn = async () => {
            if (!selectedVehicle.value) return;
            await garageStore.spawnVehicle(selectedVehicle.value.plate);
        };

        const handleStore = async () => {
            if (!selectedVehicle.value) return;
            await garageStore.storeVehicle(selectedVehicle.value.plate);
            await garageStore.loadVehicles();
        };

        const setFilter = (filter) => {
            garageStore.setFilter(filter);
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            }
        };

        watch(isOpen, async (value) => {
            if (value) {
                await garageStore.loadVehicles();
            }
        }, { immediate: true });

        onMounted(() => {
            garageStore.open();
            window.addEventListener('keydown', handleKeyDown);
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyDown);
            garageStore.close();
        });

        onClose(handleClose);

        return {
            isOpen,
            vehicles,
            selectedVehicle,
            isLoading,
            searchQuery,
            garageStore,
            handleClose,
            handleSelectVehicle,
            handleSpawn,
            handleStore,
            setFilter,
            MathRef
        };
    },

    template: `
    <div class="w-full h-full flex items-center justify-center font-sans text-white pointer-events-auto">
        <div v-if="isOpen" class="w-[1100px] min-h-[680px] max-h-[86vh] bg-[#10141c]/95 rounded-3xl flex shadow-2xl overflow-hidden border border-[#233048] backdrop-blur-md">
            <div class="w-[62%] border-r border-[#233048] flex flex-col bg-gradient-to-b from-[#131a25] to-[#0d1218]">
                <div class="p-6 border-b border-[#233048]">
                    <div class="flex items-center justify-between gap-4 mb-4">
                        <div>
                            <div class="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">Vehicle Storage</div>
                            <h2 class="text-3xl font-bold text-white">Garage</h2>
                        </div>
                        <div class="px-4 py-2 rounded-xl bg-[#182131] border border-[#2b3d5a] text-slate-300 text-sm">
                            {{ vehicles.length }} Fahrzeuge
                        </div>
                    </div>
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Suche nach Modell oder Kennzeichen..."
                        class="w-full px-4 py-3 rounded-2xl bg-[#0c1118] border border-[#2a3952] text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                    >
                </div>

                <div class="flex gap-2 px-6 py-4 border-b border-[#233048] bg-[#0f1620]">
                    <button
                        @click="setFilter('all')"
                        class="px-4 py-2 rounded-xl text-sm font-semibold transition"
                        :class="garageStore.filter === 'all' ? 'bg-cyan-600 text-white' : 'bg-[#172131] text-slate-300 hover:bg-[#1d2a3d]'"
                    >Alle</button>
                    <button
                        @click="setFilter('stored')"
                        class="px-4 py-2 rounded-xl text-sm font-semibold transition"
                        :class="garageStore.filter === 'stored' ? 'bg-emerald-600 text-white' : 'bg-[#172131] text-slate-300 hover:bg-[#1d2a3d]'"
                    >Eingeparkt</button>
                    <button
                        @click="setFilter('owned')"
                        class="px-4 py-2 rounded-xl text-sm font-semibold transition"
                        :class="garageStore.filter === 'owned' ? 'bg-amber-500 text-black' : 'bg-[#172131] text-slate-300 hover:bg-[#1d2a3d]'"
                    >Owned</button>
                </div>

                <div class="flex-1 overflow-y-auto p-5 space-y-3">
                    <div v-if="isLoading" class="h-full flex items-center justify-center text-slate-400 text-lg">
                        Lade Fahrzeuge...
                    </div>

                    <div v-else-if="vehicles.length === 0" class="h-full flex items-center justify-center">
                        <div class="text-center text-slate-400">
                            <div class="text-5xl mb-4">🚘</div>
                            <div class="text-xl font-semibold text-white mb-2">Keine Fahrzeuge gefunden</div>
                            <div class="text-sm text-slate-400">Erstelle testweise ein Fahrzeug mit /giveownedvehicle adder</div>
                        </div>
                    </div>

                    <button
                        v-else
                        v-for="vehicle in vehicles"
                        :key="vehicle.plate"
                        @click="handleSelectVehicle(vehicle)"
                        class="w-full text-left rounded-2xl border p-4 transition-all"
                        :class="selectedVehicle?.plate === vehicle.plate
                            ? 'border-cyan-500 bg-[#162131] shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
                            : 'border-[#253449] bg-[#111822] hover:bg-[#16202c]'"
                    >
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <div class="text-lg font-bold text-white">{{ vehicle.model || 'Unbekannt' }}</div>
                                <div class="text-sm text-slate-400 mt-1">Kennzeichen: {{ vehicle.plate }}</div>
                                <div class="text-xs text-slate-500 mt-2">Identifier: {{ vehicle.owner_identifier }}</div>
                            </div>

                            <div class="flex flex-col items-end gap-2">
                                <div
                                    class="px-3 py-1 rounded-full text-xs font-bold"
                                    :class="vehicle.stored
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'"
                                >
                                    {{ vehicle.stored ? 'EINGEPARKT' : 'DRAUSSEN' }}
                                </div>
                                <div class="text-sm text-slate-300">Fuel {{ MathRef.round(vehicle.fuel || 0) }}%</div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div class="flex-1 flex flex-col bg-[#0b1016]">
                <div class="p-6 border-b border-[#233048] flex items-center justify-between">
                    <div>
                        <div class="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">Details</div>
                        <h3 class="text-2xl font-bold text-white">Fahrzeugdaten</h3>
                    </div>
                    <button
                        @click="handleClose"
                        class="w-11 h-11 rounded-2xl bg-[#141d29] hover:bg-[#1b2838] text-slate-300 text-xl"
                    >✕</button>
                </div>

                <div class="flex-1 p-6">
                    <div v-if="!selectedVehicle" class="h-full flex items-center justify-center text-center text-slate-400">
                        <div>
                            <div class="text-5xl mb-4">🛠️</div>
                            <div class="text-xl text-white font-semibold mb-2">Wähle ein Fahrzeug aus</div>
                            <div class="text-sm">Dann kannst du es ausparken, einparken oder prüfen.</div>
                        </div>
                    </div>

                    <div v-else class="space-y-5">
                        <div class="rounded-2xl border border-[#223147] bg-[#111822] p-5">
                            <div class="text-sm text-slate-400 mb-2">Modell</div>
                            <div class="text-3xl font-bold text-white">{{ selectedVehicle.model }}</div>
                            <div class="text-sm text-slate-500 mt-2">Kennzeichen: {{ selectedVehicle.plate }}</div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="rounded-2xl border border-[#223147] bg-[#111822] p-4">
                                <div class="text-xs text-slate-400 mb-2">Status</div>
                                <div class="text-lg font-semibold" :class="selectedVehicle.stored ? 'text-emerald-400' : 'text-amber-300'">
                                    {{ selectedVehicle.stored ? 'Eingeparkt' : 'Draußen' }}
                                </div>
                            </div>
                            <div class="rounded-2xl border border-[#223147] bg-[#111822] p-4">
                                <div class="text-xs text-slate-400 mb-2">Fuel</div>
                                <div class="text-lg font-semibold text-white">{{ MathRef.round(selectedVehicle.fuel || 0) }}%</div>
                            </div>
                        </div>

                        <div class="rounded-2xl border border-[#223147] bg-[#111822] p-4">
                            <div class="text-xs text-slate-400 mb-2">Gespeichert auf Identifier</div>
                            <div class="text-sm text-cyan-300 break-all">{{ selectedVehicle.owner_identifier }}</div>
                        </div>

                        <div class="space-y-3 pt-4">
                            <button
                                v-if="selectedVehicle.stored"
                                @click="handleSpawn"
                                class="w-full rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white py-4 font-bold text-lg transition"
                            >Fahrzeug ausparken</button>
                            <button
                                v-else
                                @click="handleStore"
                                class="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white py-4 font-bold text-lg transition"
                            >Fahrzeug einparken</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};

export default GarageModule;

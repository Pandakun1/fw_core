const { ref, computed, watch, onMounted, onUnmounted } = Vue;
const useNUI = window.useNUI;

const GarageModule = {
    name: 'GarageModule',
    props: ['data'],

    setup(props) {
        const { send } = useNUI();

        const vehicles = ref([]);
        const selectedVehicleIndex = ref(0);
        const searchQuery = ref('');
        const focusPanel = ref('vehicles');
        const isLoading = ref(true);

        const filteredVehicles = computed(() => {
            const query = String(searchQuery.value || '').toLowerCase().trim();
            const source = Array.isArray(vehicles.value) ? vehicles.value : [];

            if (!query) return source;

            return source.filter((vehicle) =>
                String(vehicle.model || '').toLowerCase().includes(query) ||
                String(vehicle.plate || '').toLowerCase().includes(query) ||
                String(vehicle.state || '').toLowerCase().includes(query)
            );
        });

        const selectedVehicle = computed(() => {
            return filteredVehicles.value[selectedVehicleIndex.value] || null;
        });

        const loadVehicles = async () => {
            isLoading.value = true;
            try {
                const result = await window.NUIBridge.send('garage:getVehicles');
                vehicles.value = Array.isArray(result?.vehicles) ? result.vehicles : [];
                selectedVehicleIndex.value = 0;
            } catch (error) {
                console.error('[GarageModule] Failed to load vehicles', error);
                vehicles.value = [];
            } finally {
                isLoading.value = false;
            }
        };

        const selectVehicle = (index) => {
            selectedVehicleIndex.value = index;
            focusPanel.value = 'details';
        };

        const close = () => {
            send('closeGarage');
        };

        const spawnVehicle = async () => {
            if (!selectedVehicle.value) return;
            await send('garage:spawnVehicle', { plate: selectedVehicle.value.plate });
        };

        const storeVehicle = async () => {
            if (!selectedVehicle.value) return;
            await send('garage:storeVehicle', { plate: selectedVehicle.value.plate });
            await loadVehicles();
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
                return;
            }

            if (focusPanel.value === 'vehicles') {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedVehicleIndex.value = Math.max(0, selectedVehicleIndex.value - 1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedVehicleIndex.value = Math.min(filteredVehicles.value.length - 1, selectedVehicleIndex.value + 1);
                } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    focusPanel.value = 'details';
                }
            } else if (focusPanel.value === 'details') {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    focusPanel.value = 'vehicles';
                } else if (e.key === 'Enter' && selectedVehicle.value) {
                    e.preventDefault();
                    if (selectedVehicle.value.stored) {
                        spawnVehicle();
                    } else {
                        storeVehicle();
                    }
                }
            }
        };

        watch(searchQuery, () => {
            selectedVehicleIndex.value = 0;
        });

        onMounted(() => {
            window.addEventListener('keydown', handleKeyDown);
            loadVehicles();
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyDown);
        });

        return {
            vehicles,
            filteredVehicles,
            selectedVehicle,
            selectedVehicleIndex,
            searchQuery,
            focusPanel,
            isLoading,
            selectVehicle,
            close,
            spawnVehicle,
            storeVehicle
        };
    },

    template: `
    <div class="w-full h-full flex items-center justify-center font-sans text-white">
        <div class="w-[980px] h-[640px] bg-[#1a1b21] rounded-xl flex shadow-2xl overflow-hidden border border-[#2a2b36]">
            <div class="w-80 bg-[#121317] border-r border-[#2a2b36] flex flex-col" :class="focusPanel === 'vehicles' ? 'border-r-2 border-r-cyan-500' : ''">
                <div class="p-6 border-b border-[#2a2b36]">
                    <div class="text-xl font-bold text-[#7dd3fc] mb-4">GARAGE</div>
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Fahrzeug suchen..."
                        class="w-full rounded-lg border border-[#2a2b36] bg-[#181b23] px-4 py-3 text-white outline-none focus:border-cyan-500"
                    />
                </div>

                <div class="flex-1 overflow-y-auto">
                    <div v-if="isLoading" class="p-6 text-gray-400">Lade Fahrzeuge...</div>
                    <div v-else-if="filteredVehicles.length === 0" class="p-6 text-gray-400">Keine Fahrzeuge gefunden.</div>

                    <button
                        v-for="(vehicle, idx) in filteredVehicles"
                        :key="vehicle.plate"
                        @click="selectVehicle(idx)"
                        class="w-full text-left px-5 py-4 border-b border-[#1d212b] hover:bg-[#1a1b21] transition"
                        :class="{
                            'bg-[#1a1b21] border-l-4 border-cyan-500 text-white': idx === selectedVehicleIndex,
                            'text-gray-300': idx !== selectedVehicleIndex
                        }"
                    >
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <div class="font-semibold">{{ vehicle.model || 'Unbekannt' }}</div>
                                <div class="text-xs text-gray-400 mt-1">{{ vehicle.plate }}</div>
                            </div>
                            <div
                                class="text-[11px] px-2 py-1 rounded font-bold"
                                :class="vehicle.stored ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-300'"
                            >
                                {{ vehicle.stored ? 'EINGEPARKT' : 'DRAUSSEN' }}
                            </div>
                        </div>
                    </button>
                </div>

                <div class="p-3 text-xs text-gray-500 border-t border-[#2a2b36]">
                    <div>↑↓ Navigation</div>
                    <div>Enter/→ Details</div>
                    <div>← Zurück</div>
                    <div>ESC Schließen</div>
                </div>
            </div>

            <div class="flex-1 p-6 bg-[#1a1b21] overflow-y-auto" :class="focusPanel === 'details' ? 'border-l-2 border-l-cyan-500' : ''">
                <div class="flex items-center justify-between mb-6 border-b border-[#2a2b36] pb-4">
                    <h2 class="text-2xl font-bold">{{ selectedVehicle?.model || 'Garage' }}</h2>
                    <button @click="close" class="rounded bg-[#2a2b36] px-4 py-2 text-white hover:bg-[#323646]">Schließen</button>
                </div>

                <div v-if="!selectedVehicle" class="text-gray-400">Wähle links ein Fahrzeug aus.</div>

                <div v-else class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="rounded bg-[#121317] p-4 border border-[#2a2b36]">
                            <div class="text-xs text-gray-400 mb-1">Kennzeichen</div>
                            <div class="text-lg font-semibold text-white">{{ selectedVehicle.plate }}</div>
                        </div>
                        <div class="rounded bg-[#121317] p-4 border border-[#2a2b36]">
                            <div class="text-xs text-gray-400 mb-1">Status</div>
                            <div class="text-lg font-semibold" :class="selectedVehicle.stored ? 'text-green-400' : 'text-yellow-300'">
                                {{ selectedVehicle.stored ? 'Eingeparkt' : 'Draußen' }}
                            </div>
                        </div>
                        <div class="rounded bg-[#121317] p-4 border border-[#2a2b36]">
                            <div class="text-xs text-gray-400 mb-1">Fuel</div>
                            <div class="text-lg font-semibold text-white">{{ selectedVehicle.fuel || 0 }}%</div>
                        </div>
                        <div class="rounded bg-[#121317] p-4 border border-[#2a2b36]">
                            <div class="text-xs text-gray-400 mb-1">Owner</div>
                            <div class="text-sm font-semibold text-cyan-300 break-all">{{ selectedVehicle.owner_identifier }}</div>
                        </div>
                    </div>

                    <div class="pt-4">
                        <button
                            v-if="selectedVehicle.stored"
                            @click="spawnVehicle"
                            class="w-full rounded bg-cyan-600 px-4 py-3 text-white font-semibold hover:bg-cyan-500"
                        >Fahrzeug ausparken</button>
                        <button
                            v-else
                            @click="storeVehicle"
                            class="w-full rounded bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-500"
                        >Fahrzeug einparken</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};

export default GarageModule;

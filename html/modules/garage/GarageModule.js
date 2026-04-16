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
            if (!query) return ownedVehicles;

            return ownedVehicles.filter((vehicle) =>
                String(vehicle.model || '').toLowerCase().includes(query) ||
                String(vehicle.plate || '').toLowerCase().includes(query) ||
                String(vehicle.state || '').toLowerCase().includes(query) ||
                String(vehicle.owner_identifier || '').toLowerCase().includes(query)
            );
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
                console.log('[FW.Garage][UI] Loaded vehicles payload', result);
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
            await window.NUIBridge.send('garage:spawnVehicle', { plate: selectedVehicle.value.plate });
            isOpen.value = false;
        };

        const handleStore = async () => {
            if (!selectedVehicle.value) return;
            await window.NUIBridge.send('garage:storeVehicle', { plate: selectedVehicle.value.plate });
            await loadVehicles();
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
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
    <div v-if="isOpen" style="position:fixed; inset:0; z-index:999999; background:rgba(0,0,0,0.72); display:flex; align-items:center; justify-content:center; color:white; font-family:Arial, sans-serif; pointer-events:auto;">
        <div style="width:1200px; height:760px; background:#0f1720; border:2px solid #2d425f; border-radius:18px; display:flex; overflow:hidden; box-shadow:0 20px 80px rgba(0,0,0,0.6);">
            <div style="width:420px; border-right:1px solid #26384f; background:#121b26; display:flex; flex-direction:column;">
                <div style="padding:20px; border-bottom:1px solid #26384f;">
                    <div style="font-size:12px; letter-spacing:3px; color:#7f93ab; text-transform:uppercase; margin-bottom:8px;">Owned Vehicles</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                        <div style="font-size:32px; font-weight:700;">Garage</div>
                        <div style="padding:6px 12px; border-radius:999px; background:#163247; color:#7dd3fc; font-weight:700;">{{ filteredVehicles.length }}</div>
                    </div>
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Suche Modell, Kennzeichen oder Status"
                        style="width:100%; padding:12px 14px; border-radius:12px; border:1px solid #304761; background:#0b1219; color:white; outline:none;"
                    />
                </div>

                <div style="flex:1; overflow:auto; padding:14px;">
                    <div v-if="isLoading" style="padding:20px; color:#94a3b8;">Lade Fahrzeuge...</div>
                    <div v-else-if="filteredVehicles.length === 0" style="padding:20px; color:#94a3b8;">Keine Fahrzeuge gefunden</div>

                    <div
                        v-for="vehicle in filteredVehicles"
                        :key="vehicle.plate"
                        @click="handleSelectVehicle(vehicle)"
                        :style="{
                            marginBottom: '10px',
                            padding: '14px',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            border: selectedVehicle && selectedVehicle.plate === vehicle.plate ? '2px solid #22d3ee' : '1px solid #304761',
                            background: selectedVehicle && selectedVehicle.plate === vehicle.plate ? '#172736' : '#101822'
                        }"
                    >
                        <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
                            <div>
                                <div style="font-size:20px; font-weight:700;">{{ vehicle.model || 'Unbekannt' }}</div>
                                <div style="font-size:13px; color:#94a3b8; margin-top:4px;">{{ vehicle.plate }}</div>
                            </div>
                            <div :style="{
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: vehicle.stored ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                                color: vehicle.stored ? '#6ee7b7' : '#fcd34d',
                                border: vehicle.stored ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(245,158,11,0.35)'
                            }">{{ vehicle.stored ? 'EINGEPARKT' : 'DRAUSSEN' }}</div>
                        </div>
                        <div style="display:flex; justify-content:space-between; gap:12px; margin-top:12px; font-size:12px; color:#94a3b8;">
                            <span>Fuel {{ MathRef.round(vehicle.fuel || 0) }}%</span>
                            <span style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ vehicle.owner_identifier }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="flex:1; display:flex; flex-direction:column; background:#0d141c;">
                <div style="padding:22px 28px; border-bottom:1px solid #26384f; display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <div style="font-size:12px; letter-spacing:3px; color:#7f93ab; text-transform:uppercase; margin-bottom:8px;">Vehicle Details</div>
                        <div style="font-size:30px; font-weight:700;">{{ selectedVehicle ? selectedVehicle.model : 'Garage Übersicht' }}</div>
                    </div>
                    <button @click="closeUi" style="width:44px; height:44px; border:none; border-radius:12px; background:#1a2633; color:white; font-size:20px; cursor:pointer;">X</button>
                </div>

                <div style="flex:1; padding:28px; overflow:auto;">
                    <div v-if="!selectedVehicle" style="color:#94a3b8; font-size:18px;">Wähle links ein Fahrzeug aus.</div>

                    <div v-else>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">
                            <div style="background:#111c27; border:1px solid #26384f; border-radius:16px; padding:20px;">
                                <div style="font-size:12px; color:#7f93ab; text-transform:uppercase; margin-bottom:8px;">Kennzeichen</div>
                                <div style="font-size:28px; font-weight:700;">{{ selectedVehicle.plate }}</div>
                            </div>
                            <div style="background:#111c27; border:1px solid #26384f; border-radius:16px; padding:20px;">
                                <div style="font-size:12px; color:#7f93ab; text-transform:uppercase; margin-bottom:8px;">Status</div>
                                <div :style="{ fontSize:'28px', fontWeight:'700', color:selectedVehicle.stored ? '#6ee7b7' : '#fcd34d' }">{{ selectedVehicle.stored ? 'Eingeparkt' : 'Draußen' }}</div>
                            </div>
                        </div>

                        <div style="background:#111c27; border:1px solid #26384f; border-radius:16px; padding:20px; margin-bottom:18px;">
                            <div style="font-size:12px; color:#7f93ab; text-transform:uppercase; margin-bottom:12px;">Fahrzeugdaten</div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                                <div style="background:#0b1219; border:1px solid #223246; border-radius:12px; padding:14px;">
                                    <div style="font-size:12px; color:#7f93ab; margin-bottom:6px;">Modell</div>
                                    <div>{{ selectedVehicle.vehicleModel || selectedVehicle.model }}</div>
                                </div>
                                <div style="background:#0b1219; border:1px solid #223246; border-radius:12px; padding:14px;">
                                    <div style="font-size:12px; color:#7f93ab; margin-bottom:6px;">Fuel</div>
                                    <div>{{ MathRef.round(selectedVehicle.fuel || 0) }}%</div>
                                </div>
                                <div style="background:#0b1219; border:1px solid #223246; border-radius:12px; padding:14px; grid-column:1 / span 2;">
                                    <div style="font-size:12px; color:#7f93ab; margin-bottom:6px;">Owner Identifier</div>
                                    <div style="color:#7dd3fc; word-break:break-all;">{{ selectedVehicle.owner_identifier }}</div>
                                </div>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                            <button
                                v-if="selectedVehicle.stored"
                                @click="handleSpawn"
                                style="border:none; border-radius:16px; background:#0891b2; color:white; font-size:20px; font-weight:700; padding:18px; cursor:pointer;"
                            >Ausparken</button>
                            <button
                                v-else
                                @click="handleStore"
                                style="border:none; border-radius:16px; background:#059669; color:white; font-size:20px; font-weight:700; padding:18px; cursor:pointer;"
                            >Einparken</button>
                            <div style="background:#111c27; border:1px solid #26384f; border-radius:16px; padding:18px; color:#94a3b8; display:flex; align-items:center; justify-content:center; text-align:center;">
                                Diese UI ist absichtlich minimal gehalten, damit sie garantiert sichtbar ist.
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

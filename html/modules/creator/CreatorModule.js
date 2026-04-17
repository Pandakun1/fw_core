const { computed, onMounted, onUnmounted } = Vue;

import './CreatorStore.js';
import DoorsCreatorModule from './creatorModules/DoorsCreatorModule.js';
import JobsCreatorModule from './creatorModules/JobsCreatorModule.js';

const useNUI = window.useNUI;

const CreatorModule = {
    name: 'CreatorModule',
    components: {
        DoorsCreatorModule,
        JobsCreatorModule
    },

    setup() {
        const { send } = useNUI();
        const creatorStoreFactory = window.useCreatorStore;

        if (typeof creatorStoreFactory !== 'function') {
            throw new Error('window.useCreatorStore ist nicht verfügbar');
        }

        const creatorStore = creatorStoreFactory();

        const isOpen = computed(() => creatorStore.isOpen);
        const isFocused = computed(() => creatorStore.isFocused);
        const noclipEnabled = computed(() => creatorStore.noclipEnabled);
        const modes = computed(() => creatorStore.modes);
        const selectedMode = computed(() => creatorStore.selectedMode);
        const selectedModeIndex = computed(() => creatorStore.selectedModeIndex);
        const activeMode = computed(() => creatorStore.activeMode);

        const close = async () => {
            creatorStore.close();
            await send('creator:close');
        };

        const exitCreator = async () => {
            creatorStore.close();
            creatorStore.setFocus(false);
            creatorStore.setNoclip(false);

            await send('creator:exit');
        };

        const toggleFocus = async () => {
            creatorStore.toggleFocus();

            await send('creator:toggleFocus', {
                focused: creatorStore.isFocused
            });
        };

        const toggleSelectedMode = async () => {
            creatorStore.toggleSelectedMode();

            await send('creator:setMode', {
                mode: creatorStore.activeMode
            });
        };

        const toggleNoclip = async () => {
            creatorStore.toggleNoclip();

            await send('creator:setNoclip', {
                enabled: creatorStore.noclipEnabled
            });
        };

        const handleMessage = (event) => {
            const data = event.data;
            if (!data || !data.action) return;

            if (data.action === 'creator:open') {
                creatorStore.open();
                return;
            }

            if (data.action === 'creator:close') {
                creatorStore.close();
                return;
            }

            if (data.action === 'creator:exit') {
                exitCreator();
                return;
            }

            if (data.action === 'creator:setFocus') {
                creatorStore.setFocus(data.focused);
                return;
            }

            if (data.action === 'creator:setMode') {
                creatorStore.activeMode = data.mode || null;
                return;
            }

            if (data.action === 'creator:setNoclipState') {
                creatorStore.setNoclip(data.enabled === true);
            }
        };

        const handleKeyDown = async (e) => {
            if (!creatorStore.isOpen) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                await toggleFocus();
                return;
            }

            if (e.key === 'Backspace') {
                e.preventDefault();
                await close();
                return;
            }

            if (!creatorStore.isFocused) return;

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                creatorStore.selectPreviousMode();
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                creatorStore.selectNextMode();
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                await toggleSelectedMode();
                return;
            }

            if (e.key.toLowerCase() === 'n') {
                e.preventDefault();
                await toggleNoclip();
            }
        };

        onMounted(() => {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('message', handleMessage);
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('message', handleMessage);
        });

        return {
            isOpen,
            isFocused,
            noclipEnabled,
            modes,
            selectedMode,
            selectedModeIndex,
            activeMode,
            close,
            exitCreator,
            toggleFocus,
            toggleSelectedMode,
            toggleNoclip,
            creatorStore
        };
    },

    template: `
    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-[1100px] h-[720px] flex text-white">
        <div class="w-[340px] ml-4 rounded-l-2xl border border-[#2a2b36] bg-[#121317ee] shadow-2xl overflow-hidden">
            <div class="px-5 py-4 border-b border-[#2a2b36]">
                <div class="text-xl font-bold text-cyan-400">CREATOR PANEL</div>
                <div class="text-xs text-gray-400 mt-1">
                    {{ isFocused ? 'Fokus aktiv' : 'Kein Fokus' }}
                </div>
            </div>

            <div class="p-4 border-b border-[#2a2b36] space-y-3">
                <button
                    @click="toggleNoclip"
                    class="w-full rounded px-4 py-3 font-semibold text-white"
                    :class="noclipEnabled ? 'bg-green-600 hover:bg-green-500' : 'bg-[#2a2b36] hover:bg-[#323646]'"
                >
                    Noclip: {{ noclipEnabled ? 'AN' : 'AUS' }}
                </button>
                <button @click="exitCreator" class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-500">
                    Creator beenden
                </button>
            </div>

            <div class="overflow-y-auto">
                <button
                    v-for="(mode, idx) in modes"
                    :key="mode.id"
                    @click="creatorStore.selectMode(idx)"
                    class="w-full text-left px-5 py-4 border-b border-[#1d212b] transition"
                    :class="{
                        'bg-[#1a1b21] border-l-4 border-cyan-500 text-white': idx === selectedModeIndex,
                        'hover:bg-[#1a1b21] text-gray-300': idx !== selectedModeIndex
                    }"
                >
                    <div class="font-semibold">{{ mode.label }}</div>
                    <div class="text-xs text-gray-400 mt-1">{{ mode.description }}</div>
                </button>
            </div>

            <div class="px-4 py-3 text-xs text-gray-500 border-t border-[#2a2b36] bg-[#0f1014]">
                <div>↑↓ Navigation</div>
                <div>Enter Modus aktivieren/deaktivieren</div>
                <div>N Noclip umschalten</div>
                <div>ESC Fokus umschalten</div>
                <div>Backspace Schließen</div>
            </div>
        </div>

        <div class="flex-1 rounded-r-2xl border-y border-r border-[#2a2b36] bg-[#1a1b21ee] shadow-2xl overflow-hidden">
            <div class="px-6 py-5 border-b border-[#2a2b36] flex items-center justify-between">
                <div>
                    <div class="text-2xl font-bold">{{ selectedMode?.label || 'Creator' }}</div>
                    <div class="text-sm text-gray-400 mt-1">{{ selectedMode?.description }}</div>
                </div>

                <div class="flex items-center gap-3">
                    <div
                        class="text-xs px-3 py-2 rounded-lg font-bold"
                        :class="activeMode === selectedMode?.id ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-300'"
                    >
                        {{ activeMode === selectedMode?.id ? 'AKTIV' : 'INAKTIV' }}
                    </div>

                    <button
                        @click="toggleSelectedMode"
                        class="rounded bg-cyan-600 px-4 py-2 text-white font-semibold hover:bg-cyan-500"
                    >
                        {{ activeMode === selectedMode?.id ? 'Modus beenden' : 'Modus starten' }}
                    </button>

                    <button @click="close" class="rounded bg-[#2a2b36] px-4 py-2 text-white hover:bg-[#323646]">
                        Schließen
                    </button>
                </div>
            </div>

            <div class="p-6 h-[calc(100%-89px)] overflow-y-auto">
                <DoorsCreatorModule v-if="selectedMode?.id === 'doors'" />
                <JobsCreatorModule v-else-if="selectedMode?.id === 'jobs'" />
                <div v-else class="text-gray-400">Kein Creator-Modus ausgewählt.</div>
            </div>
        </div>
    </div>
    `
};

export default CreatorModule;
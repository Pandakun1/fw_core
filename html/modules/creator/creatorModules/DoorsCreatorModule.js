const { computed, onMounted, onUnmounted } = Vue;

const DoorsCreatorModule = {
    name: 'DoorsCreatorModule',

    setup() {
        const creatorStoreFactory = window.useCreatorStore;
        const doorsStoreFactory = window.useDoorsCreatorStore;

        if (typeof creatorStoreFactory !== 'function') {
            throw new Error('window.useCreatorStore ist nicht verfügbar');
        }

        if (typeof doorsStoreFactory !== 'function') {
            throw new Error('window.useDoorsCreatorStore ist nicht verfügbar');
        }

        const creatorStore = creatorStoreFactory();
        const doorsStore = doorsStoreFactory();

        const isActive = computed(() => creatorStore.activeMode === 'doors');

        return {
            doorsStore,
            isActive
        };
    },

    template: `
    <div class="space-y-4">
        <div class="text-lg font-semibold text-cyan-300">Doors Creator</div>

        <div class="grid grid-cols-2 gap-4">
            <div class="rounded bg-[#121317] p-4 border border-[#2a2b36]">
                <div class="text-xs text-gray-400 mb-1">Door Label</div>
                <input
                    v-model="doorsStore.label"
                    class="w-full rounded bg-[#181b23] px-3 py-2 outline-none border border-[#2a2b36]"
                />
            </div>

            <div class="rounded bg-[#121317] p-4 border border-[#2a2b36]">
                <div class="text-xs text-gray-400 mb-1">Locked</div>
                <button
                    @click="doorsStore.locked = !doorsStore.locked"
                    class="w-full rounded px-3 py-2 font-semibold"
                    :class="doorsStore.locked ? 'bg-green-600 text-white' : 'bg-[#2a2b36] text-gray-300'"
                >
                    {{ doorsStore.locked ? 'Ja' : 'Nein' }}
                </button>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div class="rounded bg-[#121317] p-4 border border-[#2a2b36]">
                <div class="text-xs text-gray-400 mb-2">Primäre Tür</div>
                <div class="text-sm text-white break-all">
                    {{ doorsStore.primaryDoor?.coords ? JSON.stringify(doorsStore.primaryDoor.coords) : 'Nicht gesetzt' }}
                </div>
                <div class="text-xs text-gray-500 mt-2">
                    Model: {{ doorsStore.primaryDoor?.model || '-' }}
                </div>
            </div>

            <div class="rounded bg-[#121317] p-4 border border-[#2a2b36]">
                <div class="text-xs text-gray-400 mb-2">Sekundäre Tür</div>
                <div class="text-sm text-white break-all">
                    {{ doorsStore.secondaryDoor?.coords ? JSON.stringify(doorsStore.secondaryDoor.coords) : 'Nicht gesetzt' }}
                </div>
                <div class="text-xs text-gray-500 mt-2">
                    Model: {{ doorsStore.secondaryDoor?.model || '-' }}
                </div>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
            <button @click="doorsStore.captureCurrentPosition()" class="rounded bg-[#2a2b36] px-4 py-3 hover:bg-[#323646]">
                Tür ansehen & übernehmen
            </button>
            <button @click="doorsStore.captureSecondPosition()" class="rounded bg-[#2a2b36] px-4 py-3 hover:bg-[#323646]">
                Zweite Tür übernehmen
            </button>
            <button
                @click="doorsStore.saveDraft()"
                :disabled="!isActive"
                class="rounded px-4 py-3 text-white"
                :class="isActive ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#2a2b36] text-gray-500 cursor-not-allowed'"
            >
                Entwurf speichern
            </button>
        </div>

        <div class="text-xs text-gray-500">
            Hinweis: Doors Creator nutzt einen eigenen sicheren Raycast und nicht den Inspect-Clone/Preview-Pfad.
        </div>
    </div>
    `
};

export default DoorsCreatorModule;


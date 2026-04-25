const { computed, onMounted, onUnmounted } = Vue;

const JobsCreatorModule = {
    name: 'JobsCreatorModule',

    setup() {
        const creatorStoreFactory = window.useCreatorStore;
        const jobsStoreFactory = window.useJobsCreatorStore;

        if (typeof creatorStoreFactory !== 'function') {
            throw new Error('window.useCreatorStore ist nicht verfügbar');
        }

        if (typeof jobsStoreFactory !== 'function') {
            throw new Error('window.useJobsCreatorStore ist nicht verfügbar');
        }

        const creatorStore = creatorStoreFactory();
        const jobsStore = jobsStoreFactory();
        const isActive = computed(() => creatorStore.activeMode === 'jobs');

        return {
            jobsStore,
            isActive
        };
    },

    template: `
    <div class="space-y-4">
        <div class="text-lg font-semibold text-cyan-300">Jobs Creator</div>

        <div class="grid grid-cols-2 gap-4">
            <div class="rounded bg-[#121317] p-4 border border-[#2a2b36]">
                <div class="text-xs text-gray-400 mb-1">Job Name</div>
                <input
                    v-model="jobsStore.jobName"
                    class="w-full rounded bg-[#181b23] px-3 py-2 outline-none border border-[#2a2b36]"
                />
            </div>

            <div class="rounded bg-[#121317] p-4 border border-[#2a2b36]">
                <div class="text-xs text-gray-400 mb-1">Label</div>
                <input
                    v-model="jobsStore.label"
                    class="w-full rounded bg-[#181b23] px-3 py-2 outline-none border border-[#2a2b36]"
                />
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <button @click="jobsStore.capturePoint('garage')" class="rounded bg-[#2a2b36] px-4 py-3 hover:bg-[#323646]">Garage setzen</button>
            <button @click="jobsStore.capturePoint('duty')" class="rounded bg-[#2a2b36] px-4 py-3 hover:bg-[#323646]">Duty setzen</button>
            <button @click="jobsStore.capturePoint('bossmenu')" class="rounded bg-[#2a2b36] px-4 py-3 hover:bg-[#323646]">Bossmenu setzen</button>
            <button @click="jobsStore.capturePoint('stash')" class="rounded bg-[#2a2b36] px-4 py-3 hover:bg-[#323646]">Stash setzen</button>
        </div>

        <div class="rounded bg-[#121317] p-4 border border-[#2a2b36]">
            <div class="text-xs text-gray-400 mb-2">Gesetzte Punkte</div>
            <div class="space-y-2 text-sm">
                <div>Garage: {{ jobsStore.points.garage ? JSON.stringify(jobsStore.points.garage) : 'Nicht gesetzt' }}</div>
                <div>Duty: {{ jobsStore.points.duty ? JSON.stringify(jobsStore.points.duty) : 'Nicht gesetzt' }}</div>
                <div>Bossmenu: {{ jobsStore.points.bossmenu ? JSON.stringify(jobsStore.points.bossmenu) : 'Nicht gesetzt' }}</div>
                <div>Stash: {{ jobsStore.points.stash ? JSON.stringify(jobsStore.points.stash) : 'Nicht gesetzt' }}</div>
            </div>
        </div>

        <button
            @click="jobsStore.saveDraft()"
            :disabled="!isActive"
            class="w-full rounded px-4 py-3 text-white"
            :class="isActive ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#2a2b36] text-gray-500 cursor-not-allowed'"
        >
            Job-Konfiguration speichern
        </button>
    </div>
    `
};

export default JobsCreatorModule;
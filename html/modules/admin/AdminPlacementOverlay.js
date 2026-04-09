const { reactive, computed, onMounted, onUnmounted } = Vue;

const AdminPlacementOverlay = {
    name: 'AdminPlacementOverlay',
    setup() {
        const state = reactive({
            visible: false,
            speedMultiplier: 1.0,
            speedLabel: '1.00x',
        });

        const bindings = computed(() => ([
            'Pfeil hoch/runter: Vor/Zurueck',
            'Pfeil links/rechts: Links/Rechts',
            'Q / E: Rotation',
            'Mausrad hoch/runter: Hoehe',
            'Shift: schneller',
            'Strg: langsamer',
            'Linksklick: Platzieren',
            'ESC: Abbrechen',
        ]));

        const handleMessage = (event) => {
            const payload = event.data;
            if (!payload || payload.action !== 'adminPlacementState') {
                return;
            }

            state.visible = !!payload.data?.visible;
            state.speedMultiplier = payload.data?.speedMultiplier ?? 1.0;
            state.speedLabel = payload.data?.speedLabel || `${state.speedMultiplier.toFixed(2)}x`;
        };

        onMounted(() => {
            window.addEventListener('message', handleMessage);
        });

        onUnmounted(() => {
            window.removeEventListener('message', handleMessage);
        });

        return {
            state,
            bindings,
        };
    },
    template: `
    <Transition name="fade">
        <div
            v-if="state.visible"
            class="pointer-events-none fixed bottom-6 right-6 z-[10010] w-[360px] rounded-2xl border border-cyan-400/25 bg-black/45 shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
        >
            <div class="border-b border-white/10 px-5 py-4">
                <div class="text-[11px] uppercase tracking-[0.35em] text-cyan-300/75">Placement</div>
                <div class="mt-2 flex items-center justify-between gap-3">
                    <div class="text-lg font-semibold text-white">Tastaturbelegung</div>
                    <div class="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-100">
                        Speed {{ state.speedLabel }}
                    </div>
                </div>
            </div>

            <div class="px-5 py-4">
                <div
                    v-for="binding in bindings"
                    :key="binding"
                    class="py-1.5 text-sm text-slate-200"
                >
                    {{ binding }}
                </div>
            </div>
        </div>
    </Transition>
    `
};

export default AdminPlacementOverlay;

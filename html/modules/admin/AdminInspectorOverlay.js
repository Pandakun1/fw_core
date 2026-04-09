const { reactive, computed, onMounted, onUnmounted } = Vue;
const useNUI = window.useNUI;

const AdminInspectorOverlay = {
    name: 'AdminInspectorOverlay',
    setup() {
        const { send } = useNUI();

        const state = reactive({
            enabled: false,
            menuOpen: false,
            target: null
        });

        const isInteractionTarget = computed(() => state.target?.inspectorKind === 'interaction');

        const targetDetails = computed(() => {
            if (!state.target) {
                return [];
            }

            if (isInteractionTarget.value) {
                const details = [
                    { label: 'ID', value: state.target.interactionId || '-' },
                    { label: 'Typ', value: state.target.typeLabel || '-' },
                    { label: 'Modus', value: state.target.modeLabel || '-' },
                    { label: 'Taste', value: state.target.keyLabel || '-' },
                    { label: 'Status', value: state.target.pausedText || '-' },
                    { label: 'Interaktionsdistanz', value: state.target.distanceText || '-' },
                    { label: 'Sichtdistanz', value: state.target.viewDistanceText || '-' },
                    { label: 'Optionen', value: String(state.target.optionsCount ?? '-') },
                    { label: 'Koordinaten', value: state.target.coordsText || '-' },
                ];

                if (state.target.mode === 'list') {
                    details.push({ label: 'Listenposition', value: state.target.listPosition || '-' });
                }

                return details;
            }

            const details = [
                { label: 'Typ', value: state.target.typeLabel || '-' },
                { label: 'Handle', value: state.target.handle ?? '-' },
                { label: 'Model', value: state.target.modelHash ?? '-' },
                { label: 'Netzwerk-ID', value: state.target.networkId ?? '-' },
                { label: 'Distanz', value: state.target.distanceText || '-' },
                { label: 'Koordinaten', value: state.target.coordsText || '-' },
            ];

            if (state.target.headingText) {
                details.push({ label: 'Heading', value: state.target.headingText });
            }

            if (state.target.healthText) {
                details.push({ label: 'Health', value: state.target.healthText });
            }

            if (state.target.extraLabel && state.target.extraValue) {
                details.push({ label: state.target.extraLabel, value: state.target.extraValue });
            }

            return details;
        });

        const closeMenu = async () => {
            await send('adminInspectorClose');
        };

        const deleteTarget = async () => {
            await send('adminInspectorDelete');
        };

        const cloneTarget = async () => {
            await send('adminInspectorClone');
            state.menuOpen = false;
            state.target = null;
        };

        const setInteractionPaused = async (paused) => {
            await send('adminInspectorSetInteractionPaused', { paused });
            if (state.target && isInteractionTarget.value) {
                state.target.paused = paused;
                state.target.pausedText = paused ? 'Pausiert' : 'Aktiv';
            }
        };

        const copyValue = async (value) => {
            const text = String(value ?? '');
            if (!text) {
                return;
            }

            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(text);
                    return;
                }
            } catch (_) {}

            try {
                const area = document.createElement('textarea');
                area.value = text;
                area.style.position = 'fixed';
                area.style.opacity = '0';
                document.body.appendChild(area);
                area.focus();
                area.select();
                document.execCommand('copy');
                document.body.removeChild(area);
            } catch (_) {}
        };

        const handleMessage = (event) => {
            const payload = event.data;
            if (!payload) {
                return;
            }

            if (payload.action === 'adminInspectorState') {
                state.enabled = !!payload.data?.enabled;
                return;
            }

            if (payload.action === 'adminInspectorOpen') {
                state.enabled = true;
                state.menuOpen = true;
                state.target = payload.data?.target || null;
                return;
            }

            if (payload.action === 'adminInspectorClose') {
                state.menuOpen = false;
                state.target = null;
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && state.menuOpen) {
                event.preventDefault();
                closeMenu();
            }
        };

        onMounted(() => {
            window.addEventListener('message', handleMessage);
            window.addEventListener('keydown', handleKeyDown);
        });

        onUnmounted(() => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('keydown', handleKeyDown);
        });

        return {
            state,
            isInteractionTarget,
            targetDetails,
            closeMenu,
            deleteTarget,
            cloneTarget,
            setInteractionPaused,
            copyValue
        };
    },
    template: `
    <Transition name="fade">
        <div
            v-if="state.menuOpen"
            class="fixed inset-0 z-[10020] flex items-center justify-center bg-black/45 p-4 pointer-events-auto"
        >
            <div class="w-[min(92vw,640px)] overflow-hidden rounded-2xl border border-cyan-400/30 bg-black/75 shadow-[0_25px_80px_rgba(0,0,0,0.85)]">
                <div class="flex items-start justify-between gap-4 border-b border-white/10 bg-[rgb(58,71,92)] px-6 py-5">
                    <div>
                        <div class="text-xs uppercase tracking-[0.35em] text-cyan-300/75">Inspector</div>
                        <h2 class="mt-2 text-2xl font-semibold text-white">{{ isInteractionTarget ? 'Interaktionspunkt' : 'Zieluebersicht' }}</h2>
                        <p class="mt-1 text-sm text-slate-300">
                            {{ state.target?.displayName || 'Unbekanntes Ziel' }}
                        </p>
                    </div>
                    <button
                        @click="closeMenu"
                        class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                        Schliessen
                    </button>
                </div>

                <div class="grid gap-3 bg-[rgba(52,56,62,0.9)] px-6 py-5 md:grid-cols-2">
                    <div
                        v-for="entry in targetDetails"
                        :key="entry.label"
                        class="rounded-xl border border-white/10 bg-[rgba(128,136,146,0.24)] px-4 py-3"
                    >
                        <div class="text-[11px] uppercase tracking-[0.25em] text-slate-400">{{ entry.label }}</div>
                        <div v-if="!isInteractionTarget" class="mt-2 flex items-start gap-2">
                            <textarea
                                readonly
                                :value="entry.value"
                                class="min-h-[72px] flex-1 resize-none rounded-lg border border-white/10 bg-[rgba(96,104,114,0.32)] px-3 py-2 text-sm text-slate-100 outline-none selection:bg-cyan-400/30"
                            ></textarea>
                            <button
                                @click="copyValue(entry.value)"
                                class="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-500/20"
                            >
                                Kopieren
                            </button>
                        </div>
                        <div
                            v-else
                            class="mt-2 rounded-lg border border-white/10 bg-[rgba(96,104,114,0.32)] px-3 py-3 text-sm text-slate-100"
                        >
                            {{ entry.value }}
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[rgba(52,56,62,0.9)] px-6 py-5">
                    <div class="text-xs text-slate-400">
                        Rechtsklick auf ein Ziel oeffnet dieses Menue. ESC schliesst es wieder.
                    </div>
                    <div class="flex gap-3">
                        <button
                            v-if="isInteractionTarget"
                            @click="setInteractionPaused(!state.target?.paused)"
                            class="rounded-xl border border-amber-400/30 bg-amber-500/15 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:bg-amber-500/25"
                        >
                            {{ state.target?.paused ? 'Pause aufheben' : 'Pausieren' }}
                        </button>
                        <button
                            v-if="!isInteractionTarget"
                            @click="cloneTarget"
                            class="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25"
                        >
                            Kopieren & Platzieren
                        </button>
                        <button
                            @click="closeMenu"
                            class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                        >
                            Zurueck
                        </button>
                        <button
                            v-if="!isInteractionTarget"
                            @click="deleteTarget"
                            class="rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-500/25"
                        >
                            Ziel entfernen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
    `
};

export default AdminInspectorOverlay;

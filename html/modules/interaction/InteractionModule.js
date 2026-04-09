const { ref, reactive, computed, onMounted, onUnmounted, nextTick } = Vue;
const useNUI = window.useNUI;

const CANVAS_SIZE = 340;
const CX = CANVAS_SIZE / 2;
const CY = CANVAS_SIZE / 2;
const RADIUS_INNER = 58;
const RADIUS_OUTER = 148;
const SEG_GAP = 0.045;
const LIST_CLOSE_MS = 300;

const CLR = {
    segBase: 'rgba(6, 10, 22, 0.88)',
    segHover: 'rgba(20, 58, 110, 0.92)',
    borderBase: 'rgba(80, 200, 255, 0.18)',
    borderHover: 'rgba(80, 200, 255, 0.9)',
    textBase: 'rgba(180, 200, 230, 0.55)',
    textHover: '#e8f0ff',
    innerFill: 'rgba(4, 8, 18, 0.95)',
    innerBorder: 'rgba(80, 200, 255, 0.35)',
};

const InteractionModule = {
    name: 'InteractionModule',
    props: ['data'],
    setup() {
        const { send } = useNUI();

        const keyHintRef = ref(null);
        const listMenuRef = ref(null);
        const listItemsRef = ref(null);
        const radialOverlayRef = ref(null);
        const radialCanvasRef = ref(null);
        const radialLabelRef = ref(null);
        const radialCrosshairRef = ref(null);

        const state = reactive({
            visible: false,
            mode: null, // 'list' | 'radial' | null

            hintVisible: false,
            hintX: 0.5,
            hintY: 0.5,
            keyLabel: 'E',
            inRange: false,
            hintScale: 1,
            hintMorph: 0,

            options: [],
            listPosition: 'right',
            listIndex: 0,
            listClosing: false,

            radialActive: -1,
            radialMX: 0,
            radialMY: 0,
            radialLabel: '',
        });

        let ctx = null;
        let listCloseTimer = null;

        const keyHintStyle = computed(() => ({
            left: `${state.hintX * 100}%`,
            top: `${state.hintY * 100}%`,
            transform: `translate(-50%, -50%) scale(${state.hintScale})`,
            '--hint-morph': state.hintMorph,
        }));

        const listMenuClasses = computed(() => {
            return [
                'list-menu',
                `pos-${state.listPosition}`,
                { closing: state.listClosing },
                { hidden: !(state.visible && state.mode === 'list') },
                { visible: state.visible && state.mode === 'list' && !state.listClosing }
            ];
        });

        const keyHintClasses = computed(() => ({
            'key-hint': true,
            'hidden': !state.hintVisible,
            'visible': state.hintVisible,
            'in-range': !!state.inRange,
        }));

        const radialOverlayClasses = computed(() => ({
            'radial-overlay': true,
            'hidden': !(state.visible && state.mode === 'radial')
        }));

        const positionedListStyle = computed(() => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const bx = state.hintX * vw;
            const by = state.hintY * vh;

            const BADGE_HALF = 23;
            const GAP = 14;
            const OFFSET = BADGE_HALF + GAP;
            const ITEM_H = 43;

            const style = {
                position: 'absolute'
            };

            if (state.listPosition === 'right') {
                style.left = `${bx + OFFSET}px`;
                style.top = `${by - state.listIndex * ITEM_H - ITEM_H / 2}px`;
            } else if (state.listPosition === 'left') {
                style.right = `${vw - bx + OFFSET}px`;
                style.top = `${by - state.listIndex * ITEM_H - ITEM_H / 2}px`;
            } else if (state.listPosition === 'bottom') {
                style.top = `${by + OFFSET}px`;
                style.left = `${bx}px`;
                style.transform = 'translateX(-50%)';
            }

            return style;
        });

        const triggerOption = async (index) => {
            await send('selectOption', { index: index + 1 });
            closeMenuLocal();
        };

        const closeMenuRequest = async () => {
            await send('closeMenu');
            closeMenuLocal();
        };

        const clearListCloseTimer = () => {
            if (listCloseTimer) {
                clearTimeout(listCloseTimer);
                listCloseTimer = null;
            }
        };

        const finishListClose = () => {
            clearListCloseTimer();
            state.listClosing = false;
            state.visible = false;
            state.mode = null;
            state.options = [];
            state.listIndex = 0;
        };

        const closeMenuLocal = ({ animateList = true } = {}) => {
            if (state.mode === 'list' && state.visible && animateList) {
                clearListCloseTimer();
                state.listClosing = true;
                state.hintVisible = false;
                state.inRange = false;
                state.hintScale = 1;
                state.hintMorph = 0;
                listCloseTimer = setTimeout(() => {
                    finishListClose();
                }, LIST_CLOSE_MS);
                return;
            }

            finishListClose();
            state.visible = false;
            state.mode = null;
            state.hintVisible = false;
            state.listClosing = false;
            state.hintScale = 1;
            state.hintMorph = 0;
            state.options = [];
            state.listIndex = 0;
            state.radialActive = -1;
            state.radialMX = 0;
            state.radialMY = 0;
            state.radialLabel = '';

            if (ctx) {
                ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            }
        };

        const hideAll = () => {
            closeMenuLocal();
            state.hintVisible = false;
            state.inRange = false;
            state.hintScale = 1;
            state.hintMorph = 0;
        };

        const updateCrosshair = (dx, dy) => {
            if (!radialCrosshairRef.value || !radialOverlayRef.value) return;

            const SCALE = 90;
            const clamp = (v) => Math.max(-1, Math.min(1, v));

            const cx = CX + clamp(dx) * SCALE;
            const cy = CY + clamp(dy) * SCALE;

            const rect = radialOverlayRef.value.getBoundingClientRect();
            const canvasLeft = rect.width / 2 - CX;
            const canvasTop = rect.height / 2 - CY;

            radialCrosshairRef.value.style.left = `${canvasLeft + cx}px`;
            radialCrosshairRef.value.style.top = `${canvasTop + cy}px`;
        };

        const drawWrappedText = (ctx2, text, x, y, maxWidth, lineHeight) => {
            const words = (text || '').split(' ');
            let line = '';
            const lines = [];

            for (const word of words) {
                const test = line ? `${line} ${word}` : word;
                if (ctx2.measureText(test).width > maxWidth && line) {
                    lines.push(line);
                    line = word;
                } else {
                    line = test;
                }
            }

            if (line) lines.push(line);

            const totalH = lines.length * lineHeight;
            lines.forEach((l, i) => {
                ctx2.fillText(l, x, y - totalH / 2 + i * lineHeight + lineHeight / 2);
            });
        };

        const drawRadial = () => {
            if (!ctx || !state.options.length) return;

            const n = state.options.length;
            const segAngle = (Math.PI * 2) / n;
            const startBase = -Math.PI / 2;

            ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

            for (let i = 0; i < n; i++) {
                const isActive = i === state.radialActive;
                const start = startBase + i * segAngle + SEG_GAP / 2;
                const end = startBase + (i + 1) * segAngle - SEG_GAP / 2;

                ctx.beginPath();
                ctx.arc(CX, CY, RADIUS_OUTER, start, end);
                ctx.arc(CX, CY, RADIUS_INNER, end, start, true);
                ctx.closePath();

                if (isActive) {
                    const midAngle = (start + end) / 2;
                    const gx1 = CX + Math.cos(midAngle) * RADIUS_INNER;
                    const gy1 = CY + Math.sin(midAngle) * RADIUS_INNER;
                    const gx2 = CX + Math.cos(midAngle) * RADIUS_OUTER;
                    const gy2 = CY + Math.sin(midAngle) * RADIUS_OUTER;
                    const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
                    grad.addColorStop(0, 'rgba(15, 50, 100, 0.95)');
                    grad.addColorStop(1, 'rgba(25, 80, 140, 0.85)');
                    ctx.fillStyle = grad;
                } else {
                    ctx.fillStyle = CLR.segBase;
                }

                ctx.fill();
                ctx.strokeStyle = isActive ? CLR.borderHover : CLR.borderBase;
                ctx.lineWidth = isActive ? 2 : 1;
                ctx.stroke();

                if (isActive) {
                    ctx.save();
                    ctx.shadowColor = 'rgba(80, 200, 255, 0.6)';
                    ctx.shadowBlur = 18;
                    ctx.strokeStyle = 'rgba(80, 200, 255, 0.7)';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.restore();
                }

                const midAngle = (start + end) / 2;
                const labelR = (RADIUS_INNER + RADIUS_OUTER) / 2;
                const lx = CX + Math.cos(midAngle) * labelR;
                const ly = CY + Math.sin(midAngle) * labelR;

                ctx.save();
                ctx.font = isActive
                    ? 'bold 14px Rajdhani, sans-serif'
                    : '500 13px Rajdhani, sans-serif';
                ctx.fillStyle = isActive ? CLR.textHover : CLR.textBase;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                if (isActive) {
                    ctx.shadowColor = 'rgba(80, 200, 255, 0.8)';
                    ctx.shadowBlur = 8;
                }

                const label = state.options[i]?.label || `Option ${i + 1}`;
                drawWrappedText(ctx, label, lx, ly, 75, 16);
                ctx.restore();
            }

            ctx.beginPath();
            ctx.arc(CX, CY, RADIUS_INNER - 2, 0, Math.PI * 2);
            ctx.fillStyle = CLR.innerFill;
            ctx.fill();
            ctx.strokeStyle = CLR.innerBorder;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.save();
            ctx.shadowColor = 'rgba(80, 200, 255, 0.4)';
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.restore();

            for (let i = 0; i < n; i++) {
                const angle = startBase + i * segAngle;
                ctx.beginPath();
                ctx.moveTo(
                    CX + Math.cos(angle) * (RADIUS_INNER + 2),
                    CY + Math.sin(angle) * (RADIUS_INNER + 2)
                );
                ctx.lineTo(
                    CX + Math.cos(angle) * (RADIUS_OUTER - 2),
                    CY + Math.sin(angle) * (RADIUS_OUTER - 2)
                );
                ctx.strokeStyle = 'rgba(80, 200, 255, 0.08)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        };

        const onKeyHint = ({ visible, x, y, key, inRange, scale, morph }) => {
            if (!visible) {
                state.hintVisible = false;
                return;
            }

            state.hintVisible = true;
            state.hintX = x ?? 0.5;
            state.hintY = y ?? 0.5;
            state.keyLabel = key || 'E';
            state.inRange = !!inRange;
            state.hintScale = scale ?? 1;
            state.hintMorph = morph ?? (inRange ? 1 : 0);
        };

        const onOpenList = async ({ options, position, x, y, index }) => {
            clearListCloseTimer();
            state.options = options || [];
            state.listPosition = position || 'right';
            state.listIndex = Math.max(0, (index || 1) - 1);
            state.listClosing = false;
            state.hintX = x ?? state.hintX;
            state.hintY = y ?? state.hintY;
            state.visible = true;
            state.mode = 'list';

            await nextTick();
        };

        const onListScroll = ({ index }) => {
            state.listIndex = Math.max(0, (index || 1) - 1);
        };

        const onUpdatePos = ({ x, y }) => {
            state.hintX = x ?? state.hintX;
            state.hintY = y ?? state.hintY;
        };

        const onSelectList = ({ index }) => {
            triggerOption(Math.max(0, (index || 1) - 1));
        };

        const onOpenRadial = async ({ options }) => {
            clearListCloseTimer();
            state.hintVisible = false;
            state.listClosing = false;
            state.options = options || [];
            state.visible = true;
            state.mode = 'radial';
            state.radialActive = -1;
            state.radialMX = 0;
            state.radialMY = 0;
            state.radialLabel = '';

            await nextTick();
            updateCrosshair(0, 0);
            drawRadial();
        };

        const onRadialMouse = ({ x, y }) => {
            state.radialMX = x || 0;
            state.radialMY = y || 0;

            const len = Math.sqrt(state.radialMX * state.radialMX + state.radialMY * state.radialMY);
            const DEAD = 0.12;

            if (len < DEAD) {
                state.radialActive = -1;
                state.radialLabel = '';
            } else {
                const angle = Math.atan2(state.radialMY, state.radialMX);
                const normAng = (angle + Math.PI * 2) % (Math.PI * 2);
                const n = state.options.length;

                if (n > 0) {
                    const segAngle = (Math.PI * 2) / n;
                    const offsetAng = (normAng + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
                    const seg = Math.floor(offsetAng / segAngle) % n;

                    state.radialActive = seg;
                    state.radialLabel = state.options[seg]?.label || '';
                }
            }

            updateCrosshair(state.radialMX, state.radialMY);
            drawRadial();
        };

        const onSelectRadial = () => {
            if (state.radialActive >= 0) {
                triggerOption(state.radialActive);
            } else {
                closeMenuRequest();
            }
        };

        const handleMessage = (event) => {
            const data = event.data;
            if (!data || !data.type) return;

            const d = data.data || {};

            switch (data.type) {
                case 'keyHint':
                    onKeyHint(d);
                    break;
                case 'openList':
                    onOpenList(d);
                    break;
                case 'listScroll':
                    onListScroll(d);
                    break;
                case 'updatePos':
                    onUpdatePos(d);
                    break;
                case 'selectList':
                    onSelectList(d);
                    break;
                case 'openRadial':
                    onOpenRadial(d);
                    break;
                case 'radialMouse':
                    onRadialMouse(d);
                    break;
                case 'selectRadial':
                    onSelectRadial();
                    break;
                case 'closeMenu':
                    closeMenuLocal();
                    break;
                case 'hide':
                    hideAll();
                    break;
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && state.mode) {
                e.preventDefault();
                closeMenuRequest();
            }
        };

        onMounted(() => {
            if (radialCanvasRef.value) {
                radialCanvasRef.value.width = CANVAS_SIZE;
                radialCanvasRef.value.height = CANVAS_SIZE;
                ctx = radialCanvasRef.value.getContext('2d');
            }

            window.addEventListener('message', handleMessage);
            window.addEventListener('keydown', handleKeyDown);
        });

        onUnmounted(() => {
            clearListCloseTimer();
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('keydown', handleKeyDown);
        });

        return {
            state,
            keyHintRef,
            listMenuRef,
            listItemsRef,
            radialOverlayRef,
            radialCanvasRef,
            radialLabelRef,
            radialCrosshairRef,
            keyHintStyle,
            keyHintClasses,
            listMenuClasses,
            positionedListStyle,
            radialOverlayClasses
        };
    },

    template: `
    <div class="w-full h-full pointer-events-none">
        <div
            ref="keyHintRef"
            :class="keyHintClasses"
            :style="keyHintStyle"
            aria-hidden="true"
        >
            <div class="hint-bracket hint-bracket--left"></div>
            <div class="hint-bracket hint-bracket--right"></div>
            <div id="key-badge" class="key-badge">
                <span class="key-badge-text">{{ state.keyLabel }}</span>
            </div>
            <div id="hint-pulse" class="hint-pulse"></div>
        </div>

        <div
            ref="listMenuRef"
            :class="listMenuClasses"
            :style="positionedListStyle"
            aria-hidden="true"
        >
            <div id="list-connector" class="list-connector"></div>
            <div ref="listItemsRef" id="list-items" class="list-items">
                <div
                    v-for="(opt, i) in state.options"
                    :key="i"
                    class="list-item"
                    :class="{ active: i === state.listIndex }"
                    :style="{ '--item-index': i }"
                >
                    {{ opt.label || ('Option ' + (i + 1)) }}
                </div>

                <div v-if="state.options.length > 1" class="list-scroll-hint">
                    ▲ ▼ SCROLLEN
                </div>
            </div>
        </div>

        <div
            ref="radialOverlayRef"
            :class="radialOverlayClasses"
            aria-hidden="true"
        >
            <canvas ref="radialCanvasRef" id="radial-canvas"></canvas>
            <div
                ref="radialLabelRef"
                id="radial-label"
                class="radial-label-center"
                :style="{ opacity: state.radialLabel ? '1' : '0' }"
            >
                {{ state.radialLabel }}
            </div>
            <div
                ref="radialCrosshairRef"
                id="radial-crosshair"
                class="radial-crosshair"
            ></div>
        </div>
    </div>
    `
};

export default InteractionModule;

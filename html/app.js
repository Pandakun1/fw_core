const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

// --- IMPORTS DER MODULE ---
import BriefcaseInventory from './modules/inventory/InventoryModule.js';
import AdminModule from './modules/admin/AdminModule.js';
import GarageModule from './modules/garage/GarageModule.js';
import HUDModule from './modules/hud/HUDModule.js';
import NotifyModule from './modules/notify/NotifyModule.js';
import InteractionModule from './modules/interaction/InteractionModule.js';
import AdminInspectorOverlay from './modules/admin/AdminInspectorOverlay.js';
import AdminPlacementOverlay from './modules/admin/AdminPlacementOverlay.js';

// NEU: Character Modules
import MulticharModule from './modules/character/MulticharModule.js';
import CharCreatorModule from './modules/character/CharCreatorModule.js';
import AppearanceModule from './modules/character/AppearanceModule.js';

// Settings System
import { useSettingsStore } from './modules/settings/SettingsStore.js';

const App = {
    setup() {
        // Initialize Settings Store
        const settingsStore = useSettingsStore();
        
        const isVisible = ref(false);
        const activeRoute = ref(null);
        const routeData = ref({});
        const showHUD = ref(true);

        // --- ROUTING CONFIGURATION ---
        const routes = {
            inventory: BriefcaseInventory,
            admin: AdminModule,
            garage: GarageModule,
            // NEU:
            multichar: MulticharModule,
            creator: CharCreatorModule,
            appearance: AppearanceModule
        };

        const CurrentComponent = computed(() => routes[activeRoute.value] || null);
        const isCopyDialogVisible = ref(false);
        const copyDialogText = ref('');

        const openCopyDialog = (text) => {
            if (!text) return;
            copyDialogText.value = text;
            isCopyDialogVisible.value = true;
        };

        const closeCopyDialog = () => {
            copyDialogText.value = '';
            isCopyDialogVisible.value = false;
        };

        // --- MESSAGE HANDLER ---
        const messageHandler = (event) => {
            // Wir greifen auf das ganze Event-Objekt zu, um flexibel zu sein
            const eventData = event.data;
            const action = eventData?.action;

            if (action === 'copy') {
                openCopyDialog(eventData.text || eventData.data?.text || '');
                return;
            }

            if (action === 'showInput' && activeRoute.value === 'admin') {
                routeData.value = {
                    ...routeData.value,
                    ...eventData,
                    inputVisible: true
                };
                return;
            }

            // 1. GENERIC ROUTER (für die neuen Module: Multichar, Creator, Appearance)
            // Erwartet Lua: SendNUIMessage({ action: 'open', data: { route: 'multichar', ... } })
            if (action === 'open') {
                activeRoute.value = eventData.data.route; 
                routeData.value = eventData.data || {};
                isVisible.value = true;
                
                // HUD ausblenden bei Vollbild-Menüs
                if (['multichar', 'creator', 'appearance'].includes(activeRoute.value)) {
                    showHUD.value = false;
                }
            }

            // 2. SPEZIFISCHE ROUTER (für Inventar & Admin - Legacy Support)
            // Erwartet Lua: SendNUIMessage({ action: 'openInventory', inventory: {...} })
            if (action === 'openInventory') {
                activeRoute.value = 'inventory';
                // Wir übergeben das gesamte eventData, damit 'inventory', 'cash' etc. verfügbar sind
                routeData.value = eventData; 
                isVisible.value = true;
            }

            if (action === 'openAdmin' || action === 'openAdminMenu') {
                activeRoute.value = 'admin';
                routeData.value = eventData;
                isVisible.value = true;
            }

            if (action === 'openGarage') { // Falls du Garage nutzt
                activeRoute.value = 'garage';
                routeData.value = eventData;
                isVisible.value = true;
            }

            // 3. LIVE UPDATES (wenn UI schon offen ist)
            if (action === 'updateSlots' || action === 'updateGroundItems' || action === 'updateInventory') {
                // Merged die neuen Daten in die bestehenden routeData
                if (activeRoute.value === 'inventory') {
                    routeData.value = { ...routeData.value, ...eventData };
                    console.log('[App] Updated inventory with equipment:', eventData.equipment ? 'YES' : 'NO');
                }
            }

            // 4. SCHLIESSEN
            if (action === 'close' || action === 'closeUI' || action === 'closeInventory' || action === 'closeAdmin' || action === 'closeAdminMenu' || action === 'closeMenu') {
                isVisible.value = false;
                activeRoute.value = null;
                showHUD.value = true; // HUD wieder an
                fetch(`https://${GetParentResourceName()}/closeUI`, { method: 'POST' }).catch(()=>{});
            }

            // 5. HUD & NOTIFY (Global)
            if (action === 'updateHUD') window.dispatchEvent(new CustomEvent('hud-update', { detail: eventData.data }));
            if (action === 'toggleHUD') showHUD.value = eventData.data.visible;
            if (action === 'notify') window.dispatchEvent(new CustomEvent('notification', { detail: eventData.data || eventData }));
        };

        onMounted(() => window.addEventListener('message', messageHandler));
        onUnmounted(() => window.removeEventListener('message', messageHandler));

        return { isVisible, activeRoute, routeData, CurrentComponent, showHUD, isCopyDialogVisible, copyDialogText, closeCopyDialog };
    },
    template: `
    <div class="w-full h-full select-none overflow-hidden relative font-sans">
        <notify-component></notify-component>
        <hud-component v-if="showHUD"></hud-component>
        <interaction-component></interaction-component>
        <admin-inspector-overlay></admin-inspector-overlay>
        <admin-placement-overlay></admin-placement-overlay>
        <Transition name="fade">
            <div v-if="isVisible && CurrentComponent" 
                 style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; display: flex; align-items: center; justify-content: center; pointer-events: auto;"
                 :style="{ background: activeRoute === 'multichar' || activeRoute === 'creator' || activeRoute === 'appearance' ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)' }">
                <component :is="CurrentComponent" :data="routeData"></component>
            </div>
        </Transition>

        <Transition name="fade">
            <div v-if="isCopyDialogVisible"
                 style="position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); padding: 1rem;">
                <div style="width: min(90vw, 600px); background: rgba(15,23,42,0.95); border: 1px solid rgba(148,163,184,0.3); border-radius: 1rem; box-shadow: 0 20px 60px rgba(0,0,0,0.45); overflow: hidden;">
                    <div style="padding: 1rem 1rem 0.75rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                        <div>
                            <h2 style="color: #f8fafc; font-size: 1.1rem; margin-bottom: 0.25rem;">Koordinaten kopieren</h2>
                            <p style="color: rgba(241,245,249,0.75); margin: 0; font-size: 0.9rem;">Markiere den Text und kopiere ihn manuell.</p>
                        </div>
                        <button @click="closeCopyDialog"
                                style="border: none; background: transparent; color: #f8fafc; font-size: 1.4rem; cursor: pointer;">✕</button>
                    </div>
                    <div style="padding: 0 1rem 1rem;">
                        <textarea readonly
                                  :value="copyDialogText"
                                  style="width: 100%; min-height: 140px; resize: vertical; border-radius: 0.75rem; border: 1px solid rgba(148,163,184,0.25); background: rgba(15,23,42,0.97); color: #e2e8f0; padding: 1rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 0.95rem; line-height: 1.5;"
                        ></textarea>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
    `
};

const app = createApp(App);
app.component('hud-component', HUDModule);
app.component('notify-component', NotifyModule);
app.component('interaction-component', InteractionModule);
app.component('admin-inspector-overlay', AdminInspectorOverlay);
app.component('admin-placement-overlay', AdminPlacementOverlay);
app.mount('#app');

// ============================================
// NUI READY SIGNAL (für Settings System)
// ============================================
setTimeout(() => {
    fetch(`https://fw_core/nuiReady`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(() => {});
}, 500); // Warte bis Vue App vollständig geladen ist

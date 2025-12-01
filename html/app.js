const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

// --- IMPORTS DER MODULE ---
import BriefcaseInventory from './modules/inventory/InventoryModule.js';
import AdminModule from './modules/admin/AdminModule.js';
import GarageModule from './modules/garage/GarageModule.js';
import HUDModule from './modules/hud/HUDModule.js';
import NotifyModule from './modules/notify/NotifyModule.js';

// NEU: Character Modules
import MulticharModule from './modules/character/MulticharModule.js';
import CharCreatorModule from './modules/character/CharCreatorModule.js';
import AppearanceModule from './modules/character/AppearanceModule.js';

const App = {
    setup() {
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

        // --- MESSAGE HANDLER ---
        const messageHandler = (event) => {
            // Wir greifen auf das ganze Event-Objekt zu, um flexibel zu sein
            const eventData = event.data;
            const action = eventData.action;

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
            if (action === 'updateSlots' || action === 'updateGroundItems') {
                // Merged die neuen Daten in die bestehenden routeData
                if (activeRoute.value === 'inventory') {
                    routeData.value = { ...routeData.value, ...eventData };
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

        return { isVisible, activeRoute, routeData, CurrentComponent, showHUD };
    },
    template: `
    <div class="w-full h-full select-none overflow-hidden relative font-sans">
        <Transition name="fade">
            <div v-if="isVisible && CurrentComponent" 
                 style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; display: flex; align-items: center; justify-content: center; pointer-events: auto;"
                 :style="{ background: activeRoute === 'multichar' || activeRoute === 'creator' || activeRoute === 'appearance' ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)' }">
                <component :is="CurrentComponent" :data="routeData"></component>
            </div>
        </Transition>
    </div>
    `
};

const app = createApp(App);
app.component('hud-component', HUDModule);
app.component('notify-component', NotifyModule);
app.mount('#app');
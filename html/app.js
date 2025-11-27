const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

// --- IMPORTS DER MODULE ---
import InventoryModule from './modules/inventory/InventoryModule.js';
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
            inventory: InventoryModule,
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
                routeData.value = eventData.data.data || {};
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

            if (action === 'openAdmin') {
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
            if (action === 'close' || action === 'closeUI' || action === 'closeInventory' || action === 'closeAdmin') {
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
        <!-- Layer 1: HUD -->
        <div v-show="showHUD" class="absolute inset-0 pointer-events-none z-10">
            <hud-component></hud-component>
        </div>

        <!-- Layer 2: Notifications -->
        <div class="absolute inset-0 pointer-events-none z-50">
            <notify-component></notify-component>
        </div>

        <!-- Layer 3: Active Module -->
        <Transition name="fade">
            <div v-if="isVisible" class="absolute inset-0 z-40 bg-black/60 pointer-events-auto flex items-center justify-center">
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
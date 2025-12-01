// Import external design templates
import { generateBriefcaseTemplate } from './designs/BriefcaseDesign.js';
import { generateTacticalBackpackTemplate } from './designs/TacticalBackpackDesign.js';
import { generateRetroDrawerTemplate } from './designs/RetroDrawerDesign.js';
import { generateSciFiHudTemplate } from './designs/SciFiHudDesign.js';
import { generateForestTemplate } from './designs/ForestDesign.js';

const { computed, ref, onMounted, onUnmounted, watch } = Vue;
const useNUI = window.useNUI;

const InventoryModule = {
    name: 'InventoryModule',
    props: ['data'],
    
    setup(props) {
    const { send, onClose } = useNUI();
    
    // State
    const layoutKey = ref('forest');
    const themeKey = ref('classicLeather');
    const animationKey = ref('none');
    const settingsOpen = ref(false);
    const settingsPosition = ref({ x: 100, y: 100 });
    const selectedItem = ref(null);
    const hoveredItem = ref(null);
    const draggedItemIndex = ref(null);

    // Inventar Items (50 Slots)
    const inventoryItems = ref(Array(50).fill(null));
    
    // Equipment Slots (4 Slots: Weste, Waffe, Tasche1, Tasche2)
    const equipmentSlots = ref({
        vest: null,    // Slot 0
        weapon: null,  // Slot 1
        bag1: null,    // Slot 2
        bag2: null     // Slot 3
    });
    
    // Dual Inventory Modal State
    const dualInventoryOpen = ref(false);
    const dualInventoryMode = ref(''); // 'give', 'ground', 'trunk', 'glovebox', 'bag', 'storage'
    const dualInventoryTitle = ref('');
    const secondInventoryItems = ref(Array(50).fill(null)); // Secondary inventory slots
    const secondInventoryCache = {}; // Cache für gespeicherte Inventare nach Mode
    const movedFromMainInventory = new Set(); // Tracking welche Slots vom Hauptinventar ins Sonderinventar verschoben wurden
    
    // Computed
    const hotbarSlots = computed(() => inventoryItems.value.slice(0, 5));
    
    const useGlow = computed(() => animationKey.value === 'subtleGlow' || animationKey.value === 'scannerPulse');
    const useFlash = computed(() => animationKey.value === 'quickResponse');
    const usePulse = computed(() => animationKey.value === 'scannerPulse');

    // Dummy Data
    const keys = ref([
        { name: 'Autoschlüssel', icon: '🚗🔑' },
        { name: 'Haustür Schlüssel', icon: '🏠🔑' },
        { name: 'Job Schlüssel', icon: '🏢🔑' },
    ]);

    const licenses = ref([
        { id: 'id', label: 'ID Card', desc: 'Personalausweis' },
        { id: 'driver', label: 'Führerschein', desc: 'PKW / Motorrad' },
        { id: 'weapon', label: 'Waffenschein', desc: 'Registrierte Waffen' },
    ]);

    const stats = ref([
        { name: 'Health', value: 95, max: 100, color: '#16a34a' },
        { name: 'Armor', value: 60, max: 100, color: '#2563eb' },
        { name: 'Hunger', value: 35, max: 100, color: '#ea580c' },
        { name: 'Durst', value: 70, max: 100, color: '#7c3aed' },
    ]);

    // Layout Configs
    const LAYOUTS = {
        briefcase: { name: '🧳 Koffer', key: 'briefcase' },
        tacticalBackpack: { name: '🎒 Taktischer Rucksack', key: 'tacticalBackpack' },
        retroDrawer: { name: '📦 Retro Schubladen', key: 'retroDrawer' },
        sciFiHud: { name: '🚀 Sci-Fi HUD', key: 'sciFiHud' },
        forest: { name: '🌲 Wald Inventar', key: 'forest' },
    };

    const THEMES = {
        classicLeather: { name: '🟤 Classic Leder', key: 'classicLeather' },
        nightOps: { name: '🌙 Night Ops', key: 'nightOps' },
        desertDust: { name: '🏜️ Desert Dust', key: 'desertDust' },
        neonMiami: { name: '🌆 Neon Miami', key: 'neonMiami' },
        arcticBlue: { name: '❄️ Arctic Blue', key: 'arcticBlue' },
    };

    const ANIMATIONS = {
        none: { name: '⚪ Keine', key: 'none' },
        subtleGlow: { name: '✨ Subtiles Glühen', key: 'subtleGlow' },
        quickResponse: { name: '⚡ Schnelle Reaktion', key: 'quickResponse' },
        scannerPulse: { name: '📡 Scanner-Puls', key: 'scannerPulse' },
    };

    // Load inventory data from props (KORRIGIERT - unterstützt Objekt-Format vom Server)
    const loadInventoryData = () => {
        const items = Array(50).fill(null);
        
        console.log('[Inventar] Props data type:', typeof props.data);
        console.log('[Inventar] Props data:', JSON.stringify(props.data));
        
        // Prüfe verschiedene Datenstrukturen
        let inventoryData = null;
        let isObjectFormat = false;
        
        // Direkt als Array (neues Format von Client)
        if (Array.isArray(props.data?.inventory)) {
            inventoryData = props.data.inventory;
            console.log('[Inventar] ✅ Found inventory array:', inventoryData.length, 'items');
        }
        // Als Objekt (Server-Format: { itemName: { label, amount, slot, ... } })
        else if (props.data?.inventory && typeof props.data.inventory === 'object' && !Array.isArray(props.data.inventory)) {
            inventoryData = props.data.inventory;
            isObjectFormat = true;
            console.log('[Inventar] ✅ Found inventory object (server format) with keys:', Object.keys(inventoryData).length);
        }
        // Direkt als Objekt
        else if (props.data && typeof props.data === 'object' && !Array.isArray(props.data) && Object.keys(props.data).length > 0) {
            inventoryData = props.data;
            isObjectFormat = true;
            console.log('[Inventar] ✅ Found inventory as root object with keys:', Object.keys(inventoryData).length);
        }
        // Fallback für alte Array-Struktur
        else if (props.data?.inventory?.main && Array.isArray(props.data.inventory.main)) {
            inventoryData = props.data.inventory.main;
        } else if (props.data?.main && Array.isArray(props.data.main)) {
            inventoryData = props.data.main;
        } else if (Array.isArray(props.data)) {
            inventoryData = props.data;
        }
        
        // Wenn Daten vorhanden, verarbeiten
        if (inventoryData) {
            if (isObjectFormat) {
                // Objekt-Format: Konvertiere { itemName: { slot, label, amount, ... } } zu Array
                let loadedCount = 0;
                for (const [itemName, itemData] of Object.entries(inventoryData)) {
                    if (itemData && typeof itemData.slot === 'number' && itemData.slot >= 0 && itemData.slot < 50) {
                        items[itemData.slot] = {
                            id: itemData.slot,
                            itemName: itemName, // Behalte den internen itemName für Server-Kommunikation
                            name: itemData.label || itemName || 'Unbekannt',
                            emoji: itemData.emoji || getEmojiForItem(itemName), // Nutze Emoji aus itemlist.json
                            quantity: itemData.amount || 1
                        };
                        loadedCount++;
                        console.log('[Inventar] Loaded', itemName, 'in slot', itemData.slot, ':', itemData.label || itemName, 'x', itemData.amount);
                    } else if (itemData) {
                        console.warn('[Inventar] ⚠️ Item', itemName, 'hat keinen gültigen Slot:', itemData.slot);
                    }
                }
                console.log('[Inventar] ✅', loadedCount, 'Items aus Objekt-Format geladen');
            } else if (Array.isArray(inventoryData) && inventoryData.length > 0) {
                // Array-Format
                inventoryData.forEach(item => {
                    if (item && typeof item.slot === 'number' && item.slot >= 0 && item.slot < 50) {
                        items[item.slot] = {
                            id: item.slot,
                            itemName: item.name || item.itemName,
                            name: item.label || item.name || 'Unbekannt',
                            emoji: item.emoji || '📦',
                            quantity: item.amount || item.quantity || 1
                        };
                        console.log('[Inventar] Loaded item in slot', item.slot, ':', item.label || item.name);
                    }
                });
                console.log('[Inventar] ✅ Items erfolgreich geladen:', inventoryData.length);
            }
        }
        
        // Fallback auf Dummy-Daten wenn nichts geladen wurde
        const loadedCount = items.filter(item => item !== null).length;
        if (loadedCount === 0) {
            console.log('[Inventar] ⚠️ Keine Items geladen, zeige Dummy-Daten');
            // Dummy-Daten für Testing
            items[0] = { id: 0, itemName: 'sandwich', name: 'Sandwich', emoji: '🥪', quantity: 2 };
            items[1] = { id: 1, itemName: 'water', name: 'Wasser', emoji: '💧', quantity: 3 };
            items[2] = { id: 2, itemName: 'medkit', name: 'Verbandskasten', emoji: '🏥', quantity: 1 };
            items[5] = { id: 5, itemName: 'phone', name: 'Handy', emoji: '📱', quantity: 1 };
            items[10] = { id: 10, itemName: 'keys', name: 'Schlüssel', emoji: '🔑', quantity: 1 };
        }
        
        inventoryItems.value = items;
        console.log('[Inventar] Geladene Items:', inventoryItems.value.filter(item => item !== null).length, 'von 50');
    };
    
    // Helper: Hole Emoji aus itemlist.json basierend auf itemName
    const getEmojiForItem = (itemName) => {
        const emojiMap = {
            'money': '💵',
            'sandwich': '🥪',
            'water': '💧',
            'bread': '🍞',
            'burger': '🍔',
            'pizza': '🍕',
            'medkit': '🏥',
            'bandage': '🩹',
            'phone': '📱',
            'keys': '🔑',
            'lockpick': '🔓',
            'weapon': '🔫',
            'ammo': '🔫',
            'vest': '🦺'
        };
        return emojiMap[itemName] || '📦';
    };

    // Helpers
    const isItemDefined = (item) => item !== null && item?.emoji !== undefined && item?.emoji !== '';

    // Actions
    const moveItem = (fromIndex, toIndex) => {
        const itemA = inventoryItems.value[fromIndex];
        const itemB = inventoryItems.value[toIndex];

        // Validate source item exists
        if (!isItemDefined(itemA)) {
            console.log('[Inventar] Kein Item zum Verschieben in Slot', fromIndex);
            return;
        }
        
        // Check if this is dummy data - allow local swap for testing
        const hasInventoryData = props.data && (
            (Array.isArray(props.data.inventory) && props.data.inventory.length > 0) ||
            (typeof props.data.inventory === 'object' && Object.keys(props.data.inventory).length > 0) ||
            (Array.isArray(props.data) && props.data.length > 0)
        );
        
        if (!hasInventoryData) {
            console.warn('⚠️ [Inventar] Dummy-Daten Modus - Nur lokales Verschieben (nicht auf Server gespeichert)');
            
            // Allow local swap for UI testing
            const newItems = [...inventoryItems.value];
            newItems[toIndex] = itemA;
            newItems[fromIndex] = itemB;
            inventoryItems.value = newItems;
            
            console.log('[Inventar] ✅ Dummy-Daten lokal verschoben:', fromIndex, '→', toIndex);
            console.log('[Inventar] 💡 Tipp: Nutze "additem sandwich 5" in Server Console für echte Items');
            return;
        }
        
        console.log('[Inventar] 📤 Sende moveItem an Server:', itemA.name, 'von Slot', fromIndex, 'zu Slot', toIndex);
        console.log('[Inventar] ItemName:', itemA.itemName || itemA.name);
        
        // Send to server with itemName for proper identification
        send('moveItem', {
            fromSlot: fromIndex,
            toSlot: toIndex,
            itemName: itemA.itemName || itemA.name // Backend braucht evtl. den itemName
        });
        
        // Optimistic UI update (optional) - wird vom Server-Response überschrieben
        // Kommentiert aus, weil wir auf Server-Response warten wollen
        // const newItems = [...inventoryItems.value];
        // newItems[toIndex] = itemA;
        // newItems[fromIndex] = itemB;
        // inventoryItems.value = newItems;
        
        console.log('[Inventar] ⏳ Warte auf Server-Bestätigung...');
    };

    const handleSlotClick = (index) => {
        console.log('[Inventar] Slot geklickt:', index);
        if (isItemDefined(inventoryItems.value[index])) {
            console.log('[Inventar] Item:', inventoryItems.value[index]);
        }
    };

    const handleKeyClick = (key) => {
        console.log('[Inventar] Key geklickt:', key);
        send('useKey', { keyId: key.id });
    };

    const handleLicenseClick = (license) => {
        console.log('[Inventar] License geklickt:', license);
    };

    const handleUse = () => {
        console.log('[Inventar] Use Item');
        send('useItem');
    };

    const handlePickup = () => {
        console.log('[Inventar] Boden aufheben');
        send('pickupFromGround');
    };

    const handleGive = () => {
        console.log('[Inventar] Geben-Modus');
        openDualInventory('give', '🤝 Geben-Modus');
    };

    const openTrunk = () => {
        console.log('[Inventar] Kofferraum öffnen');
        openDualInventory('trunk', '🚗 Kofferraum');
    };

    const openGlovebox = () => {
        console.log('[Inventar] Handschuhfach öffnen');
        openDualInventory('glovebox', '🧤 Handschuhfach');
    };

    const openStorage = () => {
        console.log('[Inventar] Lager öffnen');
        openDualInventory('storage', '🏢 Lager');
    };

    const openBag = () => {
        console.log('[Inventar] Tasche öffnen');
        openDualInventory('bag', '👜 Tasche');
    };

    const openDualInventory = (mode, title) => {
        dualInventoryMode.value = mode;
        dualInventoryTitle.value = title;
        
        // Reset tracking
        movedFromMainInventory.clear();
        
        // Lade gecachte Items falls vorhanden (Deep Copy)
        if (secondInventoryCache[mode]) {
            secondInventoryItems.value = secondInventoryCache[mode]
                .map(item => item && item.name ? { ...item } : null);
            
            console.log('[Inventar] Gecachte Items geladen für:', mode);
            
            // WICHTIG: Entferne diese Items aus dem Spielerinventar
            secondInventoryItems.value.forEach((cachedItem, index) => {
                if (cachedItem && cachedItem.name) {
                    // Suche das Item im Hauptinventar und entferne es
                    const mainSlotIndex = inventoryItems.value.findIndex(mainItem => 
                        mainItem && 
                        mainItem.name === cachedItem.name && 
                        mainItem.quantity === cachedItem.quantity
                    );
                    
                    if (mainSlotIndex !== -1) {
                        console.log('[Inventar] 🗑️ Entferne gecachtes Item aus Hauptinventar:', cachedItem.name, 'Slot', mainSlotIndex);
                        inventoryItems.value[mainSlotIndex] = null;
                        movedFromMainInventory.add(mainSlotIndex); // Tracking für Rückgabe beim Abbruch
                    } else {
                        console.warn('[Inventar] ⚠️ Gecachtes Item nicht im Hauptinventar gefunden:', cachedItem.name);
                    }
                }
            });
            
            console.log('[Inventar] ✅ Gecachte Items aus Hauptinventar entfernt, Tracking aktiviert');
        } else {
            secondInventoryItems.value = Array(50).fill(null);
        }
        
        dualInventoryOpen.value = true;
        console.log('[Inventar] Opening dual inventory:', mode);
    };

    const saveDualInventory = () => {
        console.log('[Inventar] Dual-Inventar zwischenspeichern für Mode:', dualInventoryMode.value);
        
        // Speichere im Cache - aber nur eine Deep Copy um Referenzen zu brechen
        secondInventoryCache[dualInventoryMode.value] = secondInventoryItems.value
            .map(item => item && item.name ? { ...item } : null);
        
        // WICHTIG: Tracking bleibt bestehen!
        // Beim Abbruch müssen die Items zurück ins Hauptinventar
        console.log('[Inventar] Tracked slots bleiben erhalten:', Array.from(movedFromMainInventory));
        
        // Sende auch an Server falls nötig
        send('saveDualInventory', { 
            mode: dualInventoryMode.value, 
            items: secondInventoryItems.value 
        });
        
        console.log('[Inventar] ✅ Items zwischengespeichert, Tracking bleibt aktiv für Rückgabe beim Abbruch');
    };

    const clearDualInventory = () => {
        console.log('[Inventar] Dual-Inventar leeren - Items zurück ins Spielerinventar');
        console.log('[Inventar] Tracked slots from main inventory:', Array.from(movedFromMainInventory));
        
        // Gehe durch alle Slots im Sonderinventar
        secondInventoryItems.value.forEach((item, secondIndex) => {
            if (item && item.name) {
                // Suche nach dem ursprünglichen Hauptinventar-Slot
                // Wir wissen nicht mehr, welcher Sonder-Slot zu welchem Haupt-Slot gehört
                // Also: Finde den ersten leeren Slot im Hauptinventar der in movedFromMainInventory war
                let targetSlot = null;
                
                for (const mainSlot of movedFromMainInventory) {
                    if (!inventoryItems.value[mainSlot] || !inventoryItems.value[mainSlot].name) {
                        targetSlot = mainSlot;
                        break;
                    }
                }
                
                // Falls kein getrackerter Slot frei ist, suche irgendeinen freien Slot
                if (targetSlot === null) {
                    targetSlot = inventoryItems.value.findIndex(slot => !slot || !slot.name);
                }
                
                if (targetSlot !== null && targetSlot !== -1) {
                    inventoryItems.value[targetSlot] = item;
                    console.log('[Inventar] ✅ Item zurückgelegt:', item.name, 'in Slot', targetSlot);
                } else {
                    console.warn('[Inventar] ⚠️ Kein freier Slot für:', item.name);
                }
            }
        });
        
        // Leere das Sonderinventar und reset tracking
        secondInventoryItems.value = Array(50).fill(null);
        movedFromMainInventory.clear();
        
        console.log('[Inventar] ✅ Sonderinventar geleert, Items zurückgelegt');
    };

    const confirmDualInventory = () => {
        console.log('[Inventar] Dual-Inventar bestätigen - Geben-Funktion aufrufen');
        
        // Sammle alle Items die gegeben werden sollen
        const itemsToGive = secondInventoryItems.value
            .map((item, index) => item && item.name ? { ...item, slot: index } : null)
            .filter(item => item !== null);
        
        if (itemsToGive.length === 0) {
            console.log('[Inventar] Keine Items zum Geben vorhanden');
            closeDualInventory();
            return;
        }
        
        console.log('[Inventar] Items zum Geben:', itemsToGive);
        
        // Rufe clientseitige Geben-Funktion auf
        send('giveItems', { 
            mode: dualInventoryMode.value, 
            items: itemsToGive 
        });
        
        // WICHTIG: Cache NICHT löschen - Items bleiben in der Session gespeichert
        // Der Cache wird nur bei clearDualInventory() (Leeren-Button) gelöscht
        console.log('[Inventar] ✅ Items bestätigt - Cache bleibt für erneutes Öffnen erhalten');
        
        // Speichere den aktuellen Stand im Cache für späteren Abruf
        secondInventoryCache[dualInventoryMode.value] = secondInventoryItems.value
            .map(item => item && item.name ? { ...item } : null);
        
        // Reset Tracking - Items wurden erfolgreich übergeben
        movedFromMainInventory.clear();
        
        // Schließe Modal (aber behalte secondInventoryItems im Cache)
        dualInventoryOpen.value = false;
        dualInventoryMode.value = '';
        
        console.log('[Inventar] 💾 Dual-Inventar bleibt in Session gespeichert bis zum Leeren');
    };

    const closeDualInventory = () => {
        console.log('[Inventar] Dual-Inventar schließen - Normales Layout wiederherstellen');
        console.log('[Inventar] Tracked slots:', Array.from(movedFromMainInventory));
        
        // WICHTIG: Wenn Items vom Hauptinventar ins Sonderinventar verschoben wurden
        // und dann abgebrochen wird, müssen diese Items zurück ins Hauptinventar
        if (movedFromMainInventory.size > 0) {
            console.log('[Inventar] ⚠️ Abbruch mit verschobenen Items - Automatisches Zurücklegen');
            clearDualInventory();
        } else {
            // Normaler Abbruch ohne verschobene Items
            secondInventoryItems.value = Array(50).fill(null);
            movedFromMainInventory.clear();
        }
        
        dualInventoryOpen.value = false;
        dualInventoryMode.value = '';
        
        // Force Vue reactivity update
        Vue.nextTick(() => {
            console.log('[Inventar] Vue nextTick - Layout aktualisiert');
        });
    };

    const handleClose = () => {
        console.log('[Inventar] Schließen via Button');
        send('closeInventory');
    };

    const toggleSettings = () => {
        settingsOpen.value = !settingsOpen.value;
    };

    const openClothing = () => {
        console.log('[Inventar] Kleidung öffnen');
        send('openClothing');
    };

    const openGround = () => {
        console.log('[Inventar] Boden öffnen');
        openDualInventory('ground', '🌍 Boden');
    };

    const toggleGiveMode = () => {
        console.log('[Inventar] Geben-Modus umschalten');
        openDualInventory('give', '🤝 Geben');
    };

    // Mouse-Based Drag & Drop System
    const isDragging = ref(false);
    const dragGhostElement = ref(null);
    const dragStartPos = ref({ x: 0, y: 0 });
    const currentMousePos = ref({ x: 0, y: 0 });

    const createDragGhost = (item) => {
        if (dragGhostElement.value) {
            document.body.removeChild(dragGhostElement.value);
        }

        const ghost = document.createElement('div');
        ghost.className = 'inventory-drag-ghost';
        ghost.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 10000;
            width: 5vw;
            height: 5vw;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3vw;
            background: transparent;
            border: 0.2vw solid rgba(59, 130, 246, 0.9);
            border-radius: 1vw;
            box-shadow: 0 0 3vw rgba(59, 130, 246, 0.8), 0 0 6vw rgba(34, 197, 94, 0.4);
            transform: translate(-50%, -50%) scale(1.1) rotate(5deg);
            animation: dragFloat 0.5s ease-in-out infinite alternate;
            transition: transform 0.1s ease;
        `;
        ghost.innerHTML = `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; background: transparent;">
                <div style="font-size: 3vw; filter: drop-shadow(0 0 0.5vw rgba(59, 130, 246, 0.8));">${item.emoji}</div>
                ${item.quantity > 1 ? `
                    <div style="position: absolute; bottom: -0.5vw; right: -0.5vw; background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(34, 197, 94, 0.9)); color: white; padding: 0.2vw 0.5vw; border-radius: 0.5vw; font-size: 0.8vw; font-weight: bold; border: 0.1vw solid rgba(255, 255, 255, 0.3); box-shadow: 0 0 1vw rgba(59, 130, 246, 0.6);">
                        ${item.quantity}
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(ghost);
        dragGhostElement.value = ghost;
        return ghost;
    };

    const updateGhostPosition = (x, y) => {
        if (dragGhostElement.value) {
            dragGhostElement.value.style.left = `${x}px`;
            dragGhostElement.value.style.top = `${y}px`;
        }
    };

    const removeDragGhost = () => {
        if (dragGhostElement.value && dragGhostElement.value.parentNode) {
            dragGhostElement.value.style.animation = 'dragFadeOut 0.2s ease-out forwards';
            setTimeout(() => {
                if (dragGhostElement.value && dragGhostElement.value.parentNode) {
                    document.body.removeChild(dragGhostElement.value);
                }
                dragGhostElement.value = null;
            }, 200);
        }
    };

    const getSlotAtPosition = (x, y) => {
        // Expanded search radius (in pixels) - makes drop zones bigger
        const searchRadius = 40;
        
        // Try center position first
        let elements = document.elementsFromPoint(x, y);
        let slot = elements.find(el => el.hasAttribute('data-slot-index') || el.hasAttribute('data-equipment-slot'));
        if (slot) return slot;
        
        // If not found at center, search in a grid around the cursor
        const offsets = [
            // Immediate neighbors (closer)
            [searchRadius * 0.3, 0], [-searchRadius * 0.3, 0], 
            [0, searchRadius * 0.3], [0, -searchRadius * 0.3],
            // Diagonals (closer)
            [searchRadius * 0.2, searchRadius * 0.2], [-searchRadius * 0.2, searchRadius * 0.2],
            [searchRadius * 0.2, -searchRadius * 0.2], [-searchRadius * 0.2, -searchRadius * 0.2],
            // Further away
            [searchRadius, 0], [-searchRadius, 0], 
            [0, searchRadius], [0, -searchRadius],
            [searchRadius * 0.7, searchRadius * 0.7], [-searchRadius * 0.7, searchRadius * 0.7],
            [searchRadius * 0.7, -searchRadius * 0.7], [-searchRadius * 0.7, -searchRadius * 0.7]
        ];
        
        for (const [offsetX, offsetY] of offsets) {
            elements = document.elementsFromPoint(x + offsetX, y + offsetY);
            slot = elements.find(el => el.hasAttribute('data-slot-index') || el.hasAttribute('data-equipment-slot'));
            if (slot) return slot;
        }
        
        return null;
    };

    const handleMouseDown = (e, index) => {
        // Check if it's from second inventory
        const isFromSecond = typeof index === 'string' && index.startsWith('second-');
        const actualIndex = isFromSecond ? parseInt(index.replace('second-', '')) : index;
        const sourceArray = isFromSecond ? secondInventoryItems.value : inventoryItems.value;
        
        if (!isItemDefined(sourceArray[actualIndex])) return;
        if (e.button !== 0) return; // Only left mouse button

        e.preventDefault();
        
        const item = sourceArray[actualIndex];
        isDragging.value = true;
        draggedItemIndex.value = index; // Keep original index with prefix
        dragStartPos.value = { x: e.clientX, y: e.clientY };
        currentMousePos.value = { x: e.clientX, y: e.clientY };

        // Create ghost element
        createDragGhost(item);
        updateGhostPosition(e.clientX, e.clientY);

        // Add dragging class to original element
        e.currentTarget.classList.add('dragging');
        
        // Change cursor
        document.body.style.cursor = 'grabbing';
        
        console.log('[Inventar] Mouse drag started:', item.name, 'from slot', index, isFromSecond ? '(Second Inventory)' : '(Main Inventory)');
    };

    const handleEquipmentMouseDown = (e, slotType) => {
        const item = equipmentSlots.value[slotType];
        if (!item) return;
        if (e.button !== 0) return; // Only left mouse button

        e.preventDefault();
        
        isDragging.value = true;
        draggedItemIndex.value = `equipment_${slotType}`; // Mark as equipment slot
        dragStartPos.value = { x: e.clientX, y: e.clientY };
        currentMousePos.value = { x: e.clientX, y: e.clientY };

        // Create ghost element
        createDragGhost(item);
        updateGhostPosition(e.clientX, e.clientY);

        // Add dragging class to original element
        e.currentTarget.classList.add('dragging');
        
        // Change cursor
        document.body.style.cursor = 'grabbing';
        
        console.log('[Inventar] Mouse drag started from equipment:', item.name, 'from slot', slotType);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.value || draggedItemIndex.value === null) return;

        currentMousePos.value = { x: e.clientX, y: e.clientY };
        updateGhostPosition(e.clientX, e.clientY);

        // Highlight slot under cursor
        const targetSlot = getSlotAtPosition(e.clientX, e.clientY);
        
        // Remove previous highlights
        document.querySelectorAll('.drag-hover').forEach(el => {
            el.classList.remove('drag-hover');
        });

        // Add highlight to current target
        if (targetSlot) {
            const targetIndex = parseInt(targetSlot.getAttribute('data-slot-index'));
            if (targetIndex !== draggedItemIndex.value) {
                targetSlot.classList.add('drag-hover');
            }
        }
    };

    const handleMouseUp = (e) => {
        if (!isDragging.value || draggedItemIndex.value === null) return;

        const fromIndex = draggedItemIndex.value;
        const targetSlot = getSlotAtPosition(e.clientX, e.clientY);

        console.log('[Inventar] Mouse up at:', e.clientX, e.clientY);
        console.log('[Inventar] Target slot found:', targetSlot ? (targetSlot.getAttribute('data-slot-index') || targetSlot.getAttribute('data-equipment-slot')) : 'NONE');

        // Remove dragging state
        document.querySelectorAll('.dragging').forEach(el => {
            el.classList.remove('dragging');
        });
        document.querySelectorAll('.drag-hover').forEach(el => {
            el.classList.remove('drag-hover');
        });

        document.body.style.cursor = '';

        if (targetSlot) {
            // Check source type
            const isFromEquipment = typeof fromIndex === 'string' && fromIndex.startsWith('equipment_');
            const isFromSecond = typeof fromIndex === 'string' && fromIndex.startsWith('second-');
            const fromEquipmentType = isFromEquipment ? fromIndex.replace('equipment_', '') : null;
            
            // Get actual numeric indices
            const fromActualIndex = isFromSecond ? parseInt(fromIndex.replace('second-', '')) : (isFromEquipment ? null : fromIndex);
            
            // Check if it's an equipment slot target
            const equipmentSlotType = targetSlot.getAttribute('data-equipment-slot');
            
            if (equipmentSlotType) {
                // Dropped on equipment slot
                console.log('[Inventar] Dropped on equipment slot:', equipmentSlotType);
                
                // Visual feedback
                targetSlot.style.animation = 'pulse 0.3s ease';
                setTimeout(() => {
                    targetSlot.style.animation = '';
                }, 300);
                
                if (isFromEquipment) {
                    // Moving between equipment slots
                    const item = equipmentSlots.value[fromEquipmentType];
                    const oldEquipment = equipmentSlots.value[equipmentSlotType];
                    
                    equipmentSlots.value[equipmentSlotType] = item;
                    equipmentSlots.value[fromEquipmentType] = oldEquipment;
                    
                    console.log('[Inventar] ✅ Equipment swapped:', fromEquipmentType, '↔', equipmentSlotType);
                } else if (isFromSecond) {
                    // Moving from second inventory to equipment
                    const item = secondInventoryItems.value[fromActualIndex];
                    if (item) {
                        const oldEquipment = equipmentSlots.value[equipmentSlotType];
                        equipmentSlots.value[equipmentSlotType] = item;
                        secondInventoryItems.value[fromActualIndex] = oldEquipment;
                        
                        console.log('[Inventar] ✅ Item equipped from second inventory:', item.name, 'in slot', equipmentSlotType);
                    }
                } else {
                    // Moving from main inventory to equipment
                    const item = inventoryItems.value[fromIndex];
                    if (item) {
                        const oldEquipment = equipmentSlots.value[equipmentSlotType];
                        equipmentSlots.value[equipmentSlotType] = item;
                        inventoryItems.value[fromIndex] = oldEquipment;
                        
                        console.log('[Inventar] ✅ Item equipped:', item.name, 'in slot', equipmentSlotType);
                    }
                }
            } else {
                // Dropped on regular inventory slot
                const toSlotStr = targetSlot.getAttribute('data-slot-index');
                const isToSecond = typeof toSlotStr === 'string' && toSlotStr.startsWith('second-');
                const toIndex = isToSecond ? parseInt(toSlotStr.replace('second-', '')) : parseInt(toSlotStr);
                
                console.log('[Inventar] Parsed toIndex:', toIndex, 'fromIndex:', fromIndex, 'isToSecond:', isToSecond, 'isFromSecond:', isFromSecond);
                
                if (!isNaN(toIndex)) {
                    // Visual feedback on drop
                    targetSlot.style.animation = 'pulse 0.3s ease';
                    setTimeout(() => {
                        targetSlot.style.animation = '';
                    }, 300);
                    
                    if (isFromEquipment) {
                        // Moving from equipment to inventory (main or second)
                        const item = equipmentSlots.value[fromEquipmentType];
                        const targetArray = isToSecond ? secondInventoryItems.value : inventoryItems.value;
                        const oldItem = targetArray[toIndex];
                        
                        targetArray[toIndex] = item;
                        equipmentSlots.value[fromEquipmentType] = oldItem;
                        
                        console.log('[Inventar] ✅ Item unequipped to', isToSecond ? 'second' : 'main', 'inventory slot:', toIndex);
                    } else if (isFromSecond && isToSecond) {
                        // Moving within second inventory
                        if (fromActualIndex !== toIndex) {
                            const temp = secondInventoryItems.value[fromActualIndex];
                            secondInventoryItems.value[fromActualIndex] = secondInventoryItems.value[toIndex];
                            secondInventoryItems.value[toIndex] = temp;
                            console.log('[Inventar] ✅ Items swapped within second inventory:', fromActualIndex, '↔', toIndex);
                        }
                    } else if (!isFromSecond && !isToSecond) {
                        // Moving within main inventory
                        if (fromIndex !== toIndex) {
                            console.log('[Inventar] ✅ Calling moveItem:', fromIndex, '→', toIndex);
                            moveItem(fromIndex, toIndex);
                        } else {
                            console.log('[Inventar] ❌ Invalid move - same slot');
                        }
                    } else {
                        // Moving between main and second inventory
                        const fromArray = isFromSecond ? secondInventoryItems.value : inventoryItems.value;
                        const toArray = isToSecond ? secondInventoryItems.value : inventoryItems.value;
                        const fromIdx = isFromSecond ? fromActualIndex : fromIndex;
                        
                        const temp = fromArray[fromIdx];
                        fromArray[fromIdx] = toArray[toIndex];
                        toArray[toIndex] = temp;
                        
                        // Tracking: Wenn vom Hauptinventar ins Sonderinventar
                        if (!isFromSecond && isToSecond && temp && temp.name) {
                            movedFromMainInventory.add(fromIdx); // Merke: Dieser Slot im Hauptinventar war die Quelle
                            console.log('[Inventar] 📝 Tracked: Slot', fromIdx, 'aus Hauptinventar verschoben');
                        }
                        // Wenn zurück vom Sonderinventar ins Hauptinventar
                        if (isFromSecond && !isToSecond) {
                            movedFromMainInventory.delete(toIndex); // Entferne Tracking
                            console.log('[Inventar] 📝 Untracked: Slot', toIndex, 'zurück ins Hauptinventar');
                        }
                        
                        console.log('[Inventar] ✅ Items swapped between inventories:', fromIdx, '→', toIndex);
                    }
                } else {
                    console.log('[Inventar] ❌ Invalid toIndex - NaN');
                }
            }
        } else {
            console.log('[Inventar] ❌ Drag cancelled - no valid target slot found');
        }

        // Cleanup
        removeDragGhost();
        isDragging.value = false;
        draggedItemIndex.value = null;
    };

    // Legacy handlers for compatibility (now just trigger mouse handlers)
    const handleDragStart = (e, index) => {
        e.preventDefault(); // Disable native drag
    };

    const handleDragEnd = (e) => {
        // Not used with mouse system
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDragLeave = (e) => {
        // Not used with mouse system
    };

    const handleDrop = (e, toIndex) => {
        e.preventDefault();
    };

    // Watch für Datenänderungen
    watch(() => props.data, (newData) => {
        console.log('[Inventar] Props data changed:', newData);
        loadInventoryData();
    }, { deep: true, immediate: false });

    // NUI Listener für Server-Updates
    const handleInventoryUpdate = (data) => {
        console.log('[Inventar] 🔄 Server sent inventory update:', data);
        if (data && data.inventory) {
            // Konvertiere Objekt-Format zu Props-Format und lade neu
            const items = Array(50).fill(null);
            let loadedCount = 0;
            
            for (const [itemName, itemData] of Object.entries(data.inventory)) {
                if (itemData && typeof itemData.slot === 'number' && itemData.slot >= 0 && itemData.slot < 50) {
                    items[itemData.slot] = {
                        id: itemData.slot,
                        itemName: itemName,
                        name: itemData.label || itemName || 'Unbekannt',
                        emoji: itemData.emoji || getEmojiForItem(itemName),
                        quantity: itemData.amount || 1
                    };
                    loadedCount++;
                }
            }
            
            inventoryItems.value = items;
            console.log('[Inventar] ✅ Inventar vom Server aktualisiert:', loadedCount, 'Items');
        }
    };

    // Lifecycle
    onMounted(() => {
        console.log('[Inventar] Component mounted');
        console.log('[Inventar] Props data:', props.data);
        loadInventoryData();
        
        // Add global mouse event listeners for drag system
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Listen for server inventory updates
        window.NUIBridge.on('updateInventory', handleInventoryUpdate);
    });

    onUnmounted(() => {
        // Cleanup mouse event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // Note: NUIBridge doesn't have .off() method, listeners are automatically cleaned up
        
        // Remove any remaining ghost elements
        if (dragGhostElement.value && dragGhostElement.value.parentNode) {
            document.body.removeChild(dragGhostElement.value);
        }
    });

    onClose(handleClose);

    // Dynamic component - only create the active one (defined after all functions)
    const currentDesignComponent = computed(() => {
        let template = '';
        switch(layoutKey.value) {
            case 'briefcase': template = generateBriefcaseTemplate(); break;
            case 'tacticalBackpack': template = generateTacticalBackpackTemplate(); break;
            case 'retroDrawer': template = generateRetroDrawerTemplate(); break;
            case 'sciFiHud': template = generateSciFiHudTemplate(); break;
            case 'forest': template = generateForestTemplate(); break;
            default: template = '<div class="text-white text-center"><p class="text-2xl">Unbekanntes Layout</p></div>';
        }
        
        return {
            template: `<div class="h-full w-full">${template}</div>`,
            setup() {
                return {
                    inventoryItems,
                    equipmentSlots,
                    secondInventoryItems,
                    dualInventoryOpen,
                    dualInventoryMode,
                    dualInventoryTitle,
                    selectedItem,
                    hoveredItem,
                    keys,
                    licenses,
                    stats,
                    isItemDefined,
                    handleMouseDown,
                    handleEquipmentMouseDown,
                    openClothing,
                    openGlovebox,
                    openTrunk,
                    openGround,
                    openStorage,
                    openBag,
                    toggleGiveMode,
                    toggleSettings,
                    handleClose,
                    confirmDualInventory,
                    saveDualInventory,
                    clearDualInventory,
                    closeDualInventory
                };
            }
        };
    });

    return {
        // State
        layoutKey,
        themeKey,
        animationKey,
        settingsOpen,
        settingsPosition,
        selectedItem,
        hoveredItem,
        draggedItemIndex,
        inventoryItems,
        equipmentSlots,
        dualInventoryOpen,
        dualInventoryMode,
        dualInventoryTitle,
        secondInventoryItems,
        keys,
        licenses,
        stats,
        
        // Configs
        LAYOUTS,
        THEMES,
        ANIMATIONS,
        
        // Computed
        useGlow,
        useFlash,
        usePulse,
        currentDesignComponent,
        
        // Methods
        isItemDefined,
        moveItem,
        handleSlotClick,
        handleKeyClick,
        handleLicenseClick,
        handleUse,
        handlePickup,
        handleGive,
        openTrunk,
        openGlovebox,
        openStorage,
        openBag,
        openDualInventory,
        saveDualInventory,
        clearDualInventory,
        confirmDualInventory,
        closeDualInventory,
        handleClose,
        toggleSettings,
        handleMouseDown,
        handleEquipmentMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
},
    template: `
    <div :class="[
        'fixed inset-0 flex items-center justify-center p-8',
        'theme-' + themeKey,
        'layout-' + layoutKey
    ]">
        <!-- Settings Menu -->
        <Transition name="settings-fade">
            <div v-if="settingsOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center" @click.self="toggleSettings()">
                <div class="absolute bg-gradient-to-br from-slate-800 to-slate-900 w-[480px] max-h-[80vh] rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] border-2 border-slate-600/30" :style="{ left: settingsPosition.x + 'px', top: settingsPosition.y + 'px' }">
                    <!-- Settings Header -->
                    <div class="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 flex justify-between items-center rounded-t-2xl border-b-2 border-sky-500/30">
                        <div class="flex items-center gap-2 text-slate-50 font-bold text-base uppercase tracking-wider">
                            <span class="text-xl">⚙️</span>
                            Einstellungen
                        </div>
                        <button @click="toggleSettings()" class="w-8 h-8 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/40 hover:text-white font-bold text-lg transition-all hover:scale-105">✕</button>
                    </div>
                    
                    <!-- Settings Content -->
                    <div class="p-4 max-h-[calc(80vh-60px)] overflow-y-auto space-y-4">
                        <!-- Layout Category -->
                        <div class="bg-slate-900/60 rounded-xl p-3 border border-slate-600/20">
                            <div class="flex items-center gap-2 text-slate-300 text-sm uppercase tracking-wide mb-2.5">
                                <span>🎨</span>
                                Layout
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <button v-for="(layout, key) in LAYOUTS" :key="key" @click="layoutKey = key" :class="['px-3 py-2.5 rounded-lg border text-slate-300 text-xs font-medium text-left transition-all', layoutKey === key ? 'bg-gradient-to-r from-sky-500/30 to-emerald-500/30 border-sky-500/80 text-slate-50 font-bold shadow-[0_0_16px_rgba(56,189,248,0.4)]' : 'bg-slate-800/60 border-slate-600/30 hover:bg-slate-700/80 hover:border-sky-500/50 hover:-translate-y-0.5']">
                                    {{ layout.name }}
                                </button>
                            </div>
                        </div>
                        
                        <!-- Theme Category -->
                        <div class="bg-slate-900/60 rounded-xl p-3 border border-slate-600/20">
                            <div class="flex items-center gap-2 text-slate-300 text-sm uppercase tracking-wide mb-2.5">
                                <span>🎨</span>
                                Farbschema
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <button v-for="(theme, key) in THEMES" :key="key" @click="themeKey = key" :class="['px-3 py-2.5 rounded-lg border text-slate-300 text-xs font-medium text-left transition-all', themeKey === key ? 'bg-gradient-to-r from-sky-500/30 to-emerald-500/30 border-sky-500/80 text-slate-50 font-bold shadow-[0_0_16px_rgba(56,189,248,0.4)]' : 'bg-slate-800/60 border-slate-600/30 hover:bg-slate-700/80 hover:border-sky-500/50 hover:-translate-y-0.5']">
                                    {{ theme.name }}
                                </button>
                            </div>
                        </div>
                        
                        <!-- Animation Category -->
                        <div class="bg-slate-900/60 rounded-xl p-3 border border-slate-600/20">
                            <div class="flex items-center gap-2 text-slate-300 text-sm uppercase tracking-wide mb-2.5">
                                <span>✨</span>
                                Animationen
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <button v-for="(animation, key) in ANIMATIONS" :key="key" @click="animationKey = key" :class="['px-3 py-2.5 rounded-lg border text-slate-300 text-xs font-medium text-left transition-all', animationKey === key ? 'bg-gradient-to-r from-sky-500/30 to-emerald-500/30 border-sky-500/80 text-slate-50 font-bold shadow-[0_0_16px_rgba(56,189,248,0.4)]' : 'bg-slate-800/60 border-slate-600/30 hover:bg-slate-700/80 hover:border-sky-500/50 hover:-translate-y-0.5']">
                                    {{ animation.name }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Main Inventar Content -->
        <div class="w-[62vw] h-[64vh] flex items-center justify-center">
            <!-- Dynamic Design Component - Only renders the active template -->
            <component :is="currentDesignComponent" :key="layoutKey"></component>
        </div>
    </div>
    `
};

export default InventoryModule;

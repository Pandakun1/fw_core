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
    
    // Quantity Modal State (für Menge beim Ablegen)
    const quantityModalOpen = ref(false);
    const quantityModalPosition = ref({ x: 0, y: 0 });
    const quantityModalValue = ref(1);
    const quantityModalMax = ref(1);
    const quantityModalTarget = ref(null);
    
    // Mouse Wheel Stacking State
    const dragOriginalQuantity = ref(0);
    const dragCurrentQuantity = ref(0);
    const dragStackedSlots = ref(new Map()); // Map<slotIndex, quantity>

    // Inventar Items (50 Slots)
    const inventoryItems = ref([]); // Dynamic size
    
    // Equipment Slots (4 Slots: Weste, Waffe, Tasche1, Tasche2)
    const equipmentSlots = ref({
        vest: null,    // Slot 0
        weapon: null,  // Slot 1
        bag1: null,    // Slot 2
        bag2: null     // Slot 3
    });
    
    // Equipment Config (aus equipment.json)
    const equipmentConfig = ref({
        vest: { allowedTypes: ['vest', 'armor'], rejectMessage: 'Nur Westen und Rüstungen' },
        weapon: { allowedTypes: ['weapon', 'tool'], rejectMessage: 'Nur Waffen und Werkzeuge' },
        bag1: { allowedTypes: ['backpack', 'large_bag'], rejectMessage: 'Nur Rucksäcke und große Taschen' },
        bag2: { allowedTypes: ['hip_bag', 'small_bag'], rejectMessage: 'Nur Bauchtaschen und kleine Taschen' }
    });
    
    // Dual Inventory Modal State
    const dualInventoryOpen = ref(false);
    const dualInventoryMode = ref(''); // 'give', 'ground', 'trunk', 'glovebox', 'bag', 'storage', 'stash'
    const dualInventoryTitle = ref('');
    const dualInventoryMetadata = ref({}); // Metadata für Trunk (plate), Stash (stashId), etc.
    const secondInventoryItems = ref([]); // Secondary inventory slots (dynamic size)
    const secondInventoryCache = {}; // Cache für gespeicherte Inventare nach Mode
    const movedFromMainInventory = new Set(); // Tracking welche Slots vom Hauptinventar ins Sonderinventar verschoben wurden
    
    // Equipment Modal State (for dual inventory mode)
    const equipmentModalOpen = ref(false);
    
    // Context Menu State (Right-Click)
    const contextMenuOpen = ref(false);
    const contextMenuPosition = ref({ x: 0, y: 0 });
    const contextMenuItem = ref(null);
    const contextMenuSlotIndex = ref(null);
    
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
        // Dynamische Slot-Anzahl (Standard: 50)
        const maxSlots = props.data?.maxSlots || 50;
        const items = Array(maxSlots).fill(null);
        
        console.log('[Inventar] 📊 Lade Inventar mit', maxSlots, 'Slots');
        console.log('[Inventar] Props data type:', typeof props.data);
        console.log('[Inventar] Props data:', JSON.stringify(props.data));
        
        // Prüfe verschiedene Datenstrukturen
        let inventoryData = null;
        let isObjectFormat = false;
        
        // Direkt als Array vom Server (Slot-based neues Format)
        if (Array.isArray(props.data)) {
            inventoryData = props.data;
            console.log('[Inventar] ✅ Found inventory as direct array:', inventoryData.length, 'items');
        }
        // Als inventory Property (Array)
        else if (Array.isArray(props.data?.inventory)) {
            inventoryData = props.data.inventory;
            console.log('[Inventar] ✅ Found inventory array:', inventoryData.length, 'items');
        }
        // Doppelt verschachtelt: { inventory: { inventory: [...] } } (Backend unwrap)
        else if (props.data?.inventory?.inventory && Array.isArray(props.data.inventory.inventory)) {
            inventoryData = props.data.inventory.inventory;
            console.log('[Inventar] ✅ Found nested inventory array (unwrapped):', inventoryData.length, 'items');
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
                // Objekt-Format: Konvertiere { itemName_slotX: { slot, name, label, amount, ... } } zu Array
                let loadedCount = 0;
                for (const [uniqueKey, itemData] of Object.entries(inventoryData)) {
                    if (itemData && typeof itemData.slot === 'number' && itemData.slot >= 0 && itemData.slot < maxSlots) {
                        // Extract actual itemName from itemData.name (not from the key which is itemName_slotX)
                        const actualItemName = itemData.name || uniqueKey.split('_slot')[0] || uniqueKey;
                        
                        items[itemData.slot] = {
                            id: itemData.slot,
                            itemName: actualItemName, // Use actual item name for server communication
                            name: itemData.label || actualItemName || 'Unbekannt',
                            emoji: itemData.emoji || getEmojiForItem(actualItemName), // Nutze Emoji aus itemlist.json
                            quantity: itemData.amount || 1,
                            // Equipment Metadata (von Server)
                            type: itemData.type || 'item',
                            equipSlot: itemData.equipSlot || null,
                            hasStorage: itemData.hasStorage || false,
                            equipmentId: itemData.equipmentId || null,
                            itemweight: itemData.itemweight || 0,
                            canUse: itemData.canUse || false
                        };
                        loadedCount++;
                        console.log('[Inventar] Loaded', actualItemName, 'in slot', itemData.slot, ':', itemData.label || actualItemName, 'x', itemData.amount);
                    } else if (itemData) {
                        console.warn('[Inventar] ⚠️ Item', uniqueKey, 'hat keinen gültigen Slot:', itemData.slot);
                    }
                }
                console.log('[Inventar] ✅', loadedCount, 'Items aus Objekt-Format geladen');
            } else if (Array.isArray(inventoryData) && inventoryData.length > 0) {
                // Array-Format (Slot-based from server)
                let loadedCount = 0;
                inventoryData.forEach((item, index) => {
                    // Skip null/empty slots
                    if (!item || item === null || typeof item !== 'object') {
                        return;
                    }
                    
                    // Use slot from item or fallback to array index
                    const slotIndex = typeof item.slot === 'number' ? item.slot : index;
                    
                    if (slotIndex >= 0 && slotIndex < 50) {
                        items[slotIndex] = {
                            id: slotIndex,
                            itemName: item.name || item.itemName,
                            name: item.label || item.name || 'Unbekannt',
                            emoji: item.emoji || '📦',
                            quantity: item.amount || item.quantity || 1,
                            // Equipment Metadata (von Server)
                            type: item.type || 'item',
                            equipSlot: item.equipSlot || null,
                            hasStorage: item.hasStorage || false,
                            equipmentId: item.equipmentId || null,
                            itemweight: item.itemweight || 0,
                            canUse: item.canUse || false
                        };
                        loadedCount++;
                        console.log('[Inventar] Loaded item in slot', slotIndex, ':', item.label || item.name, 'x', (item.amount || item.quantity || 1));
                    }
                });
                console.log('[Inventar] ✅', loadedCount, 'Items aus Array-Format geladen');
            }
        }
        
        // Setze Inventar (auch wenn leer)
        inventoryItems.value = items;
        const loadedCount = items.filter(item => item !== null).length;
        console.log('[Inventar] ✅ Geladene Items:', loadedCount, 'von', maxSlots);
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
    
    // Equipment Validation: Prüft ob Item in Equipment-Slot gedroppt werden darf
    const canEquipToSlot = (item, targetSlot) => {
        if (!item || !item.type) return { allowed: false, message: 'Ungültiges Item' };
        
        const slotConfig = equipmentConfig.value[targetSlot];
        if (!slotConfig) return { allowed: false, message: 'Ungültiger Slot' };
        
        // Prüfe ob Item-Typ erlaubt ist
        const isAllowed = slotConfig.allowedTypes.includes(item.type);
        
        return {
            allowed: isAllowed,
            message: isAllowed ? null : slotConfig.rejectMessage
        };
    };

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
            // Immer 50 Slots für symmetrisches Layout (gleiche Größe wie Hauptinventar)
            const slots = 50;
            secondInventoryItems.value = Array(slots).fill(null);
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
        console.log('[Inventar] Dual-Inventar Items entfernen - Items zurück ins Spieler-Inventar');
        
        // Finde alle Items im Dual-Inventar
        const itemsToReturn = [];
        secondInventoryItems.value.forEach((item, index) => {
            if (item && item.name) {
                itemsToReturn.push({ ...item, fromSlot: index });
            }
        });
        
        console.log('[Inventar] 📦 Items zum Zurückgeben:', itemsToReturn.length);
        
        // Schiebe Items zurück ins Spieler-Inventar
        itemsToReturn.forEach(item => {
            // Finde ersten leeren Slot im Hauptinventar
            const emptySlot = inventoryItems.value.findIndex(slot => !slot);
            if (emptySlot !== -1) {
                inventoryItems.value[emptySlot] = {
                    id: emptySlot,
                    itemName: item.itemName || item.name,
                    name: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    itemweight: item.itemweight,
                    type: item.type,
                    canUse: item.canUse
                };
                console.log('[Inventar] ✅ Item zurückgelegt:', item.name, 'in Slot', emptySlot);
            } else {
                console.warn('[Inventar] ⚠️ Kein Platz für Item:', item.name);
            }
        });
        
        // Leere das Dual-Inventar
        const emptySlots = secondInventoryItems.value.length;
        secondInventoryItems.value = Array(emptySlots).fill(null);
        
        // Speichere beide Inventare sofort
        console.log('[Inventar] 💾 Auto-Save nach Items Entfernen...');
        
        const mainInvArray = inventoryItems.value.map((item, index) => {
            if (!item) return null;
            return {
                slot: index,
                name: item.itemName || item.name,
                label: item.name,
                emoji: item.emoji,
                quantity: item.quantity || 1,
                itemweight: item.itemweight || 0,
                type: item.type || 'item',
                canUse: item.canUse || false
            };
        }).filter(item => item !== null);
        
        const secondInvArray = []; // Leer nach clear
        
        if (dualInventoryMode.value === 'trunk') {
            NUIBridge.send('saveTrunk', {
                plate: dualInventoryMetadata.value.plate,
                inventory: secondInvArray,
                mainInventory: mainInvArray
            });
        } else if (dualInventoryMode.value === 'glovebox') {
            NUIBridge.send('saveGlovebox', {
                plate: dualInventoryMetadata.value.plate,
                inventory: secondInvArray,
                mainInventory: mainInvArray
            });
        } else if (dualInventoryMode.value === 'stash') {
            NUIBridge.send('saveStash', {
                stashId: dualInventoryMetadata.value.stashId,
                inventory: secondInvArray,
                mainInventory: mainInvArray
            });
        }
        
        console.log('[Inventar] ✅ Alle Items zurückgelegt und gespeichert');
    };

    const confirmDualInventory = () => {
        console.log('[Inventar] Dual-Inventar bestätigen - Mode:', dualInventoryMode.value);
        
        const mode = dualInventoryMode.value;
        const metadata = dualInventoryMetadata.value || {};
        
        // Sammle alle Items die übergeben/gespeichert werden sollen
        const itemsToTransfer = secondInventoryItems.value
            .map((item, index) => item && item.name ? { 
                name: item.itemName || item.name,
                itemName: item.itemName || item.name,
                quantity: item.quantity || item.amount || 1,
                slot: index 
            } : null)
            .filter(item => item !== null);
        
        if (itemsToTransfer.length === 0 && mode !== 'trunk' && mode !== 'glovebox' && mode !== 'stash') {
            console.log('[Inventar] Keine Items zum Übertragen');
            closeDualInventory();
            return;
        }
        
        console.log('[Inventar] Items zum Übertragen:', itemsToTransfer);
        
        // Mode-spezifische Aktionen
        if (mode === 'give' || mode === 'ground') {
            // Geben oder Boden: Nutze giveItems Event
            send('giveItems', { 
                mode: mode, 
                items: itemsToTransfer 
            });
            
            // Cache bleibt für Session erhalten
            secondInventoryCache[mode] = secondInventoryItems.value
                .map(item => item && item.name ? { ...item } : null);
            
            movedFromMainInventory.clear();
        } 
        else if (mode === 'trunk') {
            // Kofferraum: Speichere Inventar in DB (ARRAY format)
            const trunkInventory = secondInventoryItems.value.map((item, index) => {
                if (!item || !item.name) return null;
                return {
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    amount: item.quantity || 1,
                    slot: index,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {}
                };
            });
            
            // Haupt-Inventar auch speichern (Anti-Duping)
            const mainInventory = inventoryItems.value.map((item, index) => {
                if (!item || !item.name) return null;
                return {
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    amount: item.quantity || 1,
                    slot: index,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {}
                };
            });
            
            send('saveTrunk', {
                plate: metadata.plate,
                inventory: trunkInventory,
                mainInventory: mainInventory
            });
            
            console.log('[Inventar] ✅ Kofferraum + Hauptinventar gespeichert für Plate:', metadata.plate);
        }
        else if (mode === 'glovebox') {
            // Handschuhfach: Speichere in DB (ARRAY format)
            const gloveboxInventory = secondInventoryItems.value.map((item, index) => {
                if (!item || !item.name) return null;
                return {
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    amount: item.quantity || 1,
                    slot: index,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {}
                };
            });
            
            // Haupt-Inventar auch speichern (Anti-Duping)
            const mainInventory = inventoryItems.value.map((item, index) => {
                if (!item || !item.name) return null;
                return {
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    amount: item.quantity || 1,
                    slot: index,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {}
                };
            });
            
            send('saveGlovebox', {
                plate: metadata.plate,
                inventory: gloveboxInventory,
                mainInventory: mainInventory
            });
            
            console.log('[Inventar] ✅ Handschuhfach + Hauptinventar gespeichert für Plate:', metadata.plate);
        }
        else if (mode === 'stash') {
            // Lager: Speichere in DB (ARRAY format)
            const stashInventory = secondInventoryItems.value.map((item, index) => {
                if (!item || !item.name) return null;
                return {
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    amount: item.quantity || 1,
                    slot: index,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {}
                };
            });
            
            // Haupt-Inventar auch speichern (Anti-Duping)
            const mainInventory = inventoryItems.value.map((item, index) => {
                if (!item || !item.name) return null;
                return {
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    amount: item.quantity || 1,
                    slot: index,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {}
                };
            });
            
            send('saveStash', {
                stashId: metadata.stashId,
                inventory: stashInventory,
                mainInventory: mainInventory
            });
            
            console.log('[Inventar] ✅ Lager + Hauptinventar gespeichert für ID:', metadata.stashId);
        }
        else if (mode === 'equipment') {
            // Equipment Storage (Rucksack/Tasche): Speichere in DB
            const equipmentInventory = {};
            secondInventoryItems.value.forEach((item, index) => {
                if (item && item.name) {
                    equipmentInventory[item.itemName || item.name] = {
                        label: item.name,
                        amount: item.quantity || 1,
                        slot: index,
                        itemweight: item.itemweight || 0,
                        type: item.type || 'item',
                        canUse: item.canUse || false
                    };
                }
            });
            
            send('saveEquipment', {
                equipmentId: metadata.equipmentId,
                inventory: equipmentInventory
            });
            
            console.log('[Inventar] ✅ Equipment-Storage gespeichert für ID:', metadata.equipmentId);
        }
        
        // Schließe Modal
        dualInventoryOpen.value = false;
        dualInventoryMode.value = '';
        
        console.log('[Inventar] 💾 Dual-Inventar abgeschlossen');
    };

    const closeDualInventory = () => {
        console.log('[Inventar] Dual-Inventar schließen & speichern');
        
        // Auto-Save beim Schließen (wie bestätigen)
        const mode = dualInventoryMode.value;
        const metadata = dualInventoryMetadata.value || {};
        
        if (mode === 'trunk') {
            // Build ARRAY format for server (not Object!)
            const trunkInventory = secondInventoryItems.value.map((item, index) => {
                if (!item || !item.name) return null;
                return {
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    amount: item.quantity || 1,
                    slot: index,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {}
                };
            });
            
            const mainInventory = inventoryItems.value.map((item, index) => {
                if (!item || !item.name) return null;
                return {
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    amount: item.quantity || 1,
                    slot: index,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {}
                };
            });
            
            send('saveTrunk', {
                plate: metadata.plate,
                inventory: trunkInventory,
                mainInventory: mainInventory
            });
            console.log('[Inventar] 💾 Auto-Save: Kofferraum');
        }
        else if (mode === 'glovebox') {
            // Build ARRAY format for server
            const gloveboxInventory = secondInventoryItems.value.map((item, index) => {
                if (!item || !item.name) return null;
                return {
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    amount: item.quantity || 1,
                    slot: index,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {}
                };
            });
            
            const mainInventory = inventoryItems.value.map((item, index) => {
                if (!item || !item.name) return null;
                return {
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    amount: item.quantity || 1,
                    slot: index,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {}
                };
            });
            
            send('saveGlovebox', {
                plate: metadata.plate,
                inventory: gloveboxInventory,
                mainInventory: mainInventory
            });
            console.log('[Inventar] 💾 Auto-Save: Handschuhfach');
        }
        else if (mode === 'stash') {
            // Build ARRAY format for server
            const stashInventory = secondInventoryItems.value.map((item, index) => {
                if (!item || !item.name) return null;
                return {
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    amount: item.quantity || 1,
                    slot: index,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {}
                };
            });
            
            const mainInventory = inventoryItems.value.map((item, index) => {
                if (!item || !item.name) return null;
                return {
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    amount: item.quantity || 1,
                    slot: index,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {}
                };
            });
            
            send('saveStash', {
                stashId: metadata.stashId,
                inventory: stashInventory,
                mainInventory: mainInventory
            });
            console.log('[Inventar] 💾 Auto-Save: Lager');
        }
        
        // Schließe Modal
        secondInventoryItems.value = [];
        movedFromMainInventory.clear();
        dualInventoryOpen.value = false;
        dualInventoryMode.value = '';
        
        console.log('[Inventar] ✅ Dual-Inventar geschlossen & gespeichert');
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
    
    const toggleEquipmentModal = () => {
        equipmentModalOpen.value = !equipmentModalOpen.value;
        console.log('[Inventar] Equipment Modal:', equipmentModalOpen.value ? 'geöffnet' : 'geschlossen');
    };
    
    // Context Menu Functions (Right-Click)
    const openContextMenu = (event, item, slotIndex) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (!item || !isItemDefined(item)) {
            return; // No context menu for empty slots
        }
        
        contextMenuItem.value = item;
        contextMenuSlotIndex.value = slotIndex;
        contextMenuPosition.value = {
            x: event.clientX,
            y: event.clientY
        };
        contextMenuOpen.value = true;
        
        console.log('[Context Menu] Opened for item:', item.name, 'at slot:', slotIndex);
    };
    
    const closeContextMenu = () => {
        contextMenuOpen.value = false;
        contextMenuItem.value = null;
        contextMenuSlotIndex.value = null;
    };
    
    const useItemFromContext = () => {
        if (contextMenuItem.value) {
            console.log('[Context Menu] Use item:', contextMenuItem.value.name);
            send('useItem', {
                itemName: contextMenuItem.value.name,
                slot: contextMenuSlotIndex.value
            });
        }
        closeContextMenu();
    };
    
    const showItemDescription = () => {
        if (contextMenuItem.value) {
            console.log('[Context Menu] Show description for:', contextMenuItem.value.name);
            // TODO: Show modal with item description
            alert(`${contextMenuItem.value.emoji} ${contextMenuItem.value.label || contextMenuItem.value.name}\n\nBeschreibung: Ein nützliches Item.`);
        }
        closeContextMenu();
    };
    
    const showItemInfo = () => {
        if (contextMenuItem.value) {
            console.log('[Context Menu] Show info for:', contextMenuItem.value.name);
            // TODO: Show modal with metadata
            const metadata = contextMenuItem.value.metadata || [];
            const metaStr = metadata.length > 0 ? JSON.stringify(metadata, null, 2) : 'Keine Metadaten';
            alert(`${contextMenuItem.value.emoji} ${contextMenuItem.value.label || contextMenuItem.value.name}\n\nMetadaten:\n${metaStr}`);
        }
        closeContextMenu();
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
                    <div class="quantity-badge" style="position: absolute; bottom: -0.5vw; right: -0.5vw; background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(34, 197, 94, 0.9)); color: white; padding: 0.2vw 0.5vw; border-radius: 0.5vw; font-size: 0.8vw; font-weight: bold; border: 0.1vw solid rgba(255, 255, 255, 0.3); box-shadow: 0 0 1vw rgba(59, 130, 246, 0.6);">
                        x${item.quantity}
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
        
        // Initialize mouse wheel stacking
        dragOriginalQuantity.value = item.quantity || 1;
        dragCurrentQuantity.value = item.quantity || 1;
        dragStackedSlots.value.clear();

        // Create ghost element
        createDragGhost(item);
        updateGhostPosition(e.clientX, e.clientY);

        // Add dragging class to original element
        e.currentTarget.classList.add('dragging');
        
        // Change cursor
        document.body.style.cursor = 'grabbing';
        
        console.log('[Inventar] Mouse drag started:', item.name, 'from slot', index, isFromSecond ? '(Second Inventory)' : '(Main Inventory)', 'Quantity:', dragOriginalQuantity.value);
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

    const handleMouseWheel = (e) => {
        if (!isDragging.value || dragCurrentQuantity.value <= 0 && e.deltaY < 0) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const targetSlot = getSlotAtPosition(e.clientX, e.clientY);
        if (!targetSlot) return;
        
        const slotIndexAttr = targetSlot.getAttribute('data-slot-index');
        const equipmentSlot = targetSlot.getAttribute('data-equipment-slot');
        
        // Equipment slots not supported for mouse-wheel stacking
        if (equipmentSlot) return;
        
        if (!slotIndexAttr) return;
        const slotIndex = slotIndexAttr; // Keep as string for Map key
        
        // Detect scroll direction (SWAPPED: UP = take back, DOWN = place)
        const scrollDown = e.deltaY > 0; // Scroll DOWN = place item
        
        if (scrollDown) {
            // Place 1 item into hovered slot
            if (dragCurrentQuantity.value > 0) {
                dragCurrentQuantity.value--;
                const current = dragStackedSlots.value.get(slotIndex) || 0;
                dragStackedSlots.value.set(slotIndex, current + 1);
                
                // Visual feedback on slot
                targetSlot.classList.add('stacking-active');
                setTimeout(() => targetSlot.classList.remove('stacking-active'), 150);
                
                // Add/update visual stacking badge
                updateSlotStackBadge(targetSlot, current + 1);
                
                updateGhostQuantity();
                console.log('[Inventar] Scroll DOWN: Placed 1 item in slot', slotIndex, '| Remaining:', dragCurrentQuantity.value);
            }
        } else {
            // Scroll UP = take 1 item back from this slot
            const stacked = dragStackedSlots.value.get(slotIndex) || 0;
            if (stacked > 0) {
                dragCurrentQuantity.value++;
                dragStackedSlots.value.set(slotIndex, stacked - 1);
                if (stacked === 1) {
                    dragStackedSlots.value.delete(slotIndex);
                    // Remove badge when empty
                    removeSlotStackBadge(targetSlot);
                } else {
                    // Update badge
                    updateSlotStackBadge(targetSlot, stacked - 1);
                }
                
                // Visual feedback
                targetSlot.classList.add('stacking-remove');
                setTimeout(() => targetSlot.classList.remove('stacking-remove'), 150);
                
                updateGhostQuantity();
                console.log('[Inventar] Scroll UP: Took 1 item back from slot', slotIndex, '| Remaining:', dragCurrentQuantity.value);
            }
        }
    };

    const updateGhostQuantity = () => {
        const ghostElement = document.querySelector('.inventory-drag-ghost');
        if (!ghostElement) return;
        
        // Update quantity badge
        const quantityBadge = ghostElement.querySelector('.quantity-badge');
        if (quantityBadge) {
            quantityBadge.textContent = `x${dragCurrentQuantity.value}`;
            
            // Visual indicator when quantity is 0
            if (dragCurrentQuantity.value === 0) {
                ghostElement.style.opacity = '0.3';
                ghostElement.style.border = '2px solid red';
            } else {
                ghostElement.style.opacity = '0.8';
                ghostElement.style.border = 'none';
            }
        }
    };

    const updateSlotStackBadge = (slotElement, quantity) => {
        if (!slotElement) return;
        
        // Remove existing badge
        const existingBadge = slotElement.querySelector('.slot-stack-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Create new badge
        const badge = document.createElement('div');
        badge.className = 'slot-stack-badge';
        badge.textContent = `+${quantity}`;
        badge.style.cssText = `
            position: absolute;
            top: 0.3vw;
            right: 0.3vw;
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(22, 163, 74, 0.9));
            color: white;
            padding: 0.2vw 0.5vw;
            border-radius: 0.5vw;
            font-size: 0.7vw;
            font-weight: bold;
            border: 0.1vw solid rgba(255, 255, 255, 0.4);
            box-shadow: 0 0 0.8vw rgba(34, 197, 94, 0.8), inset 0 0 0.3vw rgba(255, 255, 255, 0.3);
            z-index: 100;
            pointer-events: none;
            animation: badgePulse 0.3s ease-out;
        `;
        
        slotElement.style.position = 'relative';
        slotElement.appendChild(badge);
    };

    const removeSlotStackBadge = (slotElement) => {
        if (!slotElement) return;
        const badge = slotElement.querySelector('.slot-stack-badge');
        if (badge) {
            badge.style.animation = 'badgeFadeOut 0.2s ease-out';
            setTimeout(() => badge.remove(), 200);
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

        // APPLY MOUSE-WHEEL STACKING: Commit dragStackedSlots to inventories
        if (dragStackedSlots.value.size > 0) {
            console.log('[Inventar] Applying mouse-wheel stacked items:', dragStackedSlots.value);
            
            // Get source item
            const isFromEquipment = typeof fromIndex === 'string' && fromIndex.startsWith('equipment_');
            const isFromSecond = typeof fromIndex === 'string' && fromIndex.startsWith('second-');
            const fromActualIndex = isFromSecond ? parseInt(fromIndex.replace('second-', '')) : (isFromEquipment ? null : fromIndex);
            
            let sourceItem = null;
            let sourceArray = null;
            
            if (isFromEquipment) {
                const fromEquipmentType = fromIndex.replace('equipment_', '');
                sourceItem = equipmentSlots.value[fromEquipmentType];
            } else if (isFromSecond) {
                sourceArray = secondInventoryItems.value;
                sourceItem = sourceArray[fromActualIndex];
            } else {
                sourceArray = inventoryItems.value;
                sourceItem = sourceArray[fromIndex];
            }
            
            if (sourceItem && dragOriginalQuantity.value > 0) {
                // Apply stacked quantities to target slots
                dragStackedSlots.value.forEach((quantity, slotIndexStr) => {
                    const isTargetSecond = slotIndexStr.startsWith('second-');
                    const targetIndex = isTargetSecond ? parseInt(slotIndexStr.replace('second-', '')) : parseInt(slotIndexStr);
                    const targetArray = isTargetSecond ? secondInventoryItems.value : inventoryItems.value;
                    
                    if (targetArray[targetIndex] && targetArray[targetIndex].name === sourceItem.name) {
                        // Stack on existing item
                        targetArray[targetIndex].quantity = (targetArray[targetIndex].quantity || 1) + quantity;
                        console.log('[Inventar] Stacked', quantity, 'x', sourceItem.name, 'into slot', slotIndexStr);
                    } else if (!targetArray[targetIndex]) {
                        // Place new item in empty slot
                        targetArray[targetIndex] = {
                            ...sourceItem,
                            quantity: quantity
                        };
                        console.log('[Inventar] Placed', quantity, 'x', sourceItem.name, 'into empty slot', slotIndexStr);
                    }
                });
                
                // Update source item quantity
                if (!isFromEquipment && sourceArray) {
                    if (dragCurrentQuantity.value === 0) {
                        // All items distributed - remove source
                        if (isFromSecond) {
                            secondInventoryItems.value[fromActualIndex] = null;
                        } else {
                            inventoryItems.value[fromIndex] = null;
                        }
                        console.log('[Inventar] Source item fully distributed - removed');
                    } else {
                        // Update remaining quantity
                        sourceItem.quantity = dragCurrentQuantity.value;
                        console.log('[Inventar] Source item reduced to', dragCurrentQuantity.value);
                    }
                }
            }
            
            // Send updated inventory to server after mouse-wheel stacking
            console.log('[Inventar] 🔄 Syncing mouse-wheel stacked items to server...');
            
            // Sync main inventory
            NUIBridge.send('updateInventoryOrder', {
                inventory: inventoryItems.value.map((item, index) => item ? { ...item, slot: index } : null).filter(item => item !== null)
            });
            
            // Sync dual inventory if changed (check if any second- slots were stacked)
            const hasSecondInventoryChanges = Array.from(dragStackedSlots.value.keys()).some(key => key.startsWith('second-'));
            if (hasSecondInventoryChanges && dualInventoryOpen.value) {
                console.log('[Inventar] 🔄 Syncing dual inventory to server...');
                
                // Build inventory array for server
                const inventoryArray = secondInventoryItems.value.map((item, index) => {
                    if (!item) return null;
                    return {
                        slot: index,
                        name: item.itemName || item.name,
                        label: item.name,
                        emoji: item.emoji,
                        quantity: item.quantity || 1,
                        itemweight: item.itemweight || 0,
                        type: item.type || 'item',
                        canUse: item.canUse || false
                    };
                }).filter(item => item !== null);
                
                // Get main inventory for anti-duping
                const mainInventoryArray = inventoryItems.value.map((item, index) => {
                    if (!item) return null;
                    return {
                        slot: index,
                        name: item.itemName || item.name,
                        label: item.name,
                        emoji: item.emoji,
                        quantity: item.quantity || 1,
                        itemweight: item.itemweight || 0,
                        type: item.type || 'item',
                        canUse: item.canUse || false
                    };
                }).filter(item => item !== null);
                
                // Determine correct callback based on mode
                if (dualInventoryMode.value === 'trunk') {
                    NUIBridge.send('saveTrunk', {
                        plate: dualInventoryMetadata.value.plate,
                        inventory: inventoryArray,
                        mainInventory: mainInventoryArray
                    });
                } else if (dualInventoryMode.value === 'glovebox') {
                    NUIBridge.send('saveGlovebox', {
                        plate: dualInventoryMetadata.value.plate,
                        inventory: inventoryArray,
                        mainInventory: mainInventoryArray
                    });
                } else if (dualInventoryMode.value === 'stash') {
                    NUIBridge.send('saveStash', {
                        stashId: dualInventoryMetadata.value.stashId,
                        inventory: inventoryArray,
                        mainInventory: mainInventoryArray
                    });
                }
                
                console.log('[Inventar] ✅ Dual inventory saved:', dualInventoryMode.value);
            }
            
            // Reset drag state and clean up badges
            document.querySelectorAll('.slot-stack-badge').forEach(badge => badge.remove());
            dragStackedSlots.value.clear();
            dragOriginalQuantity.value = 0;
            dragCurrentQuantity.value = 0;
            removeDragGhost();
            isDragging.value = false;
            draggedItemIndex.value = null;
            return; // Exit early - stacking was applied
        }

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
                
                // Hole das Item das gedroppt wurde
                let droppedItem = null;
                if (isFromEquipment) {
                    droppedItem = equipmentSlots.value[fromEquipmentType];
                } else if (isFromSecond) {
                    droppedItem = secondInventoryItems.value[fromActualIndex];
                } else {
                    droppedItem = inventoryItems.value[fromIndex];
                }
                
                // VALIDIERUNG: Prüfe ob Item in diesen Slot darf
                const validation = canEquipToSlot(droppedItem, equipmentSlotType);
                
                if (!validation.allowed) {
                    console.log('[Inventar] ❌ Equip rejected:', validation.message);
                    
                    // Visual Feedback: Rot blinken
                    targetSlot.style.animation = 'shake 0.3s ease';
                    targetSlot.style.background = 'rgba(220, 38, 38, 0.3)';
                    setTimeout(() => {
                        targetSlot.style.animation = '';
                        targetSlot.style.background = '';
                    }, 300);
                    
                    // Zeige Fehlermeldung
                    // Temporäres Div über dem Slot
                    const errorDiv = document.createElement('div');
                    errorDiv.textContent = validation.message;
                    errorDiv.style.cssText = `
                        position: fixed;
                        left: ${e.clientX}px;
                        top: ${e.clientY - 30}px;
                        background: rgba(220, 38, 38, 0.95);
                        color: white;
                        padding: 8px 12px;
                        border-radius: 8px;
                        font-size: 12px;
                        font-weight: bold;
                        z-index: 10001;
                        pointer-events: none;
                        animation: fadeOut 2s ease forwards;
                    `;
                    document.body.appendChild(errorDiv);
                    setTimeout(() => {
                        if (errorDiv.parentNode) {
                            document.body.removeChild(errorDiv);
                        }
                    }, 2000);
                    
                    // Breche ab - kein Equip
                    removeDragGhost();
                    isDragging.value = false;
                    draggedItemIndex.value = null;
                    return;
                }
                
                // VALIDIERUNG OK: Equipment darf equipped werden
                console.log('[Inventar] ✅ Equipment validation passed');
                
                // Visual feedback
                targetSlot.style.animation = 'pulse 0.3s ease';
                targetSlot.style.background = 'rgba(34, 197, 94, 0.3)';
                setTimeout(() => {
                    targetSlot.style.animation = '';
                    targetSlot.style.background = '';
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
                        
                        // Wenn Item ein Equipment mit Storage ist: Merke equipmentId
                        if (item.equipmentId) {
                            console.log('[Inventar] 🗃️ Equipment hat Storage-ID:', item.equipmentId);
                        }
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
                            const sourceItem = secondInventoryItems.value[fromActualIndex];
                            const targetItem = secondInventoryItems.value[toIndex];
                            
                            // Check if same item type → stack
                            if (sourceItem && targetItem && sourceItem.itemName === targetItem.itemName) {
                                // Stack items
                                targetItem.quantity = (targetItem.quantity || 1) + (sourceItem.quantity || 1);
                                secondInventoryItems.value[fromActualIndex] = null;
                                console.log('[Inventar] ✅ Items stacked in second inventory:', sourceItem.name, 'x', targetItem.quantity);
                            } else {
                                // Different items → swap
                                secondInventoryItems.value[fromActualIndex] = targetItem;
                                secondInventoryItems.value[toIndex] = sourceItem;
                                console.log('[Inventar] ✅ Items swapped within second inventory:', fromActualIndex, '↔', toIndex);
                            }
                            
                            // WICHTIG: Sofort an Server senden
                            console.log('[Inventar] 💾 Auto-Save nach Dual-Inventory-Move (innerhalb)...');
                            
                            const mainInvArray = inventoryItems.value.map((item, index) => {
                                if (!item) return null;
                                return {
                                    slot: index,
                                    name: item.itemName || item.name,
                                    label: item.name,
                                    emoji: item.emoji,
                                    quantity: item.quantity || 1,
                                    itemweight: item.itemweight || 0,
                                    type: item.type || 'item',
                                    canUse: item.canUse || false
                                };
                            }).filter(item => item !== null);
                            
                            const secondInvArray = secondInventoryItems.value.map((item, index) => {
                                if (!item) return null;
                                return {
                                    slot: index,
                                    name: item.itemName || item.name,
                                    label: item.name,
                                    emoji: item.emoji,
                                    quantity: item.quantity || 1,
                                    itemweight: item.itemweight || 0,
                                    type: item.type || 'item',
                                    canUse: item.canUse || false
                                };
                            }).filter(item => item !== null);
                            
                            if (dualInventoryMode.value === 'trunk') {
                                NUIBridge.send('saveTrunk', {
                                    plate: dualInventoryMetadata.value.plate,
                                    inventory: secondInvArray,
                                    mainInventory: mainInvArray
                                });
                            } else if (dualInventoryMode.value === 'glovebox') {
                                NUIBridge.send('saveGlovebox', {
                                    plate: dualInventoryMetadata.value.plate,
                                    inventory: secondInvArray,
                                    mainInventory: mainInvArray
                                });
                            } else if (dualInventoryMode.value === 'stash') {
                                NUIBridge.send('saveStash', {
                                    stashId: dualInventoryMetadata.value.stashId,
                                    inventory: secondInvArray,
                                    mainInventory: mainInvArray
                                });
                            }
                            
                            console.log('[Inventar] ✅ Dual-Inventar gespeichert nach innerem Move');
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
                        
                        const sourceItem = fromArray[fromIdx];
                        const targetItem = toArray[toIndex];
                        
                        // Check if same item type → stack
                        if (sourceItem && targetItem && sourceItem.itemName === targetItem.itemName) {
                            // Stack items
                            targetItem.quantity = (targetItem.quantity || 1) + (sourceItem.quantity || 1);
                            fromArray[fromIdx] = null;
                            console.log('[Inventar] ✅ Items stacked between inventories:', sourceItem.name, 'x', targetItem.quantity);
                        } else {
                            // Different items → swap
                            fromArray[fromIdx] = targetItem;
                            toArray[toIndex] = sourceItem;
                            
                            // Tracking: Wenn vom Hauptinventar ins Sonderinventar
                            if (!isFromSecond && isToSecond && sourceItem && sourceItem.name) {
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
                        
                        // WICHTIG: Sofort an Server senden (beide Inventare)
                        console.log('[Inventar] 💾 Auto-Save nach Dual-Inventory-Move...');
                        
                        // Build arrays for server
                        const mainInvArray = inventoryItems.value.map((item, index) => {
                            if (!item) return null;
                            return {
                                slot: index,
                                name: item.itemName || item.name,
                                label: item.name,
                                emoji: item.emoji,
                                quantity: item.quantity || 1,
                                itemweight: item.itemweight || 0,
                                type: item.type || 'item',
                                canUse: item.canUse || false
                            };
                        }).filter(item => item !== null);
                        
                        const secondInvArray = secondInventoryItems.value.map((item, index) => {
                            if (!item) return null;
                            return {
                                slot: index,
                                name: item.itemName || item.name,
                                label: item.name,
                                emoji: item.emoji,
                                quantity: item.quantity || 1,
                                itemweight: item.itemweight || 0,
                                type: item.type || 'item',
                                canUse: item.canUse || false
                            };
                        }).filter(item => item !== null);
                        
                        // Send both inventories to server
                        if (dualInventoryMode.value === 'trunk') {
                            NUIBridge.send('saveTrunk', {
                                plate: dualInventoryMetadata.value.plate,
                                inventory: secondInvArray,
                                mainInventory: mainInvArray
                            });
                        } else if (dualInventoryMode.value === 'glovebox') {
                            NUIBridge.send('saveGlovebox', {
                                plate: dualInventoryMetadata.value.plate,
                                inventory: secondInvArray,
                                mainInventory: mainInvArray
                            });
                        } else if (dualInventoryMode.value === 'stash') {
                            NUIBridge.send('saveStash', {
                                stashId: dualInventoryMetadata.value.stashId,
                                inventory: secondInvArray,
                                mainInventory: mainInvArray
                            });
                        }
                        
                        console.log('[Inventar] ✅ Beide Inventare gespeichert nach Move');
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
            // Konvertiere Objekt-Format zu Array und lade neu
            const items = Array(50).fill(null);
            let loadedCount = 0;
            
            for (const [uniqueKey, itemData] of Object.entries(data.inventory)) {
                if (itemData && typeof itemData.slot === 'number' && itemData.slot >= 0 && itemData.slot < 50) {
                    // Extract actual itemName from itemData.name field
                    const actualItemName = itemData.name || uniqueKey.split('_slot')[0] || uniqueKey;
                    
                    items[itemData.slot] = {
                        id: itemData.slot,
                        itemName: actualItemName,
                        name: itemData.label || actualItemName || 'Unbekannt',
                        emoji: itemData.emoji || getEmojiForItem(actualItemName),
                        quantity: itemData.amount || 1
                    };
                    loadedCount++;
                }
            }
            
            inventoryItems.value = items;
            console.log('[Inventar] ✅ Inventar vom Server aktualisiert:', loadedCount, 'Items');
        }
    };

    // NUI Listener: Dual Inventory von Client öffnen (Trunk, Glovebox, Stash, Ground)
    const handleOpenDualInventory = (data) => {
        console.log('[Inventar] 🔄 Client öffnet Dual-Inventar:', data.mode, data);
        
        dualInventoryMode.value = data.mode;
        dualInventoryTitle.value = data.title || '📦 Sekundär-Inventar';
        dualInventoryMetadata.value = data.metadata || {};
        
        // Lade Secondary Inventory aus Server-Daten
        const secondaryInv = data.secondaryInventory || {};
        const maxSlots = data.maxSlots || 50; // Dynamische Slot-Anzahl vom Server
        const newItems = Array(maxSlots).fill(null);
        
        console.log('[Inventar] 📊 Dual-Inventory mit', maxSlots, 'Slots erstellt');
        
        // Konvertiere Object-Format zu Array
        for (const [itemName, itemData] of Object.entries(secondaryInv)) {
            if (itemData && typeof itemData.slot === 'number' && itemData.slot >= 0 && itemData.slot < maxSlots) {
                newItems[itemData.slot] = {
                    id: itemData.slot,
                    itemName: itemName,
                    name: itemData.label || itemName || 'Unbekannt',
                    emoji: itemData.emoji || getEmojiForItem(itemName),
                    quantity: itemData.amount || 1,
                    itemweight: itemData.itemweight,
                    type: itemData.type,
                    canUse: itemData.canUse
                };
            }
        }
        
        secondInventoryItems.value = newItems;
        dualInventoryOpen.value = true;
        
        console.log('[Inventar] ✅ Dual-Inventar geöffnet:', dualInventoryMode.value, 'Items:', newItems.filter(i => i).length);
    };
    
    // Lifecycle
    // ESC key handler for dual-inventory auto-save
    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && dualInventoryOpen.value) {
            e.preventDefault();
            closeDualInventory();
        }
    };
    
    onMounted(() => {
        console.log('[Inventar] Component mounted');
        console.log('[Inventar] Props data:', props.data);
        loadInventoryData();
        
        // Add global mouse event listeners for drag system
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('wheel', handleMouseWheel, { passive: false });
        
        // Add ESC key listener for dual-inventory auto-save
        document.addEventListener('keydown', handleKeyDown);
        
        // Add click listener to close context menu when clicking outside
        document.addEventListener('click', (e) => {
            if (contextMenuOpen.value && !e.target.closest('.context-menu')) {
                closeContextMenu();
            }
        });
        
        // Listen for server inventory updates
        window.NUIBridge.on('updateInventory', handleInventoryUpdate);
        
        // Listen for dual inventory open events from client
        window.NUIBridge.on('openDualInventory', handleOpenDualInventory);
    });

    onUnmounted(() => {
        // Cleanup mouse event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('wheel', handleMouseWheel);
        document.removeEventListener('keydown', handleKeyDown);
        
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
                    equipmentModalOpen,
                    selectedItem,
                    hoveredItem,
                    currentMousePos,
                    contextMenuOpen,
                    contextMenuPosition,
                    contextMenuItem,
                    keys,
                    licenses,
                    stats,
                    isItemDefined,
                    handleMouseDown,
                    handleEquipmentMouseDown,
                    openContextMenu,
                    closeContextMenu,
                    useItemFromContext,
                    showItemDescription,
                    showItemInfo,
                    openClothing,
                    toggleGiveMode,
                    toggleEquipmentModal,
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
        equipmentModalOpen,
        secondInventoryItems,
        currentMousePos,
        contextMenuOpen,
        contextMenuPosition,
        contextMenuItem,
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
        openContextMenu,
        closeContextMenu,
        useItemFromContext,
        showItemDescription,
        showItemInfo,
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
        toggleEquipmentModal,
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

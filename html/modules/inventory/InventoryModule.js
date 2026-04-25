// Import external design templates
import { generateBriefcaseTemplate } from './designs/BriefcaseDesign.js';
import { generateTacticalBackpackTemplate } from './designs/TacticalBackpackDesign.js';
import { generateRetroDrawerTemplate } from './designs/RetroDrawerDesign.js';
import { generateSciFiHudTemplate } from './designs/SciFiHudDesign.js';
import { generateForestTemplate } from './designs/ForestDesign.js';

// Import Settings Store
import { useSettingsStore } from '../settings/SettingsStore.js';

const { computed, ref, onMounted, onUnmounted, watch } = Vue;
const useNUI = window.useNUI;

const InventoryModule = {
    name: 'InventoryModule',
    props: ['data'],
    
    setup(props) {
    const { send, onClose } = useNUI();
    
    // Settings Store Integration
    const settingsStore = useSettingsStore();
    
    // State - WICHTIG: Lade Design erst nach Settings-Load, sonst immer forest!
    const layoutKey = ref('forest'); // Aktives Design (wird angezeigt)
    const tempLayoutKey = ref('forest'); // Temporäres Design im Settings-Modal
    const originalLayoutKey = ref('forest'); // Original Design vor Öffnen des Modals (für Abbrechen)
    const isDesignLoading = ref(true); // Controls opacity during design load (500ms)
    const themeKey = ref('classicLeather');
    const animationKey = ref('none');
    const inventoryScale = ref(1.0);
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

    // State für Keys, Licenses, Stats (werden vom Server geladen)
    const keys = ref([]);
    const licenses = ref([]);
    const stats = ref([
        { name: 'Health', value: 0, max: 100, color: '#16a34a' },
        { name: 'Armor', value: 0, max: 100, color: '#2563eb' },
        { name: 'Hunger', value: 0, max: 100, color: '#ea580c' },
        { name: 'Durst', value: 0, max: 100, color: '#7c3aed' },
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
        
        FWDebug.log('Inventory', 'Loading', maxSlots, 'slots');
        
        // Prüfe verschiedene Datenstrukturen
        let inventoryData = null;
        let isObjectFormat = false;
        
        // Direkt als Array vom Server (Slot-based neues Format)
        if (Array.isArray(props.data)) {
            inventoryData = props.data;
            FWDebug.log('Inventory', 'Format: direct array', inventoryData.length);
        }
        // Als inventory Property (Array)
        else if (Array.isArray(props.data?.inventory)) {
            inventoryData = props.data.inventory;
            FWDebug.log('Inventory', 'Format: inventory array', inventoryData.length);
        }
        // Doppelt verschachtelt: { inventory: { inventory: [...] } } (Backend unwrap)
        else if (props.data?.inventory?.inventory && Array.isArray(props.data.inventory.inventory)) {
            inventoryData = props.data.inventory.inventory;
            FWDebug.log('Inventory', 'Format: nested array', inventoryData.length);
        }
        // Als Objekt (Server-Format: { itemName: { label, amount, slot, ... } })
        else if (props.data?.inventory && typeof props.data.inventory === 'object' && !Array.isArray(props.data.inventory)) {
            inventoryData = props.data.inventory;
            isObjectFormat = true;
            FWDebug.log('Inventory', 'Format: object', Object.keys(inventoryData).length);
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
                            canUse: itemData.canUse || false,
                            stackable: itemData.stackable !== false,
                            metadata: itemData.metadata || {} // Metadata direkt aus Server-Daten übernehmen
                        };
                        loadedCount++;
                    } else if (itemData) {
                        FWDebug.log('Inventory', 'Invalid slot', uniqueKey, itemData.slot);
                    }
                }
                FWDebug.log('Inventory', 'Loaded object format', loadedCount);
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
                    }
                });
                FWDebug.log('Inventory', 'Loaded array format', loadedCount);
            }
        }
        
        // Setze Inventar (auch wenn leer)
        inventoryItems.value = items;
        const loadedCount = items.filter(item => item !== null).length;
        FWDebug.log('Inventory', 'Total loaded', loadedCount, '/', maxSlots);
        
        equipmentSlots.value = {
            vest: null,
            weapon: null,
            bag1: null,
            bag2: null
        };


        // Load equipment data if provided
        if (props.data?.equipment) {
            console.log('[InventoryModule] Loading equipment data:', props.data.equipment);
            
            // Load each equipment slot
            ['vest', 'weapon', 'bag1', 'bag2'].forEach(slotName => {
                if (props.data.equipment[slotName]) {
                    const equipItem = props.data.equipment[slotName];
                    equipmentSlots.value[slotName] = {
                        itemName: equipItem.name || slotName,
                        name: equipItem.label || equipItem.name || 'Unbekannt',
                        emoji: equipItem.emoji || '📦',
                        quantity: equipItem.amount || 1,
                        type: equipItem.type || 'item',
                        equipSlot: equipItem.equipSlot || slotName,
                        hasStorage: equipItem.hasStorage || false,
                        equipmentId: equipItem.equipmentId || null,
                        itemweight: equipItem.itemweight || 0,
                        canUse: equipItem.canUse || false,
                        stackable: false,
                        metadata: equipItem.metadata || {}
                    };
                    console.log(`[InventoryModule] ✅ Loaded equipment in ${slotName}:`, equipmentSlots.value[slotName].name);
                }
            });
        } else {
            console.log('[InventoryModule] ⚠️ No equipment data provided in props.data');
        }
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
    
    const getItemKey = (item) => {
        return item?.itemName || item?.name || null;
    };

    const normalizeMetadata = (metadata) => {
        if (!metadata || typeof metadata !== 'object') return {};
        return metadata;
    };

    const metadataEquals = (a, b) => {
        return JSON.stringify(normalizeMetadata(a)) === JSON.stringify(normalizeMetadata(b));
    };

    // Stack-Regel:
    // - stackable === false blockiert
    // - Equipment / Storage / Items mit eindeutiger Metadata werden blockiert
    // - gleiche Items mit gleicher Metadata dürfen gestackt werden
    const isStackableItem = (item) => {
        if (!isItemDefined(item)) return false;

        if (item.stackable === false) return false;

        // Equipment / einzigartige Items nicht automatisch stacken
        if (item.equipmentId) return false;
        if (item.hasStorage) return false;

        // Waffen / Ausrüstung sicherheitshalber blockieren
        const blockedTypes = [
            'weapon',
            'vest',
            'armor',
            'backpack',
            'large_bag',
            'hip_bag',
            'small_bag',
            'bag'
        ];

        if (blockedTypes.includes(item.type)) return false;

        // Items mit eindeutigen Metadaten nicht automatisch stacken
        const metadata = normalizeMetadata(item.metadata);
        if (
            metadata.serial ||
            metadata.plate ||
            metadata.durability ||
            metadata.ammo ||
            metadata.owner ||
            metadata.equipmentId
        ) {
            return false;
        }

        return true;
    };

    const buildInventoryPayload = (items) => {
        return items
            .map((item, index) => {
                if (!item) return null;

                return {
                    slot: index,
                    name: item.itemName || item.name,
                    label: item.name,
                    emoji: item.emoji,
                    quantity: item.quantity || 1,
                    itemweight: item.itemweight || 0,
                    type: item.type || 'item',
                    canUse: item.canUse || false,
                    metadata: item.metadata || {},
                    hasStorage: item.hasStorage || false,
                    equipmentId: item.equipmentId || null,
                    equipSlot: item.equipSlot || null,
                    stackable: isStackableItem(item)
                };
            })
            .filter(item => item !== null);
    };

    const syncMainInventoryOrder = () => {
        NUIBridge.send('updateInventoryOrder', {
            inventory: buildInventoryPayload(inventoryItems.value)
        });
    };

    const syncDualInventoryOrder = () => {
        if (!dualInventoryOpen.value) {
            syncMainInventoryOrder();
            return;
        }

        const mainInventoryArray = buildInventoryPayload(inventoryItems.value);
        const secondInventoryArray = buildInventoryPayload(secondInventoryItems.value);

        if (dualInventoryMode.value === 'trunk') {
            NUIBridge.send('saveTrunk', {
                plate: dualInventoryMetadata.value.plate,
                inventory: secondInventoryArray,
                mainInventory: mainInventoryArray
            });
        } else if (dualInventoryMode.value === 'glovebox') {
            NUIBridge.send('saveGlovebox', {
                plate: dualInventoryMetadata.value.plate,
                inventory: secondInventoryArray,
                mainInventory: mainInventoryArray
            });
        } else if (dualInventoryMode.value === 'stash') {
            NUIBridge.send('saveStash', {
                stashId: dualInventoryMetadata.value.stashId,
                inventory: secondInventoryArray,
                mainInventory: mainInventoryArray
            });
        } else if (dualInventoryMode.value === 'ground') {
            NUIBridge.send('saveGround', {
                inventory: secondInventoryArray,
                mainInventory: mainInventoryArray
            });
        } else {
            syncMainInventoryOrder();
        }
    };

    const stackAllSameItemsIntoSlot = (rawIndex) => {
        const isSecondInventory = typeof rawIndex === 'string' && rawIndex.startsWith('second-');
        const targetIndex = isSecondInventory
            ? parseInt(rawIndex.replace('second-', ''))
            : rawIndex;

        const targetArray = isSecondInventory
            ? secondInventoryItems.value
            : inventoryItems.value;

        const targetItem = targetArray[targetIndex];

        if (!isItemDefined(targetItem)) return false;
        if (!isStackableItem(targetItem)) {
            console.log('[Inventar] Shift-Stack blockiert: Item ist nicht stackbar:', targetItem.name);
            return false;
        }

        const targetKey = getItemKey(targetItem);
        if (!targetKey) return false;

        let addedQuantity = 0;
        const newItems = [...targetArray];

        for (let i = 0; i < newItems.length; i++) {
            if (i === targetIndex) continue;

            const item = newItems[i];
            if (!isItemDefined(item)) continue;
            if (!isStackableItem(item)) continue;

            const itemKey = getItemKey(item);

            if (
                itemKey === targetKey &&
                metadataEquals(item.metadata, targetItem.metadata)
            ) {
                addedQuantity += item.quantity || 1;
                newItems[i] = null;
            }
        }

        if (addedQuantity <= 0) {
            console.log('[Inventar] Shift-Stack: Keine weiteren gleichen Items gefunden:', targetItem.name);
            return false;
        }

        newItems[targetIndex] = {
            ...targetItem,
            quantity: (targetItem.quantity || 1) + addedQuantity
        };

        if (isSecondInventory) {
            secondInventoryItems.value = newItems;
            syncDualInventoryOrder();
        } else {
            inventoryItems.value = newItems;
            syncMainInventoryOrder();
        }

        console.log(
            '[Inventar] Shift-Stack:',
            addedQuantity,
            'x',
            targetItem.name,
            'in Slot',
            rawIndex,
            'gezogen. Neue Menge:',
            newItems[targetIndex].quantity
        );

        return true;
    };

    const shiftMoveStackToOppositeInventory = (rawIndex) => {
        if (!dualInventoryOpen.value) {
            return false;
        }

        const isFromSecond = typeof rawIndex === 'string' && rawIndex.startsWith('second-');
        const fromIndex = isFromSecond
            ? parseInt(rawIndex.replace('second-', ''))
            : rawIndex;

        const fromArray = isFromSecond
            ? secondInventoryItems.value
            : inventoryItems.value;

        const toArray = isFromSecond
            ? inventoryItems.value
            : secondInventoryItems.value;

        const sourceItem = fromArray[fromIndex];

        if (!isItemDefined(sourceItem)) {
            console.log('[Inventar] Shift-Move blockiert: Kein Item im Quellslot:', rawIndex);
            return false;
        }

        const targetIndex = toArray.findIndex(slot => !isItemDefined(slot));

        if (targetIndex === -1) {
            console.log(
                '[Inventar] Shift-Move blockiert: Kein freier Slot im Zielinventar für:',
                sourceItem.name
            );
            return false;
        }

        // Kopien erzeugen, damit Vue sauber reagiert
        const newFromArray = [...fromArray];
        const newToArray = [...toArray];

        newToArray[targetIndex] = {
            ...sourceItem,
            id: targetIndex
        };

        newFromArray[fromIndex] = null;

        if (isFromSecond) {
            secondInventoryItems.value = newFromArray;
            inventoryItems.value = newToArray;
        } else {
            inventoryItems.value = newFromArray;
            secondInventoryItems.value = newToArray;

            // Optionales Tracking für bestehende Logik
            movedFromMainInventory.add(fromIndex);
        }

        syncDualInventoryOrder();

        console.log(
            '[Inventar] Shift-Move:',
            sourceItem.name,
            'x',
            sourceItem.quantity || 1,
            isFromSecond ? 'vom Second Inventory ins Spielerinventar' : 'vom Spielerinventar ins Second Inventory',
            '→ Zielslot:',
            isFromSecond ? targetIndex : `second-${targetIndex}`
        );

        return true;
    };

    // Equipment Validation: Prüft ob Item in Equipment-Slot gedroppt werden darf
    const canEquipToSlot = (item, targetSlot) => {
        FWDebug.log('Equipment', 'Validate', item?.name, item?.type, item?.equipSlot, '→', targetSlot);

        if (!item) {
            return { allowed: false, message: 'Ungültiges Item' };
        }

        const slotConfig = equipmentConfig.value[targetSlot];
        if (!slotConfig) {
            FWDebug.log('Equipment', 'Invalid slot', targetSlot);
            return { allowed: false, message: 'Ungültiger Slot' };
        }

        const itemType = item.type || 'item';
        const itemEquipSlot = item.equipSlot || null;

        // Direkter Slot-Match
        if (itemEquipSlot && itemEquipSlot === targetSlot) {
            return { allowed: true, message: null };
        }

        // Typ-Match über allowedTypes
        const isAllowedByType = Array.isArray(slotConfig.allowedTypes)
            && slotConfig.allowedTypes.includes(itemType);

        FWDebug.log(
            'Equipment',
            isAllowedByType ? 'OK' : 'REJECT',
            item.name,
            itemType,
            itemEquipSlot,
            'in',
            targetSlot
        );

        return {
            allowed: isAllowedByType,
            message: isAllowedByType ? null : (slotConfig.rejectMessage || 'Ungültiges Item für diesen Slot')
        };
    };

    // Actions
    const moveItem = (fromIndex, toIndex) => {
        const itemA = inventoryItems.value[fromIndex];
        const itemB = inventoryItems.value[toIndex];

        // Validate source item exists
        if (!isItemDefined(itemA)) {
            FWDebug.log('Inventory', 'No item in slot', fromIndex);
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
            
            FWDebug.log('Inventory', 'Dummy swap', fromIndex, '→', toIndex);
            return;
        }
        
        FWDebug.log('Inventory', 'moveItem', itemA.itemName || itemA.name, fromIndex, '→', toIndex);
        
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
    };

    const handleSlotClick = (index) => {
        FWDebug.log('Inventory', 'Slot click', index);
    };

    const handleKeyClick = (key) => {
        FWDebug.log('Inventory', 'Key click', key.name);
        send('useKey', { keyId: key.id });
    };

    const handleLicenseClick = (license) => {
        FWDebug.log('Inventory', 'License click', license.id);
    };

    const handleUse = () => {
        FWDebug.log('Inventory', 'Use item');
        send('useItem');
    };

    const handlePickup = () => {
        FWDebug.log('Inventory', 'Pickup ground');
        send('pickupFromGround');
    };

    const handleGive = () => {
        FWDebug.log('Inventory', 'Give mode');
        openDualInventory('give', '🤝 Geben-Modus');
    };

    const openTrunk = () => {
        FWDebug.log('Inventory', 'Open trunk');
        openDualInventory('trunk', '🚗 Kofferraum');
    };

    const openGlovebox = () => {
        FWDebug.log('Inventory', 'Open glovebox');
        openDualInventory('glovebox', '🧤 Handschuhfach');
    };

    const openStorage = () => {
        FWDebug.log('Inventory', 'Open storage');
        openDualInventory('storage', '🏢 Lager');
    };

    const openBag = () => {
        FWDebug.log('Inventory', 'Open bag');
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
            
            FWDebug.log('Inventory', 'Load cached', mode, secondInventoryItems.value.length);
            
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
                        inventoryItems.value[mainSlotIndex] = null;
                        movedFromMainInventory.add(mainSlotIndex); // Tracking für Rückgabe beim Abbruch
                    }
                }
            });
        } else {
            // Immer 50 Slots für symmetrisches Layout (gleiche Größe wie Hauptinventar)
            const slots = 50;
            secondInventoryItems.value = Array(slots).fill(null);
        }
        
        dualInventoryOpen.value = true;
        FWDebug.log('Inventory', 'Dual open', mode);
    };

    const saveDualInventory = () => {
        FWDebug.log('Inventory', 'Save dual cache', dualInventoryMode.value);
        
        // Speichere im Cache - aber nur eine Deep Copy um Referenzen zu brechen
        secondInventoryCache[dualInventoryMode.value] = secondInventoryItems.value
            .map(item => item && item.name ? { ...item } : null);
        
        // Sende auch an Server falls nötig
        send('saveDualInventory', { 
            mode: dualInventoryMode.value, 
            items: secondInventoryItems.value 
        });
    };

    const clearDualInventory = () => {
        FWDebug.log('Inventory', 'Clear dual - return items');
        
        // Finde alle Items im Dual-Inventar
        const itemsToReturn = [];
        secondInventoryItems.value.forEach((item, index) => {
            if (item && item.name) {
                itemsToReturn.push({ ...item, fromSlot: index });
            }
        });
        
        FWDebug.log('Inventory', 'Items to return', itemsToReturn.length);
        
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
            } else {
                FWDebug.log('Inventory', 'No space for item', item.name);
            }
        });
        
        // Leere das Dual-Inventar
        const emptySlots = secondInventoryItems.value.length;
        secondInventoryItems.value = Array(emptySlots).fill(null);
        
        // Speichere beide Inventare sofort
        FWDebug.log('Inventory', 'Auto-save after items removed');
        
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
        } else if (dualInventoryMode.value === 'ground') {
            NUIBridge.send('saveGround', {
                inventory: secondInvArray,
                mainInventory: mainInvArray
            });
        }
        
        FWDebug.log('Inventory', 'All items returned and saved');
    };

    const confirmDualInventory = () => {
        FWDebug.log('Inventory', 'Confirming dual inventory', dualInventoryMode.value);
        
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
            FWDebug.log('Inventory', 'No items to transfer');
            closeDualInventory();
            return;
        }
        
        FWDebug.log('Inventory', 'Items to transfer', itemsToTransfer.length);
        
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
            
            FWDebug.log('Inventory', 'Trunk saved for plate', metadata.plate);
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
            
            FWDebug.log('Inventory', 'Glovebox saved for plate', metadata.plate);
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
            
            FWDebug.log('Inventory', 'Stash saved for ID', metadata.stashId);
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
            
            FWDebug.log('Inventory', 'Equipment storage saved', metadata.equipmentId);
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
        else if (mode === 'ground') {
            // Build ARRAY format for ground items
            const groundInventory = secondInventoryItems.value.map((item, index) => {
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
            }).filter(item => item !== null);
            
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
            }).filter(item => item !== null);
            
            send('saveGround', {
                inventory: groundInventory,
                mainInventory: mainInventory
            });
            console.log('[Inventar] 💾 Auto-Save: Boden -', groundInventory.length, 'Items');
        }
        
        // Schließe Modal
        secondInventoryItems.value = [];
        movedFromMainInventory.clear();
        dualInventoryOpen.value = false;
        dualInventoryMode.value = '';
        
        console.log('[Inventar] ✅ Dual-Inventar geschlossen & gespeichert');
    };

    const handleClose = () => {
        FWDebug.log('Inventory', 'Close via button');
        send('closeInventory');
    };

    const toggleSettings = () => {
        if (!settingsOpen.value) {
            // Beim Öffnen: Speichere aktuelles Design als Original
            originalLayoutKey.value = layoutKey.value;
            tempLayoutKey.value = layoutKey.value;
            FWDebug.log('Inventory', 'Settings opened', layoutKey.value);
        } else {
            // Beim Schließen ohne Speichern: Stelle Original wieder her
            layoutKey.value = originalLayoutKey.value;
            tempLayoutKey.value = originalLayoutKey.value;
            FWDebug.log('Inventory', 'Settings closed, restored', originalLayoutKey.value);
        }
        settingsOpen.value = !settingsOpen.value;
    };

    const selectDesign = (designKey) => {
        FWDebug.log('Inventory', 'Design selected (preview)', designKey);
        tempLayoutKey.value = designKey;
        // Live Preview: Zeige Design sofort an
        layoutKey.value = designKey;
    };

    const saveSettings = () => {
        FWDebug.log('Inventory', 'Saving settings', tempLayoutKey.value);
        
        // Design ist bereits angezeigt (live preview), jetzt permanent speichern
        originalLayoutKey.value = tempLayoutKey.value; // Update original so close doesn't restore
        settingsStore.setSetting('inventory_design', tempLayoutKey.value);
        
        // Close modal directly (not via toggleSettings to prevent restore)
        settingsOpen.value = false;
        
        FWDebug.log('Inventory', 'Settings saved and applied');
    };

    const openClothing = () => {
        FWDebug.log('Inventory', 'Opening clothing');
        send('openClothing');
    };

    const openGround = () => {
        FWDebug.log('Inventory', 'Opening ground');
        // Sende Request an Lua Client -> Server -> handleOpenDualInventory
        send('requestGroundInventory');
    };

    const toggleGiveMode = () => {
        FWDebug.log('Inventory', 'Toggle give mode');
        openDualInventory('give', '🤝 Geben');
    };
    
    const toggleEquipmentModal = () => {
        equipmentModalOpen.value = !equipmentModalOpen.value;
        FWDebug.log('Inventory', 'Equipment modal', equipmentModalOpen.value ? 'open' : 'closed');
    };
    
    // Context Menu Functions (Right-Click)
    const openContextMenu = (event, item, slotIndex) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (!item || !isItemDefined(item)) {
            return; // No context menu for empty slots
        }
        
        console.log('[Context Menu] Mouse Position:', event.clientX, event.clientY);
        console.log('[Context Menu] Item:', item.name, 'canUse:', item.canUse);
        
        contextMenuItem.value = { ...item }; // Copy item data
        contextMenuSlotIndex.value = slotIndex;
        
        // Position direkt an der Maus mit kleinem Offset (wie beim Ghost)
        const offsetX = 10; // Kleiner Offset nach rechts
        const offsetY = 10; // Kleiner Offset nach unten
        
        contextMenuPosition.value = {
            x: event.clientX + offsetX,
            y: event.clientY + offsetY
        };
        contextMenuOpen.value = true;
        
        console.log('[Context Menu] Final Position:', contextMenuPosition.value);
    };
    
    const closeContextMenu = () => {
        contextMenuOpen.value = false;
        contextMenuItem.value = null;
        contextMenuSlotIndex.value = null;
    };
    
    const useItemFromContext = () => {
        if (contextMenuItem.value) {
            send('useItem', {
                itemName: contextMenuItem.value.name,
                slot: contextMenuSlotIndex.value
            });
        }
        closeContextMenu();
    };
    
    const showItemInfo = () => {
        if (contextMenuItem.value) {
            // TODO: Implement info modal
            console.log('[Context Menu] Info feature - Coming soon!');
        }
        closeContextMenu();
    };

    // Mouse-Based Drag & Drop System
    const isDragging = ref(false);
    const dragGhostElement = ref(null);
    const dragStartPos = ref({ x: 0, y: 0 });
    const currentMousePos = ref({ x: 0, y: 0 });
    
    // Auto-Scroll State (Edge Scrolling)
    const autoScrollActive = ref(false);
    const autoScrollAnimationFrame = ref(null);
    const autoScrollSpeed = ref(0); // Positive = down, Negative = up
    const autoScrollTimer = ref(null); // Intent-Delay Timer (200ms)
    const autoScrollPendingContainer = ref(null); // Container waiting for delay
    const autoScrollPendingSpeed = ref(0); // Speed waiting for delay

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

    // Auto-Scroll Logic (Edge Scrolling) - HYBRID: Target-Awareness + Intent-Delay
    const checkAutoScroll = (clientX, clientY) => {
        if (!isDragging.value) {
            stopAutoScroll();
            return;
        }

        // ===============================================
        // STEP 1: Target-Awareness Check (Equipment-Sperre)
        // ===============================================
        // Prüfe ob der Cursor über einem geschützten Bereich schwebt
        const elementUnderCursor = document.elementFromPoint(clientX, clientY);
        
        if (elementUnderCursor) {
            // Suche nach Equipment-Slot oder geschütztem Container in Parent-Hierarchie
            let currentElement = elementUnderCursor;
            let isOverProtectedArea = false;
            
            // Traversiere bis zu 5 Ebenen nach oben
            for (let i = 0; i < 5 && currentElement; i++) {
                // Prüfe auf data-equipment-slot Attribut (Equipment Slots)
                if (currentElement.hasAttribute && currentElement.hasAttribute('data-equipment-slot')) {
                    isOverProtectedArea = true;
                    break;
                }
                
                // Prüfe auf spezifische Container-Klassen (z.B. Equipment-Container)
                if (currentElement.classList) {
                    if (currentElement.classList.contains('equipment-container') ||
                        currentElement.classList.contains('equipment-modal') ||
                        currentElement.classList.contains('equipment-slots')) {
                        isOverProtectedArea = true;
                        console.log('[Auto-Scroll] 🛡️ Equipment-Container erkannt - Auto-Scroll blockiert');
                        break;
                    }
                }
                
                currentElement = currentElement.parentElement;
            }
            
            // Wenn über geschütztem Bereich: SOFORT abbrechen
            if (isOverProtectedArea) {
                stopAutoScroll();
                return;
            }
        }

        // ===============================================
        // STEP 2: Find Scroll Target (wie zuvor)
        // ===============================================
        const allInventoryContainers = document.querySelectorAll('.overflow-y-auto, .custom-scrollbar-forest');
        let targetContainer = null;
        let scrollSpeed = 0;

        // Check each container if cursor is within EXTENDED zone (container + 80px outside)
        for (const container of allInventoryContainers) {
            if (container.scrollHeight <= container.clientHeight) continue; // Not scrollable
            
            const rect = container.getBoundingClientRect();
            const extendedZone = 80; // Pixels outside container bounds
            
            // Check if cursor is within extended bounds (horizontally AND vertically)
            const inHorizontalBounds = clientX >= rect.left - extendedZone && 
                                      clientX <= rect.right + extendedZone;
            const inVerticalBounds = clientY >= rect.top - extendedZone && 
                                    clientY <= rect.bottom + extendedZone;
            
            if (!inHorizontalBounds || !inVerticalBounds) continue;
            
            // Calculate relative position (can be negative or > height)
            const relativeY = clientY - rect.top;
            const containerHeight = rect.height;
            
            // Edge zones (15% of container height for smoother activation)
            const edgeZoneSize = containerHeight * 0.15;
            const topEdge = edgeZoneSize;
            const bottomEdge = containerHeight - edgeZoneSize;

            let speed = 0;

            if (relativeY < topEdge) {
                // Near top or ABOVE container - scroll up
                const distance = topEdge - relativeY; // Can be > edgeZoneSize if outside
                const intensity = Math.min(1, distance / edgeZoneSize); // Clamp to 1
                speed = -Math.max(2, intensity * 18); // Higher max speed
            } else if (relativeY > bottomEdge) {
                // Near bottom or BELOW container - scroll down
                const distance = relativeY - bottomEdge; // Can be > edgeZoneSize if outside
                const intensity = Math.min(1, distance / edgeZoneSize); // Clamp to 1
                speed = Math.max(2, intensity * 18); // Higher max speed
            }

            // Use container with highest scroll speed (closest to edge)
            if (Math.abs(speed) > Math.abs(scrollSpeed)) {
                scrollSpeed = speed;
                targetContainer = container;
            }
        }

        // ===============================================
        // STEP 3: Intent-Delay (200ms Verzögerung)
        // ===============================================
        if (targetContainer && scrollSpeed !== 0) {
            // Prüfe ob bereits ein Timer läuft
            if (autoScrollTimer.value) {
                // Timer läuft bereits - prüfe ob gleicher Container/Speed
                if (autoScrollPendingContainer.value === targetContainer && 
                    Math.abs(autoScrollPendingSpeed.value - scrollSpeed) < 2) {
                    // Gleicher Container und ähnliche Speed - warte weiter
                    return;
                } else {
                    // Anderer Container oder deutlich andere Speed - reset Timer
                    clearTimeout(autoScrollTimer.value);
                    autoScrollTimer.value = null;
                    console.log('[Auto-Scroll] 🔄 Timer reset - andere Scroll-Zone erkannt');
                }
            }
            
            // Starte neuen Intent-Delay Timer (200ms)
            autoScrollPendingContainer.value = targetContainer;
            autoScrollPendingSpeed.value = scrollSpeed;
            
            autoScrollTimer.value = setTimeout(() => {
                // Nach 200ms: Starte Auto-Scroll (wenn immer noch über Zone)
                if (isDragging.value && autoScrollPendingContainer.value) {
                    console.log('[Auto-Scroll] ✅ Intent-Delay abgelaufen - starte Scrollen');
                    startAutoScroll(autoScrollPendingContainer.value, autoScrollPendingSpeed.value);
                }
                autoScrollTimer.value = null;
                autoScrollPendingContainer.value = null;
                autoScrollPendingSpeed.value = 0;
            }, 200); // 200ms Verzögerung
            
            console.log('[Auto-Scroll] ⏳ Intent-Delay gestartet (200ms)...');
        } else {
            // Keine Scroll-Zone mehr - stoppe alles
            stopAutoScroll();
        }
    };

    const startAutoScroll = (container, speed) => {
        autoScrollSpeed.value = speed;
        
        if (autoScrollActive.value) return; // Already running
        
        autoScrollActive.value = true;
        
        const scroll = () => {
            if (!autoScrollActive.value || !isDragging.value) {
                stopAutoScroll();
                return;
            }
            
            // Apply smooth scroll
            container.scrollTop += autoScrollSpeed.value;
            
            // Continue animation
            autoScrollAnimationFrame.value = requestAnimationFrame(scroll);
        };
        
        scroll();
    };

    const stopAutoScroll = () => {
        autoScrollActive.value = false;
        autoScrollSpeed.value = 0;
        
        // Clear animation frame
        if (autoScrollAnimationFrame.value) {
            cancelAnimationFrame(autoScrollAnimationFrame.value);
            autoScrollAnimationFrame.value = null;
        }
        
        // Clear intent-delay timer (verhindert verzögertes Scrollen nach Drop)
        if (autoScrollTimer.value) {
            clearTimeout(autoScrollTimer.value);
            autoScrollTimer.value = null;
            console.log('[Auto-Scroll] 🛑 Timer cleared - kein verzögertes Scrollen');
        }
        
        // Reset pending state
        autoScrollPendingContainer.value = null;
        autoScrollPendingSpeed.value = 0;
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

        // Shift + Linksklick:
        // Alle gleichen stackbaren Items in den angeklickten Slot ziehen.
        // Wichtig: Danach kein Drag starten.
        if (e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();

            const stacked = stackAllSameItemsIntoSlot(index);

            if (stacked) {
                // Context-Menü sicher schließen, falls offen
                closeContextMenu?.();
            }

            return;
        }

        if (e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            if (!dualInventoryOpen.value) {
                return;
            }

            const moved = shiftMoveStackToOppositeInventory(index);

            if (moved) {
                closeContextMenu?.();
            }

            return;
        }


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

        // Check for auto-scroll zones
        checkAutoScroll(e.clientX, e.clientY);

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
        
        // Stop auto-scrolling
        stopAutoScroll();

        // WHEEL STACKING MODE: Process distributed items + final drop
        if (dragStackedSlots.value.size > 0 || dragCurrentQuantity.value < dragOriginalQuantity.value) {
            console.log('[Inventar] 🎯 Processing wheel-stacked items + final drop...');
            console.log('[Inventar] Original qty:', dragOriginalQuantity.value, '| Current qty:', dragCurrentQuantity.value, '| Stacked slots:', dragStackedSlots.value.size);
            
            // Get source info
            const isFromEquipment = typeof fromIndex === 'string' && fromIndex.startsWith('equipment_');
            const isFromSecond = typeof fromIndex === 'string' && fromIndex.startsWith('second-');
            const fromActualIndex = isFromSecond ? parseInt(fromIndex.replace('second-', '')) : (isFromEquipment ? null : fromIndex);
            
            let sourceItem = null;
            if (isFromEquipment) {
                const fromEquipmentType = fromIndex.replace('equipment_', '');
                sourceItem = equipmentSlots.value[fromEquipmentType];
            } else if (isFromSecond) {
                sourceItem = secondInventoryItems.value[fromActualIndex];
            } else {
                sourceItem = inventoryItems.value[fromIndex];
            }
            
            if (!sourceItem) {
                console.error('[Inventar] ❌ Source item not found!');
                removeDragGhost();
                isDragging.value = false;
                draggedItemIndex.value = null;
                dragStackedSlots.value.clear();
                return;
            }
            
            // Step 1: Apply wheel-stacked items to their slots
            dragStackedSlots.value.forEach((quantity, slotIndexStr) => {
                const isTargetSecond = slotIndexStr.startsWith('second-');
                const targetIndex = isTargetSecond ? parseInt(slotIndexStr.replace('second-', '')) : parseInt(slotIndexStr);
                const targetArray = isTargetSecond ? secondInventoryItems.value : inventoryItems.value;
                
                if (targetArray[targetIndex] && targetArray[targetIndex].name === sourceItem.name) {
                    targetArray[targetIndex].quantity = (targetArray[targetIndex].quantity || 1) + quantity;
                    console.log('[Inventar] ✅ Stacked', quantity, 'x', sourceItem.name, 'into slot', slotIndexStr);
                } else if (!targetArray[targetIndex]) {
                    targetArray[targetIndex] = {
                        ...sourceItem,
                        quantity: quantity
                    };
                    console.log('[Inventar] ✅ Placed', quantity, 'x', sourceItem.name, 'into slot', slotIndexStr);
                }
            });
            
            // Step 2: Check for final drop target (if remaining quantity > 0)
            if (targetSlot && dragCurrentQuantity.value > 0) {
                const targetSlotIndex = targetSlot.getAttribute('data-slot-index');
                
                if (targetSlotIndex) {
                    // Check if NOT already stacked via wheel
                    const alreadyStacked = dragStackedSlots.value.has(targetSlotIndex);
                    
                    if (!alreadyStacked) {
                        const isTargetSecond = targetSlotIndex.startsWith('second-');
                        const targetIndex = isTargetSecond ? parseInt(targetSlotIndex.replace('second-', '')) : parseInt(targetSlotIndex);
                        const targetArray = isTargetSecond ? secondInventoryItems.value : inventoryItems.value;
                        
                        if (targetArray[targetIndex] && targetArray[targetIndex].name === sourceItem.name) {
                            targetArray[targetIndex].quantity = (targetArray[targetIndex].quantity || 1) + dragCurrentQuantity.value;
                            console.log('[Inventar] 🎯 Final drop: Stacked REST', dragCurrentQuantity.value, 'x', sourceItem.name);
                            dragCurrentQuantity.value = 0;
                        } else if (!targetArray[targetIndex]) {
                            targetArray[targetIndex] = {
                                ...sourceItem,
                                quantity: dragCurrentQuantity.value
                            };
                            console.log('[Inventar] 🎯 Final drop: Placed REST', dragCurrentQuantity.value, 'x', sourceItem.name);
                            dragCurrentQuantity.value = 0;
                        } else {
                            console.log('[Inventar] ⚠️ Target slot occupied - keeping', dragCurrentQuantity.value, 'in source');
                        }
                    } else {
                        console.log('[Inventar] ℹ️ Target was already wheel-stacked - keeping', dragCurrentQuantity.value, 'in source');
                    }
                }
            }
            
            // Step 3: Update or remove source item
            if (dragCurrentQuantity.value === 0) {
                // ALL items distributed
                if (isFromEquipment) {
                    const fromEquipmentType = fromIndex.replace('equipment_', '');
                    equipmentSlots.value[fromEquipmentType] = null;
                } else if (isFromSecond) {
                    secondInventoryItems.value[fromActualIndex] = null;
                } else {
                    inventoryItems.value[fromIndex] = null;
                }
                console.log('[Inventar] ✅ Source fully distributed - removed');
            } else {
                // Update remaining quantity in source
                sourceItem.quantity = dragCurrentQuantity.value;
                console.log('[Inventar] ℹ️ Source updated to', dragCurrentQuantity.value);
            }
            
            // Step 4: Sync to server (SINGLE sync after all changes)
            console.log('[Inventar] 🔄 Syncing to server...');
            
            NUIBridge.send('updateInventoryOrder', {
                inventory: inventoryItems.value.map((item, index) => item ? { ...item, slot: index } : null).filter(item => item !== null)
            });
            
            // Check if dual inventory was modified
            const hasSecondInventoryChanges = Array.from(dragStackedSlots.value.keys()).some(key => key.startsWith('second-')) ||
                                             (targetSlot && targetSlot.getAttribute('data-slot-index')?.startsWith('second-'));
            
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
                } else if (dualInventoryMode.value === 'ground') {
                    NUIBridge.send('saveGround', {
                        inventory: secondInvArray,
                        mainInventory: mainInvArray
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
                    
                    // Send to server
                    window.NUIBridge.send('moveItem', {
                        fromSlot: fromEquipmentType,
                        toSlot: equipmentSlotType
                    });
                } else if (isFromSecond) {
                    // Moving from second inventory to equipment
                    const item = secondInventoryItems.value[fromActualIndex];
                    if (item) {
                        const oldEquipment = equipmentSlots.value[equipmentSlotType];
                        equipmentSlots.value[equipmentSlotType] = item;
                        secondInventoryItems.value[fromActualIndex] = oldEquipment;
                        
                        console.log('[Inventar] ✅ Item equipped from second inventory:', item.name, 'in slot', equipmentSlotType);
                        
                        // Send to server (second inventory uses special format)
                        window.NUIBridge.send('moveItem', {
                            fromSlot: 'second-' + fromActualIndex,
                            toSlot: equipmentSlotType
                        });
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
                        
                        // Send to server
                        window.NUIBridge.send('moveItem', {
                            fromSlot: fromIndex,
                            toSlot: equipmentSlotType
                        });
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
                        
                        // Send to server
                        window.NUIBridge.send('moveItem', {
                            fromSlot: fromEquipmentType,
                            toSlot: isToSecond ? ('second-' + toIndex) : toIndex
                        });
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
                            } else if (dualInventoryMode.value === 'ground') {
                                NUIBridge.send('saveGround', {
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
                        } else if (dualInventoryMode.value === 'ground') {
                            NUIBridge.send('saveGround', {
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
        dragStackedSlots.value.clear();
        dragCurrentQuantity.value = 0;
        dragOriginalQuantity.value = 0;
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
                        quantity: itemData.amount || 1,
                        type: itemData.type || 'item',
                        itemweight: itemData.itemweight || 0,
                        canUse: itemData.canUse || false,
                        metadata: itemData.metadata || {},
                        stackable: itemData.stackable !== false
                    };
                    loadedCount++;
                }
            }
            
            inventoryItems.value = items;
            console.log('[Inventar] ✅ Inventar vom Server aktualisiert:', loadedCount, 'Items');
        }
        
        // Update equipment data if provided
        if (data && data.equipment) {
            console.log('[Inventar] 🔄 Server sent equipment update:', data.equipment);
            
            ['vest', 'weapon', 'bag1', 'bag2'].forEach(slotName => {
                if (data.equipment[slotName]) {
                    const equipItem = data.equipment[slotName];
                    equipmentSlots.value[slotName] = {
                        itemName: equipItem.name || slotName,
                        name: equipItem.label || equipItem.name || 'Unbekannt',
                        emoji: equipItem.emoji || '📦',
                        quantity: equipItem.amount || 1,
                        type: equipItem.type || 'item',
                        equipSlot: slotName,
                        hasStorage: equipItem.hasStorage || false,
                        equipmentId: equipItem.equipmentId || null,
                        itemweight: equipItem.itemweight || 0,
                        canUse: equipItem.canUse || false,
                        stackable: equipItem.stackable || false
                    };
                    console.log(`[Inventar] ✅ Equipment updated in ${slotName}:`, equipmentSlots.value[slotName].name);
                } else {
                    // Clear slot if equipment data is null
                    equipmentSlots.value[slotName] = null;
                }
            });
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
                    canUse: itemData.canUse || false,
                    stackable: itemData.stackable !== false
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
    
    onMounted(async () => {
        FWDebug.log('Inventory', 'Component mounted');
        
        // Start mit opacity 0 während Design lädt
        isDesignLoading.value = true;
        
        // KRITISCH: Wenn Store leer ist, fordere Settings vom Client an
        if (!settingsStore.isLoaded) {
            FWDebug.log('Inventory', 'Settings not loaded, requesting');
            await settingsStore.requestSettings();
            // Warte länger bis Store reaktiv aktualisiert ist (200ms statt 50ms)
            await new Promise(resolve => setTimeout(resolve, 200));
        } else {
            // Auch wenn geladen, warte einen Tick für Reaktivität
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // DEFAULT-HANDLING wie in Lua: const Design = userChoice || "forest"
        // Lese direkt aus Store state (nicht computed getter)
        const storeSettings = settingsStore.settings;
        const savedDesign = storeSettings?.inventory_design || storeSettings?.['inventory_design'] || null;
        const finalDesign = savedDesign || 'forest'; // Fallback to default
        
        FWDebug.log('Inventory', 'Design loading', savedDesign, '→', finalDesign);
        layoutKey.value = finalDesign;
        tempLayoutKey.value = finalDesign; // Sync temp for modal
        
        loadInventoryData();
        
        // Warte 100ms damit Design vollständig laden kann (unsichtbar)
        await new Promise(resolve => setTimeout(resolve, 100));
        isDesignLoading.value = false; // Jetzt Fade-In
        FWDebug.log('Inventory', 'Design loaded, fading in');
        
        // KEIN Auto-Save mehr! Nur explizites Speichern via Button
        
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
                    showItemInfo,
                    openClothing,
                    toggleGiveMode,
                    toggleEquipmentModal,
                    toggleSettings,
                    selectDesign,
                    saveSettings,
                    handleClose,
                    confirmDualInventory,
                    saveDualInventory,
                    clearDualInventory,
                    closeDualInventory,
                    // Add missing dual-inventory functions
                    openGlovebox,
                    openTrunk,
                    openGround,
                    openStorage,
                    openBag
                };
            }
        };
    });

    return {
        // State
        layoutKey,
        tempLayoutKey,
        isDesignLoading,
        themeKey,
        animationKey,
        inventoryScale,
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
        openGround,
        openStorage,
        openBag,
        selectDesign,
        saveSettings,
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
    template: `<div :class="['fixed inset-0 flex items-center justify-center p-8', 'theme-' + themeKey]" :style="{ opacity: isDesignLoading ? 0 : 1, transition: 'opacity 0.2s ease-in' }" style="z-index: 10000;">
        <div :class="['layout-' + layoutKey]" :style="{ transform: 'scale(' + inventoryScale + ')', transformOrigin: 'center' }">
        <!-- Main Inventar Content -->
        <div class="w-[62vw] h-[64vh] flex items-center justify-center">
            <!-- Dynamic Design Component - Only renders the active template -->
            <component :is="currentDesignComponent" :key="layoutKey"></component>
        </div>
        </div>
        
        <!-- Settings Menu (Outside scaled container for proper z-index) -->
        <Transition name="settings-fade">
            <div v-if="settingsOpen" class="fixed inset-0 flex items-center justify-center pointer-events-none" style="z-index: 100000;">
                <div class="pointer-events-auto bg-gradient-to-br from-slate-800 to-slate-900 w-[480px] max-h-[80vh] rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] border-2 border-slate-600/30">
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
                                <button v-for="(layout, key) in LAYOUTS" :key="key" @click="selectDesign(key)" :class="['px-3 py-2.5 rounded-lg border text-slate-300 text-xs font-medium text-left transition-all', tempLayoutKey === key ? 'bg-gradient-to-r from-sky-500/30 to-emerald-500/30 border-sky-500/80 text-slate-50 font-bold shadow-[0_0_16px_rgba(56,189,248,0.4)]' : 'bg-slate-800/60 border-slate-600/30 hover:bg-slate-700/80 hover:border-sky-500/50 hover:-translate-y-0.5']">
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
                    
                    <!-- Save Button -->
                    <div class="px-4 pb-4 pt-2">
                        <button @click="saveSettings()" class="w-full py-3 px-4 rounded-xl font-bold text-base uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white shadow-[0_4px_20px_rgba(34,197,94,0.4)] hover:shadow-[0_6px_30px_rgba(34,197,94,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98]">
                            💾 Einstellungen Speichern
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
        
        <!-- Context Menu Modal (Outside scaled container for proper positioning) -->
        <div v-if="contextMenuOpen && contextMenuItem" @click.self="closeContextMenu" class="fixed inset-0 pointer-events-none" style="z-index: 100000;">
            <div class="context-menu pointer-events-auto fixed" :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px', transform: 'none' }">
                    <!-- Forest Theme -->
                    <div v-if="layoutKey === 'forest'" class="bg-gradient-to-br from-emerald-900/95 to-green-950/98 w-[140px] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.9)] border-2 border-emerald-600/50">
                        <div class="bg-gradient-to-r from-emerald-800/80 to-green-900/90 px-2 py-1.5 flex items-center gap-1.5 rounded-t-lg border-b border-emerald-500/30">
                            <span class="text-lg">{{ contextMenuItem.emoji }}</span>
                            <div class="flex-1 min-w-0">
                                <div class="text-emerald-50 font-bold text-[11px] truncate">{{ contextMenuItem.label || contextMenuItem.name }}</div>
                                <div v-if="contextMenuItem.quantity > 1" class="text-emerald-300/80 text-[9px]">× {{ contextMenuItem.quantity }}</div>
                            </div>
                        </div>
                        <div class="p-1.5 space-y-1">
                            <button v-if="contextMenuItem.canUse" @click="useItemFromContext" class="w-full px-2 py-2.5 rounded-md bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-emerald-50 font-semibold text-[11px] transition-all">✅ Benutzen</button>
                            <button @click="showItemInfo" class="w-full px-2 py-2.5 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-100 font-semibold text-[11px] transition-all">📋 Details</button>
                            <button @click="closeContextMenu" class="w-full px-2 py-2.5 rounded-md bg-red-600/70 hover:bg-red-500 text-red-50 font-semibold text-[11px] transition-all">❌ Abbrechen</button>
                        </div>
                    </div>

                    <!-- Tactical Backpack Theme -->
                    <div v-if="layoutKey === 'tacticalBackpack'" class="bg-gradient-to-br from-slate-900/95 to-slate-950/98 w-[140px] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.9)] border-2 border-cyan-600/50">
                        <div class="bg-gradient-to-r from-slate-800/90 to-slate-900/95 px-2 py-1.5 flex items-center gap-1.5 rounded-t-lg border-b border-cyan-500/30">
                            <span class="text-lg">{{ contextMenuItem.emoji }}</span>
                            <div class="flex-1 min-w-0">
                                <div class="text-cyan-50 font-bold text-[11px] truncate">{{ contextMenuItem.label || contextMenuItem.name }}</div>
                                <div v-if="contextMenuItem.quantity > 1" class="text-cyan-300/80 text-[9px]">× {{ contextMenuItem.quantity }}</div>
                            </div>
                        </div>
                        <div class="p-1.5 space-y-1">
                            <button v-if="contextMenuItem.canUse" @click="useItemFromContext" class="w-full px-2 py-2.5 rounded-md bg-gradient-to-r from-cyan-600 to-teal-700 hover:from-cyan-500 hover:to-teal-600 text-cyan-50 font-semibold text-[11px] transition-all">✅ Benutzen</button>
                            <button @click="showItemInfo" class="w-full px-2 py-2.5 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-100 font-semibold text-[11px] transition-all">📋 Details</button>
                            <button @click="closeContextMenu" class="w-full px-2 py-2.5 rounded-md bg-red-600/70 hover:bg-red-500 text-red-50 font-semibold text-[11px] transition-all">❌ Abbrechen</button>
                        </div>
                    </div>

                    <!-- Retro Drawer Theme -->
                    <div v-if="layoutKey === 'retroDrawer'" class="bg-gradient-to-br from-orange-900/95 to-amber-950/98 w-[140px] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.9)] border-2 border-orange-600/50">
                        <div class="bg-gradient-to-r from-orange-800/80 to-amber-900/90 px-2 py-1.5 flex items-center gap-1.5 rounded-t-lg border-b border-orange-500/30">
                            <span class="text-lg">{{ contextMenuItem.emoji }}</span>
                            <div class="flex-1 min-w-0">
                                <div class="text-orange-50 font-bold text-[11px] truncate">{{ contextMenuItem.label || contextMenuItem.name }}</div>
                                <div v-if="contextMenuItem.quantity > 1" class="text-orange-300/80 text-[9px]">× {{ contextMenuItem.quantity }}</div>
                            </div>
                        </div>
                        <div class="p-1.5 space-y-1">
                            <button v-if="contextMenuItem.canUse" @click="useItemFromContext" class="w-full px-2 py-2.5 rounded-md bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-500 hover:to-amber-600 text-orange-50 font-semibold text-[11px] transition-all">✅ Benutzen</button>
                            <button @click="showItemInfo" class="w-full px-2 py-2.5 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-100 font-semibold text-[11px] transition-all">📋 Details</button>
                            <button @click="closeContextMenu" class="w-full px-2 py-2.5 rounded-md bg-red-600/70 hover:bg-red-500 text-red-50 font-semibold text-[11px] transition-all">❌ Abbrechen</button>
                        </div>
                    </div>

                    <!-- Sci-Fi HUD Theme -->
                    <div v-if="layoutKey === 'sciFiHud'" class="bg-gradient-to-br from-cyan-950/95 to-blue-950/98 w-[140px] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.9)] border-2 border-cyan-400/60">
                        <div class="bg-gradient-to-r from-cyan-900/80 to-blue-950/90 px-2 py-1.5 flex items-center gap-1.5 rounded-t-lg border-b border-cyan-400/40">
                            <span class="text-lg">{{ contextMenuItem.emoji }}</span>
                            <div class="flex-1 min-w-0">
                                <div class="text-cyan-50 font-bold text-[11px] truncate">{{ contextMenuItem.label || contextMenuItem.name }}</div>
                                <div v-if="contextMenuItem.quantity > 1" class="text-cyan-300/80 text-[9px]">× {{ contextMenuItem.quantity }}</div>
                            </div>
                        </div>
                        <div class="p-1.5 space-y-1">
                            <button v-if="contextMenuItem.canUse" @click="useItemFromContext" class="w-full px-2 py-2.5 rounded-md bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-cyan-50 font-semibold text-[11px] transition-all">✅ Benutzen</button>
                            <button @click="showItemInfo" class="w-full px-2 py-2.5 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-100 font-semibold text-[11px] transition-all">📋 Details</button>
                            <button @click="closeContextMenu" class="w-full px-2 py-2.5 rounded-md bg-red-600/70 hover:bg-red-500 text-red-50 font-semibold text-[11px] transition-all">❌ Abbrechen</button>
                        </div>
                    </div>

                    <!-- Briefcase Theme -->
                    <div v-if="layoutKey === 'briefcase'" class="bg-gradient-to-br from-amber-900/95 to-yellow-950/98 w-[140px] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.9)] border-2 border-yellow-600/50">
                        <div class="bg-gradient-to-r from-amber-800/80 to-yellow-900/90 px-2 py-1.5 flex items-center gap-1.5 rounded-t-lg border-b border-yellow-500/30">
                            <span class="text-lg">{{ contextMenuItem.emoji }}</span>
                            <div class="flex-1 min-w-0">
                                <div class="text-yellow-50 font-bold text-[11px] truncate">{{ contextMenuItem.label || contextMenuItem.name }}</div>
                                <div v-if="contextMenuItem.quantity > 1" class="text-yellow-300/80 text-[9px]">× {{ contextMenuItem.quantity }}</div>
                            </div>
                        </div>
                        <div class="p-1.5 space-y-1">
                            <button v-if="contextMenuItem.canUse" @click="useItemFromContext" class="w-full px-2 py-2.5 rounded-md bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-yellow-50 font-semibold text-[11px] transition-all">✅ Benutzen</button>
                            <button @click="showItemInfo" class="w-full px-2 py-2.5 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-100 font-semibold text-[11px] transition-all">📋 Details</button>
                            <button @click="closeContextMenu" class="w-full px-2 py-2.5 rounded-md bg-red-600/70 hover:bg-red-500 text-red-50 font-semibold text-[11px] transition-all">❌ Abbrechen</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};

export default InventoryModule;

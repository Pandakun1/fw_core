const { computed, ref, onMounted, onUnmounted } = Vue;
const useNUI = window.useNUI;

const InventoryModule = {
    name: 'InventoryModule',
    props: ['data'],
    
    setup(props) {
        const { send, onClose } = useNUI();
        const dragOverSlot = ref(null);
        const draggedItem = ref(null);
        const dragSourceSlot = ref(null);
        const selectedSlot = ref(null);
        const contextMenu = ref({ visible: false, x: 0, y: 0, item: null });

        // Computed - build slots from inventory data
        const inventory = computed(() => props.data?.inventory?.main || []);
        const maxSlots = computed(() => 20);
        const slots = computed(() => {
            const grid = [];
            for (let i = 0; i < maxSlots.value; i++) {
                const item = inventory.value.find(item => item.slot === i);
                grid.push({ slot: i, item: item || null });
            }
            return grid;
        });

        const handleClose = () => { send('closeInventory'); };
        const handleSlotClick = (slot, item) => { if(item) selectedSlot.value = slot; };
        const handleSlotRightClick = (e, slot, item) => { 
            if(item) { 
                e.preventDefault(); 
                contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, item: {...item, slot} };
            }
        };
        const handleDragStart = (e, slot, item) => { 
            if(item) {
                draggedItem.value = item;
                dragSourceSlot.value = slot;
            }
        };
        const handleDragOver = (e, slot) => { e.preventDefault(); dragOverSlot.value = slot; };
        const handleDrop = (e, targetSlot) => { 
            e.preventDefault(); 
            dragOverSlot.value = null;
            if (dragSourceSlot.value !== null) {
                send('moveItem', { fromSlot: dragSourceSlot.value, toSlot: targetSlot });
                draggedItem.value = null;
                dragSourceSlot.value = null;
            }
        };
        
        const useItem = (item, slot) => { send('useItem', { name: item.name, slot: slot }); };
        const dropItem = (item, slot) => { send('dropItem', { name: item.name, slot: slot, amount: 1 }); };
        const giveItem = (item, slot) => { send('giveItem', { name: item.name, slot: slot, amount: 1 }); };
        
        onClose(handleClose);

        return { slots, contextMenu, dragOverSlot, selectedSlot, handleClose, handleSlotClick, handleSlotRightClick, handleDragStart, handleDragOver, handleDrop, useItem, dropItem, giveItem };
    },
    template: `
    <div class="w-full h-full flex items-center justify-center text-white">
        <div class="relative w-[900px] h-[650px] bg-[#1a1b21] p-6 rounded-xl border border-[#2a2b36] shadow-2xl">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-[#d4b483]">INVENTAR</h1>
                <button @click="handleClose" class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-bold">Schließen (ESC)</button>
            </div>
            <div class="grid grid-cols-5 gap-3">
                <div v-for="slot in slots" :key="slot.slot" 
                     class="aspect-square bg-[#0b0c0f] border border-[#2a2b36] rounded-lg flex items-center justify-center relative hover:bg-[#16171d] transition cursor-pointer"
                     :class="{ 'border-blue-500 border-2': selectedSlot === slot.slot }"
                     @click="handleSlotClick(slot.slot, slot.item)"
                     @contextmenu="handleSlotRightClick($event, slot.slot, slot.item)"
                     draggable="true" @dragstart="handleDragStart($event, slot.slot, slot.item)" @dragover="handleDragOver($event, slot.slot)" @drop="handleDrop($event, slot.slot)"
                >
                     <div v-if="slot.item" class="flex flex-col items-center p-2">
                        <span class="text-3xl">📦</span>
                        <span class="text-xs text-gray-400 mt-1 text-center">{{ slot.item.label || slot.item.name }}</span>
                        <span v-if="slot.item.amount > 1" class="absolute top-1 right-1 text-xs font-bold bg-blue-600 px-1 rounded">{{ slot.item.amount }}</span>
                     </div>
                     <span v-else class="text-gray-600 text-xs">{{ slot.slot + 1 }}</span>
                </div>
            </div>
            
            <!-- Context Menu -->
            <div v-if="contextMenu.visible" :style="{ position: 'fixed', left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" class="bg-[#1a1b21] border border-[#2a2b36] rounded shadow-xl p-2 z-50">
                <button @click="useItem(contextMenu.item, contextMenu.item.slot); contextMenu.visible = false" class="block w-full text-left px-3 py-2 hover:bg-[#2a2b36] rounded text-sm">Benutzen</button>
                <button @click="dropItem(contextMenu.item, contextMenu.item.slot); contextMenu.visible = false" class="block w-full text-left px-3 py-2 hover:bg-[#2a2b36] rounded text-sm">Wegwerfen</button>
                <button @click="giveItem(contextMenu.item, contextMenu.item.slot); contextMenu.visible = false" class="block w-full text-left px-3 py-2 hover:bg-[#2a2b36] rounded text-sm">Geben</button>
            </div>
        </div>
    </div>
    `
};
export default InventoryModule;
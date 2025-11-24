const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const visible   = ref(false);   // nur intern für ESC etc.
        const inventory = ref({});
        const maxWeight = ref(50);
        const maxSlots  = ref(20);

        const contextMenu = ref({ visible: false, x: 0, y: 0, item: null });

        const inventoryList = computed(() => {
            if (!inventory.value) return [];
            return Object.values(inventory.value).filter(i => i && i.amount > 0);
        });

        const weight = computed(() => {
            let total = 0;
            inventoryList.value.forEach(item => {
                total += (item.itemweight || 0) * item.amount;
            });
            return total;
        });

        let rootEl = null;

        // NUI POST
        const post = async (endpoint, data = {}) => {
            try {
                const res = await fetch(`https://${GetParentResourceName()}/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                try {
                    return await res.json();
                } catch {
                    return {};
                }
            } catch (e) {
                console.error('[inventory] post error', e);
                return {};
            }
        };

        const showRoot = () => {
            if (!rootEl) return;
            rootEl.classList.remove('hidden');
        };

        const hideRoot = () => {
            if (!rootEl) return;
            rootEl.classList.add('hidden');
        };

        const closeInventory = () => {
            visible.value = false;
            contextMenu.value.visible = false;
            hideRoot();
            post('close');
        };

        const openContextMenu = (e, item) => {
            contextMenu.value = {
                visible: true,
                x: e.clientX,
                y: e.clientY,
                item
            };
        };

        const closeContext = () => {
            contextMenu.value.visible = false;
        };

        const useItem = () => {
            if (!contextMenu.value.item) return;
            post('useItem', { name: contextMenu.value.item.name });
            contextMenu.value.visible = false;
        };

        const dropItem = () => {
            if (!contextMenu.value.item) return;
            post('dropItem', { name: contextMenu.value.item.name, amount: 1 });
            contextMenu.value.visible = false;
        };

        const giveItem = () => {
            if (!contextMenu.value.item) return;
            post('giveItem', { name: contextMenu.value.item.name, amount: 1 });
            contextMenu.value.visible = false;
        };

        onMounted(() => {
            rootEl = document.getElementById('inventory-app');
            if (rootEl) {
                // Sicherheit: beim Start versteckt
                rootEl.classList.add('hidden');
            }

            window.addEventListener('message', (event) => {
                const data = event.data;

                if (data.action === 'open') {
                    visible.value   = true;
                    inventory.value = data.inventory || {};
                    contextMenu.value.visible = false;
                    showRoot();
                }

                if (data.action === 'close') {
                    closeInventory();
                }

                if (data.action === 'updateSlots') {
                    inventory.value = data.inventory || {};
                }
            });

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && visible.value) {
                    closeInventory();
                }
            });

            window.addEventListener('click', closeContext);
        });

        return {
            visible,
            inventoryList,
            maxWeight,
            maxSlots,
            weight,
            contextMenu,
            openContextMenu,
            useItem,
            dropItem,
            giveItem
        };
    }
}).mount('#inventory-app');
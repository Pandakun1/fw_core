// WICHTIG: Vue Destructuring
const { ref, computed, watch, onMounted, onUnmounted } = Vue;
const useNUI = window.useNUI;

const AdminModule = {
    name: 'AdminModule',
    props: ['data'],
    setup(props) {
        const { send } = useNUI();
        
        const categories = computed(() => props.data?.categories || []);
        const currentCategoryIndex = ref(0);
        const currentItemIndex = ref(0);
        const focusPanel = ref('categories'); // 'categories' oder 'items'
        const localInputVisible = ref(false);
        const inputTitle = ref('');
        const inputPlaceholder = ref('');
        const inputCallbackId = ref(null);
        const inputValue = ref('');

        watch(() => props.data, (value) => {
            if (value?.inputVisible) {
                localInputVisible.value = true;
                inputTitle.value = value.title || '';
                inputPlaceholder.value = value.placeholder || '';
                inputCallbackId.value = value.callbackId || null;
                inputValue.value = '';
            }
        });
        
        const currentCategory = computed(() => {
            return categories.value[currentCategoryIndex.value] || null;
        });
        
        const currentItems = computed(() => {
            return currentCategory.value?.items || [];
        });
        
        const selectCategory = (index) => {
            currentCategoryIndex.value = index;
            currentItemIndex.value = 0;
            focusPanel.value = 'items';
        };
        
        const executeAction = (item) => {
            const category = currentCategory.value?.id;
            send('adminAction', {
                category: category,
                item: item.id
            });
        };

        const confirmInput = async () => {
            if (!inputCallbackId.value) {
                return;
            }

            await send('inputAction', {
                action: inputCallbackId.value,
                input: inputValue.value || ''
            });
            localInputVisible.value = false;
            inputValue.value = '';
        };

        const cancelInput = () => {
            localInputVisible.value = false;
            inputValue.value = '';
        };
        
        const close = () => {
            send('closeMenu');
        };
        
        // Keyboard Navigation
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (localInputVisible.value) {
                    cancelInput();
                    return;
                }
                close();
                return;
            }
            
            if (localInputVisible.value) {
                return;
            }

            if (e.key === 'Tab') {
                e.preventDefault();
                focusPanel.value = focusPanel.value === 'categories' ? 'items' : 'categories';
                return;
            }
            
            if (focusPanel.value === 'categories') {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    currentCategoryIndex.value = Math.max(0, currentCategoryIndex.value - 1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    currentCategoryIndex.value = Math.min(categories.value.length - 1, currentCategoryIndex.value + 1);
                } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    focusPanel.value = 'items';
                    currentItemIndex.value = 0;
                }
            } else if (focusPanel.value === 'items') {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    currentItemIndex.value = Math.max(0, currentItemIndex.value - 1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    currentItemIndex.value = Math.min(currentItems.value.length - 1, currentItemIndex.value + 1);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (currentItems.value[currentItemIndex.value]) {
                        executeAction(currentItems.value[currentItemIndex.value]);
                    }
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    focusPanel.value = 'categories';
                }
            }
        };
        
        onMounted(() => {
            window.addEventListener('keydown', handleKeyDown);
        });
        
        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyDown);
        });
        
        return { 
            categories, currentCategory, currentItems,
            currentCategoryIndex, currentItemIndex, focusPanel,
            selectCategory, executeAction, close,
            localInputVisible, inputTitle, inputPlaceholder, inputValue,
            confirmInput, cancelInput
        };
    },
    template: `
    <div class="w-full h-full flex items-center justify-center font-sans text-white">
        <div class="w-[900px] h-[600px] bg-[#1a1b21] rounded-xl flex shadow-2xl overflow-hidden border border-[#2a2b36]">
            <div class="w-64 bg-[#121317] border-r border-[#2a2b36] flex flex-col" :class="focusPanel === 'categories' ? 'border-r-2 border-r-blue-500' : ''">
                <div class="p-6 text-xl font-bold text-[#d4b483]">ADMIN MENÜ</div>
                <div class="flex-1 overflow-y-auto">
                    <button 
                        v-for="(cat, idx) in categories" :key="cat.id"
                        @click="selectCategory(idx)"
                        class="w-full text-left px-6 py-3 hover:bg-[#1a1b21] transition flex items-center gap-3"
                        :class="{
                            'text-white bg-[#1a1b21] border-l-4 border-[#d4b483]': focusPanel === 'categories' && idx === currentCategoryIndex,
                            'text-gray-400': focusPanel !== 'categories' || idx !== currentCategoryIndex
                        }"
                    >
                        <span>{{ cat.label }}</span>
                    </button>
                </div>
                <div class="p-3 text-xs text-gray-500 border-t border-[#2a2b36]">
                    <div>↑↓ Navigation</div>
                    <div>Enter/→ Auswählen</div>
                    <div>Tab Wechseln</div>
                    <div>ESC Schließen</div>
                </div>
            </div>

            <div class="flex-1 p-6 bg-[#1a1b21] overflow-y-auto" :class="focusPanel === 'items' ? 'border-l-2 border-l-blue-500' : ''">
                <h2 class="text-2xl font-bold mb-6 border-b border-[#2a2b36] pb-4">
                    {{ currentCategory?.label || 'Menü' }}
                </h2>

                <div class="space-y-2">
                    <button
                        v-for="(item, idx) in currentItems" :key="item.id"
                        @click="executeAction(item)"
                        class="w-full text-left px-4 py-3 bg-[#121317] rounded hover:bg-[#2a2b36] transition"
                        :class="{
                            'bg-blue-600 text-white hover:bg-blue-500': focusPanel === 'items' && idx === currentItemIndex,
                            'text-gray-300': focusPanel !== 'items' || idx !== currentItemIndex
                        }"
                    >
                        {{ item.label }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="localInputVisible" class="absolute inset-0 flex items-center justify-center bg-black/70">
            <div class="w-[560px] rounded-2xl bg-[#111217] border border-[#2a2b36] p-6 shadow-2xl">
                <div class="text-xl font-bold text-white mb-4">{{ inputTitle }}</div>
                <input
                    v-model="inputValue"
                    :placeholder="inputPlaceholder"
                    @keydown.enter.prevent="confirmInput"
                    class="w-full rounded-lg border border-[#2a2b36] bg-[#181b23] px-4 py-3 text-white outline-none focus:border-cyan-500"
                    type="text"
                />
                <div class="mt-4 flex justify-end gap-3">
                    <button @click="cancelInput" class="rounded bg-[#2a2b36] px-4 py-2 text-white hover:bg-[#323646]">Abbrechen</button>
                    <button @click="confirmInput" class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-500">Senden</button>
                </div>
            </div>
        </div>
    </div>
    `
};

export default AdminModule;
// Neues Vue 3 Admin Menu System
(function() {
    const { createApp, ref, computed, onMounted } = Vue;

    createApp({
        setup() {
            const visible = ref(false);
            const categories = ref([]);
            const currentCategoryIndex = ref(0);
            const currentItemIndex = ref(0);
            const focusPanel = ref('categories');
            const inputVisible = ref(false);
            const inputTitle = ref('');
            const inputPlaceholder = ref('');
            const inputValue = ref('');
            const inputCallbackId = ref('');

            const currentCategory = computed(() => {
                return categories.value[currentCategoryIndex.value] || null;
            });

            const currentItems = computed(() => {
                return currentCategory.value?.items || [];
            });

            const post = async (endpoint, data = {}) => {
                try {
                    await fetch(`https://${GetParentResourceName()}/${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } catch (err) {
                    console.error('[Admin] Error:', err);
                }
            };

            const openAdminMenu = (categoryData) => {
                visible.value = true;
                categories.value = categoryData || [];
                currentCategoryIndex.value = 0;
                currentItemIndex.value = 0;
                focusPanel.value = 'categories';
                const appEl = document.getElementById('admin-app');
                if (appEl) {
                    appEl.style.display = 'block';
                    appEl.style.pointerEvents = 'all';
                }
                console.log('[Admin] Menu opened with', categoryData?.length || 0, 'categories');
            };

            const closeAdminMenu = () => {
                visible.value = false;
                inputVisible.value = false;
                const appEl = document.getElementById('admin-app');
                if (appEl) {
                    appEl.style.display = 'none';
                    appEl.style.pointerEvents = 'none';
                }
                post('closeMenu');
                console.log('[Admin] Menu closed');
            };

            const selectCategory = (index) => {
                currentCategoryIndex.value = index;
                currentItemIndex.value = 0;
            };

            const executeAction = (item) => {
                post('adminAction', {
                    category: currentCategory.value.id,
                    item: item.id
                });
            };

            const showInput = (data) => {
                inputVisible.value = true;
                inputTitle.value = data.title;
                inputPlaceholder.value = data.placeholder;
                inputCallbackId.value = data.callbackId;
                inputValue.value = '';
            };

            const submitInput = () => {
                if (!inputValue.value.trim()) return;
                post('inputAction', {
                    action: inputCallbackId.value,
                    input: inputValue.value
                });
                inputVisible.value = false;
                inputValue.value = '';
            };

            onMounted(() => {
                // Initial verstecken
                const appEl = document.getElementById('admin-app');
                if (appEl) {
                    appEl.style.display = 'none';
                    appEl.style.pointerEvents = 'none';
                }

                window.addEventListener('message', (event) => {
                    const { action, categories: cats, title, placeholder, callbackId } = event.data;
                    if (!action) return;

                    const adminActions = ['openAdminMenu', 'closeAdminMenu', 'showInput'];
                    if (!adminActions.includes(action)) return;

                    if (action === 'openAdminMenu') openAdminMenu(cats);
                    if (action === 'closeAdminMenu') closeAdminMenu();
                    if (action === 'showInput') showInput({ title, placeholder, callbackId });
                });

                window.addEventListener('keydown', (e) => {
                    if (!visible.value) return;

                    if (inputVisible.value) {
                        if (e.key === 'Enter') submitInput();
                        if (e.key === 'Escape') inputVisible.value = false;
                        return;
                    }

                    if (e.key === 'Escape') closeAdminMenu();
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        focusPanel.value = focusPanel.value === 'categories' ? 'items' : 'categories';
                    }

                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        const direction = e.key === 'ArrowUp' ? -1 : 1;
                        
                        if (focusPanel.value === 'categories') {
                            const max = categories.value.length - 1;
                            currentCategoryIndex.value = Math.max(0, Math.min(max, currentCategoryIndex.value + direction));
                            currentItemIndex.value = 0;
                        } else {
                            const max = currentItems.value.length - 1;
                            currentItemIndex.value = Math.max(0, Math.min(max, currentItemIndex.value + direction));
                        }
                    }

                    if (e.key === 'Enter' && focusPanel.value === 'items') {
                        executeAction(currentItems.value[currentItemIndex.value]);
                    }
                });
            });

            return {
                visible,
                categories,
                currentCategoryIndex,
                currentItemIndex,
                focusPanel,
                currentCategory,
                currentItems,
                inputVisible,
                inputTitle,
                inputPlaceholder,
                inputValue,
                selectCategory,
                executeAction,
                closeAdminMenu,
                submitInput
            };
        }
    }).mount('#admin-app');
})();

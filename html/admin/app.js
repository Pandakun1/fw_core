window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.action !== 'copy' || typeof data.text !== 'string') return;

    const text = data.text;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
});

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        console.log('[clipboard] copied via execCommand');
    } catch (e) {
        console.error('[clipboard] copy failed', e);
    }

    document.body.removeChild(textarea);
}


const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const visible = ref(false);
        const categories = ref([]);
        const currentCategoryIndex = ref(0);
        const currentItemIndex = ref(0);
        const focusPanel = ref("categories");
        const inputVisible = ref(false);
        const inputTitle = ref("");
        const inputPlaceholder = ref("");
        const inputCallbackId = ref("");
        const inputValue = ref("");
        const currentCategory = computed(() => {
            return categories.value[currentCategoryIndex.value] || null;
        });

        const currentItems = computed(() => {
            return currentCategory.value?.items || [];
        });

        const selectCategory = (id) => {
            const idx = categories.value.findIndex(c => c.id === id);
            if (idx !== -1) {
                currentCategoryIndex.value = idx;
                currentItemIndex.value = 0;
            }
        };

        const sendAction = (itemId) => {
            const cat = currentCategory.value;
            if (!cat) return;

            const item =
                itemId
                    ? currentItems.value.find(i => i.id === itemId)
                    : currentItems.value[currentItemIndex.value];

            if (!item) return;

            fetch(`https://${GetParentResourceName()}/adminAction`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify({
                    category: cat.id,
                    item: item.id
                })
            });
        };

        const closeMenu = () => {
            visible.value = false;
            inputVisible.value = false;
            
            const adminApp = document.getElementById('admin-app');
            if (adminApp) {
                adminApp.style.display = 'none';
                adminApp.style.pointerEvents = 'none';
            }
            
            fetch(`https://${GetParentResourceName()}/closeMenu`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: "{}"
            });
        };

        const submitInput = () => {
            if (!inputValue.value.trim()) return;

            fetch(`https://${GetParentResourceName()}/inputAction`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify({
                    action: inputCallbackId.value,
                    input: inputValue.value.trim()
                })
            });

            inputVisible.value = false;
            inputValue.value = "";
        };

        const cancelInput = () => {
             inputVisible.value = false;
             inputValue.value = "";
        };


        onMounted(() => {
            const adminApp = document.getElementById('admin-app');
            
            window.addEventListener("message", (event) => {
                const data = event.data;
                if (!data || !data.action) return;

                // NUR Admin-spezifische Actions verarbeiten - alles andere ignorieren
                const adminActions = ["openAdminMenu", "closeAdminMenu", "showInput"];
                if (!adminActions.includes(data.action)) return;

                if (data.action === "openAdminMenu") {
                    const menuData = data.data || {};
                    categories.value = menuData.categories || [];

                    currentCategoryIndex.value = 0;
                    currentItemIndex.value = 0;
                    focusPanel.value = "categories";
                    visible.value = true;
                    inputVisible.value = false;
                    
                    // Zeige Admin App
                    if (adminApp) {
                        console.log('[Admin] Opening menu');
                        console.log('[Admin] Before - display:', adminApp.style.display, 'pointer-events:', adminApp.style.pointerEvents);
                        
                        adminApp.style.display = 'block';
                        adminApp.style.pointerEvents = 'all';
                        
                        console.log('[Admin] After - display:', adminApp.style.display, 'pointer-events:', adminApp.style.pointerEvents);
                        console.log('[Admin] Computed:', window.getComputedStyle(adminApp).pointerEvents);
                    }
                }

                if (data.action === "closeAdminMenu") {
                    visible.value = false;
                    inputVisible.value = false;
                    
                    // Verstecke Admin App
                    if (adminApp) {
                        adminApp.style.display = 'none';
                        adminApp.style.pointerEvents = 'none';
                    }
                }
                
                if (data.action === "showInput") {
                    inputTitle.value = data.title;
                    inputPlaceholder.value = data.placeholder;
                    inputCallbackId.value = data.callbackId;
                    inputValue.value = "";
                    visible.value = true;
                    inputVisible.value = true;
                }
            });

            // Tastatursteuerung
            document.addEventListener("keydown", (e) => {
                if (!visible.value) return;
                if (inputVisible.value) {
                    if (["Escape", "Enter"].includes(e.key)) {
                        e.preventDefault(); 
                    }
                    if (e.key === "Enter") {
                        submitInput();
                        return;
                    }
                    if (e.key === "Escape") {
                        cancelInput();
                        return;
                    }
                    return;
                }
                // --- ENDE LOGIK EINGABEMODAL
                
                
                // --- LOGIK FÜR DAS HAUPTMENÜ

                if (["ArrowUp", "ArrowDown", "Tab", "Enter"].includes(e.key)) {
                    e.preventDefault();
                }

                if (e.key === "Escape") {
                    closeMenu();
                    return;
                }

                if (e.key === "Tab") {
                    focusPanel.value =
                        focusPanel.value === "categories" ? "items" : "categories";
                    return;
                }

                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    const direction = e.key === "ArrowUp" ? -1 : 1;

                    if (focusPanel.value === "categories") {
                        const max = categories.value.length - 1;
                        if (max < 0) return;

                        let idx = currentCategoryIndex.value + direction;
                        if (idx < 0) idx = 0;
                        if (idx > max) idx = max;

                        currentCategoryIndex.value = idx;
                        currentItemIndex.value = 0;
                        return;
                    }

                    if (focusPanel.value === "items") {
                        const items = currentItems.value;
                        const max = items.length - 1;
                        if (max < 0) return;

                        let idx = currentItemIndex.value + direction;
                        if (idx < 0) idx = 0;
                        if (idx > max) idx = max;

                        currentItemIndex.value = idx;
                        return;
                    }
                }

                if (e.key === "Enter") {
                    if (focusPanel.value === "items") {
                        sendAction();
                    }
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
            selectCategory,
            sendAction,
            closeMenu,
            inputVisible,
            inputTitle,
            inputPlaceholder,
            inputValue,
            submitInput,
            cancelInput
        };
    }
}).mount("#admin-app");

const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const visible = ref(false);
        const categories = ref([]);
        const currentCategoryId = ref(null);

        const currentItems = computed(() => {
            const cat = categories.value.find(c => c.id === currentCategoryId.value);
            return cat?.items || [];
        });

        const selectCategory = (id) => {
            currentCategoryId.value = id;
        };

        const sendAction = (itemId) => {
            fetch(`https://${GetParentResourceName()}/adminAction`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify({
                    category: currentCategoryId.value,
                    item: itemId
                })
            });
        };

        const closeMenu = () => {
            visible.value = false;
            fetch(`https://${GetParentResourceName()}/closeMenu`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: "{}"
            });
        };

        onMounted(() => {
            window.addEventListener("message", (event) => {
                if (!event.data || !event.data.action) return;

                if (event.data.action === "open") {
                    categories.value = event.data.data.categories || [];
                    currentCategoryId.value = categories.value[0]?.id || null;
                    visible.value = true;
                }

                if (event.data.action === "close") {
                    visible.value = false;
                }
            });

            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && visible.value) {
                    closeMenu();
                }
            });
        });

        return {
            visible,
            categories,
            currentCategoryId,
            currentItems,
            selectCategory,
            sendAction,
            closeMenu
        };
    }
}).mount("#admin-app");
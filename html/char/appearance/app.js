const { createApp: createAppearanceApp } = Vue;

createAppearanceApp({
    setup() {
        const visible = Vue.ref(false);
        const currentTab = Vue.ref('face');
        const fromCreator = Vue.ref(false);

        const tabs = Vue.ref([
            { id: 'face', label: 'Gesicht' },
            { id: 'hair', label: 'Haare' },
            { id: 'eyes', label: 'Augen' },
            { id: 'features', label: 'Merkmale' }
        ]);

        const appearance = Vue.ref({
            face: {
                mother: 21,
                father: 0,
                resemblance: 50,
                skinTone: 50
            },
            hair: {
                style: 0,
                color: '#000000',
                highlightColor: '#000000'
            },
            eyes: {
                color: 0,
                eyebrows: 0,
                eyebrowColor: '#000000'
            },
            features: {
                noseWidth: 0,
                noseHeight: 0,
                lipThickness: 0,
                jawWidth: 0
            }
        });

        const closeAppearance = () => {
            const appContainer = document.getElementById('appearance-app');
            visible.value = false;
            if (appContainer) appContainer.style.display = 'none';
            
            if (fromCreator.value) {
                // Return to character creator
                fetch(`https://${GetParentResourceName()}/closeAppearance`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json; charset=UTF-8" },
                    body: JSON.stringify({ returnToCreator: true })
                });
            } else {
                // Just close
                fetch(`https://${GetParentResourceName()}/closeAppearance`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json; charset=UTF-8" },
                    body: JSON.stringify({ returnToCreator: false })
                });
            }
        };

        const saveAppearance = () => {
            const appContainer = document.getElementById('appearance-app');
            visible.value = false;
            if (appContainer) appContainer.style.display = 'none';
            
            // Send appearance data to Lua
            fetch(`https://${GetParentResourceName()}/saveAppearance`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify({ 
                    skin: appearance.value,
                    returnToCreator: fromCreator.value
                })
            });
        };

        // Watch for changes and send to Lua for preview
        Vue.watch(() => appearance.value, (newValue) => {
            if (visible.value) {
                fetch(`https://${GetParentResourceName()}/previewAppearance`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json; charset=UTF-8" },
                    body: JSON.stringify({ skin: newValue })
                });
            }
        }, { deep: true });

        Vue.onMounted(() => {
            const appContainer = document.getElementById('appearance-app');
            
            window.addEventListener("message", (event) => {
                const data = event.data;
                if (!data || !data.action) return;

                // Nur Appearance relevante Actions verarbeiten
                const validActions = ['openAppearance', 'closeAppearance'];
                if (!validActions.includes(data.action)) return;

                if (data.action === "openAppearance") {
                    console.log('[Appearance] Opening editor');
                    if (appContainer) appContainer.style.display = 'block';
                    if (data.currentSkin) {
                        appearance.value = data.currentSkin;
                    }
                    fromCreator.value = data.fromCreator || false;
                    currentTab.value = 'face';
                    visible.value = true;
                }

                if (data.action === "closeAppearance") {
                    visible.value = false;
                    if (appContainer) appContainer.style.display = 'none';
                }
            });
        });

        return {
            visible,
            currentTab,
            tabs,
            appearance,
            closeAppearance,
            saveAppearance
        };
    }
}).mount("#appearance-app");

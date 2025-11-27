const { createApp: createCharSelectionApp } = Vue;

createCharSelectionApp({
    setup() {
        const visible = Vue.ref(false);
        const characters = Vue.ref([]);
        const maxChars = Vue.ref(5);
        const selectedIndex = Vue.ref(-1);
        const charToDelete = Vue.ref(null);

        const selectCharacter = (index) => {
            selectedIndex.value = index;
        };
        
        const confirmDelete = (charId) => {
            charToDelete.value = charId;
        };
        
        const cancelDelete = () => {
            charToDelete.value = null;
        };

        const playCharacter = (charId) => {
            fetch(`https://${GetParentResourceName()}/selectCharacter`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify({ charid: charId })
            });
            visible.value = false;
        };

        const deleteCharacter = async () => {
            if (!charToDelete.value) return;
            
            const charId = charToDelete.value;
            console.log('[CharSelection] Deleting character:', charId);
            
            try {
                // Send delete request to server
                await fetch(`https://${GetParentResourceName()}/deleteCharacter`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json; charset=UTF-8" },
                    body: JSON.stringify({ charid: charId })
                });
                
                // Remove character from local list immediately
                characters.value = characters.value.filter(c => c.id !== charId);
                charToDelete.value = null;
                console.log('[CharSelection] Character deleted successfully');
            } catch (error) {
                console.error('[CharSelection] Error deleting character:', error);
                charToDelete.value = null;
            }
        };

        const openCharCreator = () => {
            visible.value = false;
            // Open character creator
            fetch(`https://${GetParentResourceName()}/openCharCreator`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: "{}"
            });
        };

        Vue.onMounted(() => {
            const appContainer = document.getElementById('char-selection-app');
            
            window.addEventListener("message", (event) => {
                const data = event.data;
                if (!data || !data.action) return;

                // Nur Character Selection relevante Actions verarbeiten
                const validActions = ['openCharSelection', 'closeCharSelection', 'updateCharacters'];
                if (!validActions.includes(data.action)) return;

                if (data.action === "openCharSelection") {
                    console.log('[CharSelection] Opening with characters:', data.characters);
                    characters.value = data.characters || [];
                    maxChars.value = data.maxChars || 5;
                    selectedIndex.value = -1;
                    visible.value = true;
                    if (appContainer) appContainer.style.display = 'block';
                }

                if (data.action === "closeCharSelection") {
                    visible.value = false;
                    if (appContainer) appContainer.style.display = 'none';
                }

                if (data.action === "updateCharacters") {
                    characters.value = data.characters || [];
                }
            });

            // ESC key to close
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && visible.value) {
                    e.preventDefault();
                    fetch(`https://${GetParentResourceName()}/close`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json; charset=UTF-8" },
                        body: "{}"
                    });
                    visible.value = false;
                }
            });
        });

        return {
            visible,
            characters,
            maxChars,
            selectedIndex,
            charToDelete,
            selectCharacter,
            playCharacter,
            confirmDelete,
            cancelDelete,
            deleteCharacter,
            openCharCreator
        };
    }
}).mount("#char-selection-app");

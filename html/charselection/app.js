const { createApp: createCharSelectionApp } = Vue;

createCharSelectionApp({
    setup() {
        const visible = Vue.ref(false);
        const characters = Vue.ref([]);
        const maxChars = Vue.ref(5);
        const selectedIndex = Vue.ref(-1);

        const selectCharacter = (index) => {
            selectedIndex.value = index;
        };

        const playCharacter = (charId) => {
            fetch(`https://${GetParentResourceName()}/selectCharacter`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify({ charid: charId })
            });
            visible.value = false;
        };

        const deleteCharacter = (charId) => {
            // TODO: Implement custom confirmation modal
            // For now using browser confirm as a temporary solution
            if (confirm('Möchten Sie diesen Charakter wirklich löschen?')) {
                fetch(`https://${GetParentResourceName()}/deleteCharacter`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json; charset=UTF-8" },
                    body: JSON.stringify({ charid: charId })
                }).then(() => {
                    // Remove character from list
                    characters.value = characters.value.filter(c => c.id !== charId);
                });
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
            window.addEventListener("message", (event) => {
                const data = event.data;
                if (!data || !data.action) return;

                if (data.action === "openCharSelection") {
                    characters.value = data.characters || [];
                    maxChars.value = data.maxChars || 5;
                    selectedIndex.value = -1;
                    visible.value = true;
                }

                if (data.action === "closeCharSelection") {
                    visible.value = false;
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
            selectCharacter,
            playCharacter,
            deleteCharacter,
            openCharCreator
        };
    }
}).mount("#char-selection-app");

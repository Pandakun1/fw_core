const { createApp: createCharCreatorApp } = Vue;

createCharCreatorApp({
    setup() {
        const visible = Vue.ref(false);
        const formData = Vue.ref({
            firstname: '',
            lastname: '',
            dateofbirth: '',
            sex: 'male',
            height: 175,
            skin: {
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
            }
        });

        const closeCreator = () => {
            visible.value = false;
            // Reopen character selection
            fetch(`https://${GetParentResourceName()}/closeCharCreator`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: "{}"
            });
        };

        const openAppearanceEditor = () => {
            visible.value = false;
            // Open appearance editor
            fetch(`https://${GetParentResourceName()}/openAppearance`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify({ currentSkin: formData.value.skin })
            });
        };

        const createCharacter = () => {
            // Validate form
            if (!formData.value.firstname || !formData.value.lastname) {
                // Send notification through NUI for consistency
                fetch(`https://${GetParentResourceName()}/showNotification`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json; charset=UTF-8" },
                    body: JSON.stringify({ 
                        message: 'Bitte füllen Sie alle Pflichtfelder aus.',
                        type: 'error'
                    })
                });
                return;
            }

            if (!formData.value.dateofbirth) {
                fetch(`https://${GetParentResourceName()}/showNotification`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json; charset=UTF-8" },
                    body: JSON.stringify({ 
                        message: 'Bitte geben Sie ein Geburtsdatum an.',
                        type: 'error'
                    })
                });
                return;
            }

            // Send to server
            fetch(`https://${GetParentResourceName()}/createCharacter`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify(formData.value)
            });

            visible.value = false;
        };

        Vue.onMounted(() => {
            window.addEventListener("message", (event) => {
                const data = event.data;
                if (!data || !data.action) return;

                if (data.action === "openCharCreator") {
                    // Reset form
                    formData.value = {
                        firstname: '',
                        lastname: '',
                        dateofbirth: '',
                        sex: 'male',
                        height: 175,
                        skin: data.skin || {
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
                        }
                    };
                    visible.value = true;
                }

                if (data.action === "closeCharCreator") {
                    visible.value = false;
                }

                if (data.action === "updateSkin") {
                    formData.value.skin = data.skin;
                }
            });
        });

        return {
            visible,
            formData,
            closeCreator,
            openAppearanceEditor,
            createCharacter
        };
    }
}).mount("#char-creator-app");

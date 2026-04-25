window.useDoorsCreatorStore = Pinia.defineStore('doorsCreator', {
    state: () => ({
        label: '',
        locked: true,
        primaryDoor: null,
        secondaryDoor: null
    }),

    actions: {
        reset() {
            this.label = '';
            this.locked = true;
            this.primaryDoor = null;
            this.secondaryDoor = null;
        },

        setPrimaryDoor(entity) {
            this.primaryDoor = entity || null;
        },

        setSecondaryDoor(entity) {
            this.secondaryDoor = entity || null;
        },

        async captureCurrentPosition() {
            try {
                const result = await window.NUIBridge.send('creator:doors:capturePrimary');
                if (result?.ok) {
                    this.primaryDoor = result.entity || null;
                }
            } catch (error) {
                console.error('[DoorsCreatorStore] captureCurrentPosition failed:', error);
            }
        },

        async captureSecondPosition() {
            try {
                const result = await window.NUIBridge.send('creator:doors:captureSecondary');
                if (result?.ok) {
                    this.secondaryDoor = result.entity || null;
                }
            } catch (error) {
                console.error('[DoorsCreatorStore] captureSecondPosition failed:', error);
            }
        },

        async saveDraft() {
            try {
                await window.NUIBridge.send('creator:doors:saveDraft', {
                    label: this.label,
                    locked: this.locked,
                    primaryDoor: this.primaryDoor,
                    secondaryDoor: this.secondaryDoor
                });
            } catch (error) {
                console.error('[DoorsCreatorStore] saveDraft failed:', error);
            }
        }
    }
});
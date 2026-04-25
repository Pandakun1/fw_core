window.useCreatorStore = Pinia.defineStore('creator', {
    state: () => ({
        isOpen: false,
        isFocused: false,
        noclipEnabled: false,
        selectedModeIndex: 0,
        activeMode: null,
        modes: [
            {
                id: 'doors',
                label: 'Doors Creator',
                description: 'Erstelle abschließbare Türen und Gebäudeeingänge.'
            },
            {
                id: 'jobs',
                label: 'Jobs Creator',
                description: 'Erstelle Job-Punkte wie Garage, Duty, Bossmenu oder Stash.'
            }
        ]
    }),

    getters: {
        selectedMode(state) {
            return state.modes[state.selectedModeIndex] || null;
        },

        isModeActive(state) {
            return (modeId) => state.activeMode === modeId;
        }
    },

    actions: {
        open() {
            this.isOpen = true;
            this.isFocused = true;
        },

        close() {
            this.isOpen = false;
            this.isFocused = false;
        },

        setVisible(state) {
            this.isOpen = !!state;
        },

        toggleFocus() {
            if (!this.isOpen) return;
            this.isFocused = !this.isFocused;
        },

        setFocus(state) {
            if (!this.isOpen) return;
            this.isFocused = !!state;
        },

        setNoclip(state) {
            this.noclipEnabled = !!state;
        },

        toggleNoclip() {
            this.noclipEnabled = !this.noclipEnabled;
        },

        selectMode(index) {
            this.selectedModeIndex = Math.max(0, Math.min(index, this.modes.length - 1));
        },

        selectNextMode() {
            this.selectMode(this.selectedModeIndex + 1);
        },

        selectPreviousMode() {
            this.selectMode(this.selectedModeIndex - 1);
        },

        activateSelectedMode() {
            const mode = this.selectedMode;
            if (!mode) return;
            this.activeMode = mode.id;
        },

        deactivateMode() {
            this.activeMode = null;
        },

        toggleSelectedMode() {
            const mode = this.selectedMode;
            if (!mode) return;

            if (this.activeMode === mode.id) {
                this.activeMode = null;
                return;
            }

            this.activeMode = mode.id;
        }
    }
});
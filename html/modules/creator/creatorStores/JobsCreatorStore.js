window.useJobsCreatorStore = Pinia.defineStore('jobsCreator', {
    state: () => ({
        jobName: '',
        label: '',
        points: {
            garage: null,
            duty: null,
            bossmenu: null,
            stash: null
        }
    }),

    actions: {
        reset() {
            this.jobName = '';
            this.label = '';
            this.points = {
                garage: null,
                duty: null,
                bossmenu: null,
                stash: null
            };
        },

        setPoint(type, coords) {
            if (!type) return;
            this.points[type] = coords || null;
        },

        async capturePoint(type) {
            try {
                const result = await window.NUIBridge.send('creator:jobs:capturePoint', { type });
                this.points[type] = result?.coords || null;
            } catch (error) {
                console.error('[JobsCreatorStore] capturePoint failed:', error);
            }
        },

        async saveDraft() {
            try {
                await window.NUIBridge.send('creator:jobs:saveDraft', {
                    jobName: this.jobName,
                    label: this.label,
                    points: this.points
                });
            } catch (error) {
                console.error('[JobsCreatorStore] saveDraft failed:', error);
            }
        }
    }
});
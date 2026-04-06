const { ref, onMounted, onUnmounted } = Vue;

const NotifyModule = {
    name: 'NotifyModule',
    setup() {
        const notifications = ref([]);
        let idCounter = 0;
        const handleNotification = (e) => {
            const { message, type, duration } = e.detail;
            const id = idCounter++;
            
            let colors = 'bg-blue-600';
            if (type === 'error') colors = 'bg-red-600';
            if (type === 'success') colors = 'bg-green-600';

            notifications.value.push({ id, message, colors });

            setTimeout(() => {
                notifications.value = notifications.value.filter(n => n.id !== id);
            }, duration || 3000);
        };

        onMounted(() => {
            window.addEventListener('notification', handleNotification);
        });

        onUnmounted(() => {
            window.removeEventListener('notification', handleNotification);
        });

        return { notifications };
    },
    template: `
    <div class="absolute top-10 right-10 flex flex-col gap-2 items-end">
        <TransitionGroup name="list">
            <div 
                v-for="notify in notifications" 
                :key="notify.id"
                class="px-4 py-3 rounded shadow-lg text-white font-medium min-w-[250px] flex items-center gap-3 backdrop-blur-md"
                :class="notify.colors"
            >
                <span>🔔</span>
                <span>{{ notify.message }}</span>
            </div>
        </TransitionGroup>
    </div>
    `
};

export default NotifyModule;
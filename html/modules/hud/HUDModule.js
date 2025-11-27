const HUDModule = {
    name: 'HUDModule',
    setup() {
        const health = ref(100);
        const armor = ref(0);
        const hunger = ref(100);
        const thirst = ref(100);
        const speed = ref(0);
        const fuel = ref(0);
        const inVehicle = ref(false);

        // Event Listener für Updates aus Lua
        window.addEventListener('hud-update', (e) => {
            const data = e.detail;
            if (data.health !== undefined) health.value = data.health;
            if (data.armor !== undefined) armor.value = data.armor;
            if (data.hunger !== undefined) hunger.value = data.hunger;
            if (data.thirst !== undefined) thirst.value = data.thirst;
            
            if (data.inVehicle !== undefined) inVehicle.value = data.inVehicle;
            if (data.speed !== undefined) speed.value = data.speed;
            if (data.fuel !== undefined) fuel.value = data.fuel;
        });

        return { health, armor, hunger, thirst, speed, fuel, inVehicle };
    },
    template: `
    <div class="w-full h-full relative">
        <div class="absolute bottom-10 left-10 flex gap-4">
            <div class="flex flex-col items-center gap-1">
                <div class="w-10 h-10 rounded-full bg-gray-900/80 border-2 border-green-500 flex items-center justify-center text-green-500">❤️</div>
                <div class="h-1.5 w-full bg-gray-800 rounded overflow-hidden"><div class="h-full bg-green-500" :style="{width: health + '%'}"></div></div>
            </div>
            <div v-if="armor > 0" class="flex flex-col items-center gap-1">
                <div class="w-10 h-10 rounded-full bg-gray-900/80 border-2 border-blue-500 flex items-center justify-center text-blue-500">🛡️</div>
                <div class="h-1.5 w-full bg-gray-800 rounded overflow-hidden"><div class="h-full bg-blue-500" :style="{width: armor + '%'}"></div></div>
            </div>
             </div>

        <div v-if="inVehicle" class="absolute bottom-10 right-10 bg-black/50 p-4 rounded-xl backdrop-blur-sm border border-white/10">
            <div class="text-4xl font-bold text-white text-right">{{ Math.round(speed) }} <span class="text-sm text-gray-400">km/h</span></div>
            <div class="text-right text-orange-400 text-sm mt-1">⛽ {{ Math.round(fuel) }}%</div>
        </div>
    </div>
    `
};
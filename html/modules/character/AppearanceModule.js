// Globale Variablen holen
const useNUI = window.useNUI; 
const { ref, computed } = Vue;
const useAppearanceStore = window.useAppearanceStore; 

const AppearanceModule = {
    name: 'AppearanceModule',
    setup() {
        const { send } = useNUI();

        const skin = ref({
            hair: { id: 0, color: 0, max: 70 },
            face: { id: 0, max: 45 },
            tshirt: { id: 0, texture: 0, max: 150 },
            pants: { id: 0, texture: 0, max: 100 },
            shoes: { id: 0, texture: 0, max: 100 },
            torso: { id: 0, texture: 0, max: 100 },
            arms: { id: 0, texture: 0, max: 100 }
        });

        const updatePreview = (component, type) => {
            send('previewAppearance', { 
                component: component, 
                value: skin.value[component][type],
                type: type 
            });
        };

        const save = () => {
            send('saveAppearance', skin.value);
        };
        
        const rotate = (dir) => {
            send('rotateCamera', { direction: dir });
        };

        return { skin, updatePreview, save, rotate };
    },
    template: `
    <div class="absolute right-0 top-0 h-full w-[350px] bg-[#1a1b21]/95 border-l border-[#2a2b36] p-6 flex flex-col overflow-y-auto backdrop-blur-md font-sans">
        <h2 class="text-xl font-bold text-[#d4b483] mb-6 text-center uppercase tracking-widest">Charakter Anpassung</h2>

        <div class="space-y-6 flex-1">
            
            <div class="space-y-4">
                <div class="text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-700 pb-1">Kopf</div>
                
                <div>
                    <div class="flex justify-between text-sm text-gray-300 mb-1"><span>Frisur</span> <span>{{ skin.hair.id }}</span></div>
                    <input type="range" v-model.number="skin.hair.id" :max="skin.hair.max" @input="updatePreview('hair', 'id')" class="w-full accent-[#d4b483] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer">
                </div>
            </div>

            <div class="space-y-4">
                <div class="text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-700 pb-1">Kleidung</div>

                <div>
                    <div class="flex justify-between text-sm text-gray-300 mb-1"><span>Oberteil</span> <span>{{ skin.tshirt.id }}</span></div>
                    <input type="range" v-model.number="skin.tshirt.id" :max="skin.tshirt.max" @input="updatePreview('tshirt', 'id')" class="w-full accent-[#d4b483] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer mb-2">
                    
                    <div class="flex justify-between text-xs text-gray-500 mb-1"><span>Farbe</span> <span>{{ skin.tshirt.texture }}</span></div>
                    <input type="range" v-model.number="skin.tshirt.texture" max="10" @input="updatePreview('tshirt', 'texture')" class="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer">
                </div>

                <div>
                    <div class="flex justify-between text-sm text-gray-300 mb-1"><span>Hose</span> <span>{{ skin.pants.id }}</span></div>
                    <input type="range" v-model.number="skin.pants.id" :max="skin.pants.max" @input="updatePreview('pants', 'id')" class="w-full accent-[#d4b483] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer">
                </div>

                <div>
                    <div class="flex justify-between text-sm text-gray-300 mb-1"><span>Schuhe</span> <span>{{ skin.shoes.id }}</span></div>
                    <input type="range" v-model.number="skin.shoes.id" :max="skin.shoes.max" @input="updatePreview('shoes', 'id')" class="w-full accent-[#d4b483] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer">
                </div>
            </div>
        </div>

        <div class="flex justify-center gap-4 my-4">
            <button @click="rotate('left')" class="p-2 bg-gray-800 rounded hover:bg-gray-700 text-white border border-gray-700">↺</button>
            <button @click="rotate('right')" class="p-2 bg-gray-800 rounded hover:bg-gray-700 text-white border border-gray-700">↻</button>
        </div>

        <button @click="save" class="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-lg transition mt-4 active:scale-[0.98]">
            Charakter Speichern
        </button>
    </div>
    `
};
export default AppearanceModule;
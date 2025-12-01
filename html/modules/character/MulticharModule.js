// [NEU] Globale Variablen explizit abrufen
const useNUI = window.useNUI; 
const { ref } = Vue;
const useMultiCharStore = window.useMultiCharStore; 

const MulticharModule = {
    name: 'MulticharModule',
    props: ['data'], 
    setup(props) {
        const { send } = useNUI();

        const selectChar = (charid) => {
            console.log('[MulticharModule] Selecting character:', charid);
            send('selectCharacter', { charid });
        };

        const createNew = () => {
            console.log('[MulticharModule] Creating new character');
            send('openCharCreator');
        };

        const deleteChar = (charid) => {
            console.log('[MulticharModule] Deleting character:', charid);
            send('deleteCharacter', { charid });
        };

        return { selectChar, createNew, deleteChar, props };
    },
    template: `
    <div class="w-full h-full flex items-center justify-center bg-gradient-to-t from-black via-transparent to-transparent font-sans">
        <div class="flex gap-6">
            <div 
                v-for="char in props.data.data.characters" 
                :key="char.id"
                class="w-64 h-96 bg-gray-900/90 border border-gray-700 hover:border-blue-500 rounded-xl p-5 flex flex-col cursor-pointer transition transform hover:-translate-y-2 shadow-xl"
                @click="selectChar(char.id)"
            >
                <div class="h-40 bg-gray-800 rounded mb-4 flex items-center justify-center text-4xl shadow-inner">👤</div>
                <h2 class="text-xl font-bold text-white truncate">{{ char.firstname }} {{ char.lastname }}</h2>
                <p class="text-gray-400 text-sm mt-2">Geb: {{ char.dateofbirth }}</p>
                <p class="text-gray-400 text-sm">Geschlecht: {{ char.sex }}</p>
                <p class="text-gray-400 text-sm">Größe: {{ char.height }} cm</p>
                
                <button @click.stop="deleteChar(char.id)" class="mt-auto w-full py-2 bg-red-900/50 text-red-400 hover:bg-red-600 hover:text-white rounded transition text-sm font-bold">Löschen</button>
            </div>

            <div 
                v-if="props.data.data.characters && props.data.data.characters.length < (props.data.data.maxChars || 4)"
                class="w-64 h-96 bg-gray-900/50 border-2 border-dashed border-gray-700 hover:border-green-500 rounded-xl flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-green-500 transition group"
                @click="createNew"
            >
                <div class="text-6xl mb-2 group-hover:scale-110 transition">+</div>
                <div class="font-bold">Neuen Charakter</div>
            </div>
        </div>
    </div>
    `
};

export default MulticharModule;
const MulticharModule = {
    name: 'MulticharModule',
    props: ['data'], // Erwartet { characters: [], maxChars: 4 }
    setup(props) {
        const { send } = useNUI(); // Dein Composable

        const selectChar = (charid) => {
            send('selectCharacter', { charid });
        };

        const createNew = () => {
            send('openCharCreator'); // Wechselt UI im Client script
        };

        const deleteChar = (charid) => {
            send('deleteCharacter', { charid });
        };

        return { selectChar, createNew, deleteChar, props };
    },
    template: `
    <div class="w-full h-full flex items-center justify-center bg-gradient-to-t from-black via-transparent to-transparent">
        <div class="flex gap-6">
            <div 
                v-for="char in props.data.characters" 
                :key="char.citizenid"
                class="w-64 h-96 bg-gray-900/90 border border-gray-700 hover:border-blue-500 rounded-xl p-5 flex flex-col cursor-pointer transition transform hover:-translate-y-2"
                @click="selectChar(char.citizenid)"
            >
                <div class="h-40 bg-gray-800 rounded mb-4 flex items-center justify-center text-4xl">👤</div>
                <h2 class="text-xl font-bold text-white">{{ char.firstname }} {{ char.lastname }}</h2>
                <p class="text-gray-400 text-sm mt-2">Geb: {{ char.dateofbirth }}</p>
                <p class="text-gray-400 text-sm">Job: {{ char.job }}</p>
                
                <button @click.stop="deleteChar(char.citizenid)" class="mt-auto w-full py-2 bg-red-900/50 text-red-400 hover:bg-red-600 hover:text-white rounded">Löschen</button>
            </div>

            <div 
                v-if="props.data.characters.length < props.data.maxChars"
                class="w-64 h-96 bg-gray-900/50 border-2 border-dashed border-gray-700 hover:border-green-500 rounded-xl flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-green-500 transition"
                @click="createNew"
            >
                <div class="text-6xl mb-2">+</div>
                <div class="font-bold">Neuen Charakter</div>
            </div>
        </div>
    </div>
    `
};
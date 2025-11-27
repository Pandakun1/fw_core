// Globale Variablen holen
const { ref } = Vue;
const useNUI = window.useNUI;

const CharCreatorModule = {
    name: 'CharCreatorModule',
    setup() {
        const { send } = useNUI();
        
        const form = ref({
            firstname: '',
            lastname: '',
            birthdate: '',
            gender: 'm',
            nationality: ''
        });

        const submit = () => {
            if(!form.value.firstname || !form.value.lastname || !form.value.birthdate) return;
            send('createCharacterBase', form.value);
        };

        return { form, submit };
    },
    template: `
    <div class="w-[500px] bg-[#1a1b21] border border-[#2a2b36] rounded-xl shadow-2xl p-8 text-white font-sans">
        <h2 class="text-2xl font-bold text-[#d4b483] mb-6 text-center tracking-widest">IDENTITÄT ERSTELLEN</h2>

        <div class="space-y-4">
            <div>
                <label class="block text-gray-400 text-xs uppercase mb-1">Vorname</label>
                <input v-model="form.firstname" type="text" class="w-full bg-[#0b0c0f] border border-[#2a2b36] rounded p-3 focus:border-[#d4b483] outline-none transition text-white placeholder-gray-600" placeholder="Max">
            </div>

            <div>
                <label class="block text-gray-400 text-xs uppercase mb-1">Nachname</label>
                <input v-model="form.lastname" type="text" class="w-full bg-[#0b0c0f] border border-[#2a2b36] rounded p-3 focus:border-[#d4b483] outline-none transition text-white placeholder-gray-600" placeholder="Mustermann">
            </div>

            <div>
                <label class="block text-gray-400 text-xs uppercase mb-1">Geburtsdatum</label>
                <input v-model="form.birthdate" type="date" class="w-full bg-[#0b0c0f] border border-[#2a2b36] rounded p-3 focus:border-[#d4b483] outline-none transition text-gray-300">
            </div>
            
            <div>
                <label class="block text-gray-400 text-xs uppercase mb-1">Nationalität</label>
                <input v-model="form.nationality" type="text" class="w-full bg-[#0b0c0f] border border-[#2a2b36] rounded p-3 focus:border-[#d4b483] outline-none transition text-white placeholder-gray-600" placeholder="Deutsch">
            </div>

            <div>
                <label class="block text-gray-400 text-xs uppercase mb-1">Geschlecht</label>
                <div class="flex gap-4">
                    <button 
                        @click="form.gender = 'm'" 
                        class="flex-1 py-3 rounded border transition font-bold"
                        :class="form.gender === 'm' ? 'bg-[#d4b483] text-black border-[#d4b483]' : 'bg-[#0b0c0f] border-[#2a2b36] text-gray-400 hover:bg-[#1a1b21]'"
                    >Männlich</button>
                    <button 
                        @click="form.gender = 'f'" 
                        class="flex-1 py-3 rounded border transition font-bold"
                        :class="form.gender === 'f' ? 'bg-[#d4b483] text-black border-[#d4b483]' : 'bg-[#0b0c0f] border-[#2a2b36] text-gray-400 hover:bg-[#1a1b21]'"
                    >Weiblich</button>
                </div>
            </div>
        </div>

        <button @click="submit" class="w-full mt-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded shadow-lg transition transform active:scale-[0.98]">
            Weiter zum Aussehen
        </button>
    </div>
    `
};
export default CharCreatorModule;
// Sci-Fi HUD Design Template - Futuristic holographic interface with cyan glow effects
export function generateSciFiHudTemplate() {
    return `
    <div class="relative w-full h-full flex justify-center overflow-hidden" :class="dualInventoryOpen ? 'items-start pt-[10vh]' : 'items-center'">
        <!-- Animated Background Data Streams -->
        <div class="absolute inset-0 opacity-35 pointer-events-none overflow-hidden">
            <div class="absolute w-full h-[0.15vh] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[scan_4s_ease-in-out_infinite]" style="top: 20%; animation-delay: 0s; box-shadow: 0 0 1vw rgba(6,182,212,0.8);"></div>
            <div class="absolute w-full h-[0.15vh] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[scan_5s_ease-in-out_infinite]" style="top: 50%; animation-delay: 1s; box-shadow: 0 0 1vw rgba(16,185,129,0.8);"></div>
            <div class="absolute w-full h-[0.15vh] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-[scan_6s_ease-in-out_infinite]" style="top: 80%; animation-delay: 2s; box-shadow: 0 0 1vw rgba(217,70,239,0.8);"></div>
        </div>
        
        <!-- Ambient Holographic Glow with Pulse -->
        <div class="absolute inset-0 blur-[5vw] opacity-45 animate-pulse" style="background: radial-gradient(circle at 30% 40%, rgba(6,182,212,0.35), transparent 50%), radial-gradient(circle at 70% 60%, rgba(16,185,129,0.3), transparent 55%), radial-gradient(circle at 50% 50%, rgba(217,70,239,0.25), transparent 60%); animation-duration: 3s;"></div>
        
        <!-- Energy Grid Background -->
        <div class="absolute inset-0 opacity-10 pointer-events-none" style="background: 
            repeating-linear-gradient(0deg, transparent 0, transparent 2vw, rgba(6,182,212,0.4) 2vw, rgba(6,182,212,0.4) calc(2vw + 1px)),
            repeating-linear-gradient(90deg, transparent 0, transparent 2vw, rgba(6,182,212,0.4) 2vw, rgba(6,182,212,0.4) calc(2vw + 1px));"></div>
        
        <!-- Main HUD Container with Hexagon Clip -->
        <div class="relative w-full h-full p-[1.5vw] flex flex-col" :class="dualInventoryOpen ? 'justify-start' : ''" style="background: linear-gradient(135deg, rgba(12,30,46,0.95), rgba(8,47,73,0.98), rgba(4,24,38,0.99)); box-shadow: inset 0 0 3vw rgba(6,182,212,0.3), 0 0 2vw rgba(6,182,212,0.5); animation: hologramFlicker 0.15s infinite alternate;">
            
            <!-- Rotating Hexagon Border -->
            <div class="absolute inset-0 opacity-40 pointer-events-none" style="background: conic-gradient(from 0deg at 50% 50%, rgba(6,182,212,0.6) 0deg, transparent 60deg, rgba(217,70,239,0.6) 180deg, transparent 240deg, rgba(34,197,94,0.6) 300deg, transparent 360deg); animation: rotate 20s linear infinite;"></div>
            
            <!-- Holographic Scanlines -->
            <div class="absolute inset-0 pointer-events-none opacity-20" style="background: repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(6,182,212,0.3) 2px, rgba(6,182,212,0.3) 4px);"></div>
            
            <!-- Corner HUD Elements -->
            <div class="absolute top-[1vw] left-[1vw] w-[3vw] h-[3vw] border-l-4 border-t-4 border-cyan-400 opacity-70" style="box-shadow: 0 0 1vw rgba(6,182,212,0.8), inset 0 0 0.5vw rgba(6,182,212,0.3);"></div>
            <div class="absolute top-[1vw] right-[1vw] w-[3vw] h-[3vw] border-r-4 border-t-4 border-cyan-400 opacity-70" style="box-shadow: 0 0 1vw rgba(6,182,212,0.8), inset 0 0 0.5vw rgba(6,182,212,0.3);"></div>
            <div class="absolute bottom-[1vw] left-[1vw] w-[3vw] h-[3vw] border-l-4 border-b-4 border-cyan-400 opacity-70" style="box-shadow: 0 0 1vw rgba(6,182,212,0.8), inset 0 0 0.5vw rgba(6,182,212,0.3);"></div>
            <div class="absolute bottom-[1vw] right-[1vw] w-[3vw] h-[3vw] border-r-4 border-b-4 border-cyan-400 opacity-70" style="box-shadow: 0 0 1vw rgba(6,182,212,0.8), inset 0 0 0.5vw rgba(6,182,212,0.3);"></div>
            
            <!-- Animated Hexagon Pattern Overlay -->
            <div class="absolute inset-[2vw] pointer-events-none opacity-10">
                <div class="w-full h-full" style="background: 
                    radial-gradient(circle at 20% 30%, transparent 0, transparent 2vw, rgba(6,182,212,0.3) 2vw, rgba(6,182,212,0.3) 2.1vw, transparent 2.1vw),
                    radial-gradient(circle at 60% 20%, transparent 0, transparent 1.5vw, rgba(16,185,129,0.3) 1.5vw, rgba(16,185,129,0.3) 1.6vw, transparent 1.6vw),
                    radial-gradient(circle at 80% 70%, transparent 0, transparent 2.5vw, rgba(217,70,239,0.3) 2.5vw, rgba(217,70,239,0.3) 2.6vw, transparent 2.6vw);"></div>
            </div>
            
            <!-- Content Grid -->
            <div class="relative z-10 grid gap-[1vw] h-full" :class="dualInventoryOpen ? 'grid-cols-3 gap-[1.5vw] items-start justify-center' : 'grid-cols-[20%_1fr_20%_8%] grid-rows-[1fr_1fr]'" :style="dualInventoryOpen ? 'grid-template-columns: 38% 38% 10%;' : ''">
                
                <!-- Wallet (top-left) - Holographic Data Panel -->
                <div v-if="!dualInventoryOpen" class="col-start-1 row-start-1 relative rounded-[0.8vw] border-2 p-[0.7vw] flex flex-col overflow-hidden" style="background: linear-gradient(135deg, rgba(6,182,212,0.08), rgba(8,47,73,0.85)); border-color: rgba(6,182,212,0.6); box-shadow: 0 0 1.5vw rgba(6,182,212,0.5), inset 0 0 1vw rgba(6,182,212,0.15);">
                    <!-- Animated Scanner Line -->
                    <div class="absolute inset-0 pointer-events-none overflow-hidden">
                        <div class="w-full h-[0.4vh] animate-[scan_3s_ease-in-out_infinite]" style="background: linear-gradient(90deg, transparent, rgba(6,182,212,0.8), transparent); box-shadow: 0 0 1vh rgba(6,182,212,0.9);"></div>
                    </div>
                    
                    <!-- Hexagon corner clips -->
                    <div class="absolute top-0 left-0 w-[1.5vw] h-[1.5vw] border-l-2 border-t-2 border-emerald-400 opacity-60" style="clip-path: polygon(0 30%, 30% 0, 0 0);"></div>
                    <div class="absolute top-0 right-0 w-[1.5vw] h-[1.5vw] border-r-2 border-t-2 border-emerald-400 opacity-60" style="clip-path: polygon(100% 0, 100% 30%, 70% 0);"></div>
                    
                    <div class="flex justify-between items-baseline mb-[0.8vh] relative z-10">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.2em] text-cyan-300" style="text-shadow: 0 0 0.5vw rgba(6,182,212,0.9);">💼 Geldbeutel</div>
                        <div class="text-[0.6vw] uppercase text-emerald-400/90" style="text-shadow: 0 0 0.4vw rgba(16,185,129,0.8);">Bargeld & ID</div>
                    </div>
                    
                    <div class="flex items-center gap-[0.6vw] p-[0.5vw] rounded-xl mb-[0.5vh] relative z-10 border border-cyan-400/40" style="background: linear-gradient(135deg, rgba(6,182,212,0.2), rgba(16,185,129,0.15)); backdrop-filter: blur(4px); box-shadow: 0 0 1vw rgba(6,182,212,0.4), inset 0 0 0.5vw rgba(6,182,212,0.1);">
                        <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.3vw] border border-cyan-400/50" style="background: radial-gradient(circle, rgba(6,182,212,0.3), rgba(4,24,38,0.8)); box-shadow: 0 0 0.8vw rgba(6,182,212,0.7), inset 0 0 0.5vw rgba(6,182,212,0.2);">💰</div>
                        <div class="flex flex-col">
                            <div class="text-[0.55vw] uppercase tracking-wider text-cyan-300/90 font-semibold" style="text-shadow: 0 0 0.3vw rgba(6,182,212,0.8);">Bargeld</div>
                            <div class="text-[1.1vw] font-bold text-emerald-300" style="text-shadow: 0 0 0.5vw rgba(16,185,129,0.9);">2.500 $</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-[0.4vw] relative z-10">
                        <div v-for="lic in licenses" :key="lic.id" class="rounded-lg border p-[0.4vw]" style="background: linear-gradient(135deg, rgba(6,182,212,0.1), rgba(8,47,73,0.7)); border-color: rgba(6,182,212,0.4); box-shadow: inset 0 0 0.5vw rgba(6,182,212,0.1); backdrop-filter: blur(2px);">
                            <div class="text-[0.6vw] font-semibold text-cyan-300" style="text-shadow: 0 0 0.4vw rgba(6,182,212,0.8);">{{ lic.label }}</div>
                            <div class="text-[0.55vw] text-cyan-200/70">{{ lic.desc }}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Second Inventory (when dual mode active) OR Stats (top-right) - Bio Monitor -->
                <div v-if="dualInventoryOpen" class="order-2 max-h-[47vh] rounded-[0.8vw] border-2 flex flex-col overflow-hidden" style="background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(8,47,73,0.85)); border-color: rgba(16,185,129,0.6); box-shadow: 0 0 1.5vw rgba(16,185,129,0.5), inset 0 0 1vw rgba(16,185,129,0.15);">
                    <div class="px-[1vw] py-[0.8vh] border-b-2 flex justify-between items-baseline" style="background: linear-gradient(90deg, rgba(8,47,73,0.9), rgba(4,24,38,0.95)); border-color: rgba(16,185,129,0.4); box-shadow: 0 0 1vw rgba(16,185,129,0.4);">
                        <div class="font-bold text-[0.75vw] uppercase tracking-[0.22em] text-cyan-200" style="text-shadow: 0 0 0.5vw rgba(16,185,129,0.8);">📦 {{ dualInventoryTitle }}</div>
                        <div class="text-[0.6vw] uppercase text-cyan-400/80" style="text-shadow: 0 0 0.4vw rgba(6,182,212,0.8);">{{ secondInventoryItems.filter(isItemDefined).length }}/50</div>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto min-h-0 p-[0.8vw] custom-scrollbar-scifi" style="scrollbar-width: thin; scrollbar-color: rgba(6,182,212,0.95) rgba(8,47,73,0.9);">
                        <div class="grid grid-cols-5 gap-[0.5vw]">
                            <div v-for="(item, index) in secondInventoryItems" :key="'second-' + index" 
                                :data-slot-index="'second-' + index"
                                @mousedown="(e) => handleMouseDown(e, 'second-' + index)"
                                @mouseenter="hoveredItem = item?.id"
                                @mouseleave="hoveredItem = null"
                                class="relative rounded-lg border-2 border-cyan-600/40 flex items-center justify-center p-[0.35vw] cursor-grab transition-all aspect-square hover:-translate-y-[0.25vh] hover:scale-105 hover:border-cyan-400"
                                :style="isItemDefined(item) ? 'background: linear-gradient(135deg, rgba(8,47,73,0.7), rgba(4,24,38,0.8));' : 'background: linear-gradient(135deg, rgba(8,47,73,0.3), rgba(4,24,38,0.5));'"
                            >
                                <span v-if="!isItemDefined(item)" class="text-cyan-950/40 text-[0.7vw] font-mono">{{ index + 1 }}</span>
                                
                                <template v-if="isItemDefined(item)">
                                    <div class="w-[2.2vw] h-[2.2vw] rounded flex items-center justify-center text-[1.5vw] z-10" style="background: rgba(8,47,73,0.5);">{{ item.emoji }}</div>
                                    <div v-if="item.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] min-w-[1.3vw] h-[1.1vw] px-[0.3vw] rounded-full text-white text-[0.65vw] font-bold flex items-center justify-center z-10" style="background: linear-gradient(90deg, rgba(16,185,129,0.95), rgba(5,150,105,0.9)); box-shadow: 0 0 0.4vw rgba(16,185,129,0.6);">
                                        {{ item.quantity }}
                                    </div>
                                    <div v-if="hoveredItem === item.id" class="absolute left-1/2 bottom-full -translate-x-1/2 mb-[0.4vh] px-[0.5vw] py-[0.3vh] rounded-lg text-[0.65vw] border whitespace-nowrap z-50 animate-[fadeIn_0.16s_ease-out]" style="background: rgba(4,24,38,0.98); color: #a7f3d0; border-color: rgba(16,185,129,0.6); box-shadow: 0 0 0.8vw rgba(16,185,129,0.5);">
                                        {{ item.name }}
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Button Column (only visible in dual mode) - Holographic style -->
                <div v-if="dualInventoryOpen" class="order-3 flex flex-col gap-[1.5vh] justify-center max-h-[47vh]">
                    <button @click="confirmDualInventory" class="w-full px-[0.8vw] py-[1.2vh] rounded-xl border-2 font-bold text-[0.7vw] uppercase tracking-wider transition-all hover:scale-105 hover:shadow-[0_0_2vw_currentColor] active:scale-95" style="background: linear-gradient(135deg, rgba(34,197,94,0.9), rgba(5,150,105,0.95)); color: #d1fae5; border-color: rgba(110,231,183,0.8); box-shadow: 0 0.5vh 1vh rgba(5,150,105,0.8), inset 0 0 1vw rgba(110,231,183,0.3), 0 0 1.5vw rgba(34,197,94,0.5); text-shadow: 0 0 0.5vw rgba(110,231,183,0.8);">
                        ✅ Bestätigen
                    </button>
                    <button @click="saveDualInventory" class="w-full px-[0.8vw] py-[1.2vh] rounded-xl border-2 font-bold text-[0.7vw] uppercase tracking-wider transition-all hover:scale-105 hover:shadow-[0_0_2vw_currentColor] active:scale-95" style="background: linear-gradient(135deg, rgba(6,182,212,0.9), rgba(8,145,178,0.95)); color: #cffafe; border-color: rgba(103,232,249,0.8); box-shadow: 0 0.5vh 1vh rgba(8,145,178,0.8), inset 0 0 1vw rgba(103,232,249,0.3), 0 0 1.5vw rgba(6,182,212,0.5); text-shadow: 0 0 0.5vw rgba(103,232,249,0.8);">
                        💾 Speichern
                    </button>
                    <button @click="clearDualInventory" class="w-full px-[0.8vw] py-[1.2vh] rounded-xl border-2 font-bold text-[0.7vw] uppercase tracking-wider transition-all hover:scale-105 hover:shadow-[0_0_2vw_currentColor] active:scale-95" style="background: linear-gradient(135deg, rgba(245,158,11,0.9), rgba(217,119,6,0.95)); color: #fef3c7; border-color: rgba(252,211,77,0.8); box-shadow: 0 0.5vh 1vh rgba(217,119,6,0.8), inset 0 0 1vw rgba(252,211,77,0.3), 0 0 1.5vw rgba(245,158,11,0.5); text-shadow: 0 0 0.5vw rgba(252,211,77,0.8);">
                        🗑️ Leeren
                    </button>
                    <button @click="closeDualInventory" class="w-full px-[0.8vw] py-[1.2vh] rounded-xl border-2 font-bold text-[0.7vw] uppercase tracking-wider transition-all hover:scale-105 hover:shadow-[0_0_2vw_currentColor] active:scale-95" style="background: linear-gradient(135deg, rgba(8,47,73,0.85), rgba(7,89,133,0.95)); color: #fca5a5; border-color: rgba(239,68,68,0.6); box-shadow: 0 0.5vh 1vh rgba(127,29,29,0.5), inset 0 0 1vw rgba(239,68,68,0.2), 0 0 1.5vw rgba(239,68,68,0.4); text-shadow: 0 0 0.5vw rgba(239,68,68,0.8);">
                        ❌ Abbrechen
                    </button>
                </div>
                
                <!-- Stats (top-right) - Bio Monitor - Only visible when dual mode inactive -->
                <div v-else class="col-start-3 row-start-1 rounded-[0.8vw] border-2 p-[0.7vw] flex flex-col gap-[0.5vh] overflow-hidden" style="background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(8,47,73,0.85)); border-color: rgba(16,185,129,0.6); box-shadow: 0 0 1.5vw rgba(16,185,129,0.5), inset 0 0 1vw rgba(16,185,129,0.15);">
                    <!-- Pulse Animation -->
                    <div class="absolute top-0 right-0 w-[2vw] h-[2vw] rounded-full animate-pulse" style="background: radial-gradient(circle, rgba(16,185,129,0.4), transparent); box-shadow: 0 0 1vw rgba(16,185,129,0.6);"></div>
                    
                    <div class="flex justify-between items-baseline mb-[0.3vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.22em] text-emerald-300" style="text-shadow: 0 0 0.5vw rgba(16,185,129,0.9);">📊 Status</div>
                        <div class="text-[0.6vw] uppercase text-emerald-400/80 animate-pulse" style="text-shadow: 0 0 0.4vw rgba(16,185,129,0.8);">Live</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-[0.5vw]">
                        <div v-for="stat in stats" :key="stat.name" class="rounded-lg border p-[0.4vw]" style="background: linear-gradient(135deg, rgba(8,47,73,0.7), rgba(4,24,38,0.8)); border-color: rgba(16,185,129,0.3); backdrop-filter: blur(2px); box-shadow: inset 0 0 0.5vw rgba(16,185,129,0.05);">
                            <div class="text-[0.6vw] uppercase tracking-wide text-emerald-300/90" style="text-shadow: 0 0 0.3vw rgba(16,185,129,0.7);">{{ stat.name }}</div>
                            <div class="flex justify-between items-baseline">
                                <div class="text-[0.8vw] font-semibold text-emerald-200" style="text-shadow: 0 0 0.4vw rgba(16,185,129,0.8);">{{ stat.value }}</div>
                                <div class="text-[0.6vw] text-emerald-400/60">/ {{ stat.max }}</div>
                            </div>
                            <div class="h-[0.4vh] rounded-full mt-[0.4vh] overflow-hidden border border-emerald-900/40" style="background: rgba(4,24,38,0.9); box-shadow: inset 0 0 0.3vw rgba(0,0,0,0.8);">
                                <div class="h-full rounded-full transition-all" :style="{ width: (stat.value / stat.max * 100) + '%', background: stat.color, boxShadow: '0 0 0.8vh currentColor' }"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-[0.4vh] rounded-lg px-[0.5vw] py-[0.4vh] flex justify-between items-center border" style="background: linear-gradient(90deg, rgba(6,182,212,0.15), rgba(16,185,129,0.15)); border-color: rgba(6,182,212,0.4); box-shadow: 0 0 0.8vw rgba(6,182,212,0.3), inset 0 0 0.5vw rgba(6,182,212,0.1);">
                        <div>
                            <div class="text-[0.7vw] text-cyan-300 font-semibold" style="text-shadow: 0 0 0.4vw rgba(6,182,212,0.9);">24.5 / 50.0 kg</div>
                            <div class="text-[0.55vw] uppercase tracking-wide text-cyan-200/80">⚖️ Gewicht</div>
                        </div>
                        <div class="text-[0.6vw] uppercase tracking-wider text-emerald-400 font-bold" style="text-shadow: 0 0 0.5vw rgba(16,185,129,0.9);">OK</div>
                    </div>
                </div>
                
                <!-- Keys (bottom-left) - Access Terminal -->
                <div class="col-start-1 row-start-2 relative rounded-[0.8vw] border-2 p-[0.7vw] flex flex-col overflow-hidden" style="background: linear-gradient(135deg, rgba(217,70,239,0.08), rgba(8,47,73,0.85)); border-color: rgba(217,70,239,0.6); box-shadow: 0 0 1.5vw rgba(217,70,239,0.5), inset 0 0 1vw rgba(217,70,239,0.15);">
                    <!-- Data stream effect -->
                    <div class="absolute inset-0 pointer-events-none opacity-20" style="background: repeating-linear-gradient(90deg, transparent 0, transparent 1vw, rgba(217,70,239,0.3) 1vw, rgba(217,70,239,0.3) calc(1vw + 1px)); animation: dataStream 2s linear infinite;"></div>
                    
                    <div class="flex justify-between items-baseline mb-[0.5vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.22em] text-purple-300" style="text-shadow: 0 0 0.5vw rgba(217,70,239,0.9);">🔑 Schlüssel</div>
                        <div class="text-[0.6vw] uppercase text-purple-400/80" style="text-shadow: 0 0 0.4vw rgba(217,70,239,0.8);">{{ keys.length }} Stk</div>
                    </div>
                    
                    <div class="flex flex-col gap-[0.4vw] mt-[0.3vh]">
                        <div v-for="(k, i) in keys" :key="i" class="flex items-center gap-[0.5vw] px-[0.5vw] py-[0.4vh] rounded-full border" style="background: linear-gradient(90deg, rgba(217,70,239,0.15), rgba(8,47,73,0.7)); border-color: rgba(217,70,239,0.4); box-shadow: 0 0 0.8vw rgba(217,70,239,0.3), inset 0 0 0.5vw rgba(217,70,239,0.1);">
                            <div class="w-[1.7vw] h-[1.7vw] rounded-full flex items-center justify-center text-[0.95vw] border border-purple-400/50" style="background: radial-gradient(circle, rgba(217,70,239,0.4), rgba(8,47,73,0.9)); box-shadow: 0 0 0.6vw rgba(217,70,239,0.8), inset 0 0 0.3vw rgba(217,70,239,0.2);">{{ k.icon }}</div>
                            <div class="text-[0.65vw] text-purple-300" style="text-shadow: 0 0 0.4vw rgba(217,70,239,0.7);">{{ k.name }}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Main inventory (center) - Storage Matrix -->
                <div :class="dualInventoryOpen ? 'order-1 max-h-[47vh]' : 'col-start-2 row-start-1 row-span-2'" class="rounded-[0.8vw] border-2 flex flex-col overflow-hidden" style="background: linear-gradient(135deg, rgba(6,182,212,0.05), rgba(4,24,38,0.95)); border-color: rgba(6,182,212,0.7); box-shadow: 0 0 2vw rgba(6,182,212,0.6), inset 0 0 1.5vw rgba(6,182,212,0.1);">
                    <div class="px-[1vw] py-[0.8vh] border-b-2 flex justify-between items-baseline" style="background: linear-gradient(90deg, rgba(8,47,73,0.95), rgba(12,30,46,0.98)); border-color: rgba(6,182,212,0.5); box-shadow: 0 0 1vw rgba(6,182,212,0.4);">
                        <div class="font-bold text-[0.75vw] uppercase tracking-[0.22em] text-cyan-300" style="text-shadow: 0 0 0.5vw rgba(6,182,212,1);">🎒 Inventar</div>
                        <div class="text-[0.6vw] uppercase text-cyan-400/80" style="text-shadow: 0 0 0.4vw rgba(6,182,212,0.8);">50 Slots • {{ inventoryItems.filter(isItemDefined).length }} belegt</div>
                    </div>
                    
                    <!-- Custom Scrollbar: Cyber theme -->
                    <div class="flex-1 overflow-y-auto min-h-0 custom-scrollbar-scifi" :class="dualInventoryOpen ? 'p-[0.8vw]' : 'p-[1vw]'" style="scrollbar-width: thin; scrollbar-color: rgba(6,182,212,0.95) rgba(8,47,73,0.9);">
                        <div class="grid" :class="dualInventoryOpen ? 'grid-cols-5 gap-[0.5vw]' : 'grid-cols-5 gap-[0.6vw]'">
                            <div v-for="(item, index) in inventoryItems" :key="index" 
                                :data-slot-index="index"
                                :class="[
                                    'relative rounded-lg border flex items-center justify-center cursor-grab transition-all aspect-square',
                                    dualInventoryOpen ? 'p-[0.35vw]' : 'p-[0.4vw]',
                                    index < 5 ? 'border-2 !border-cyan-400 shadow-[0_0_0_0.1vw_rgba(6,182,212,0.8),0_0_1vw_rgba(6,182,212,0.6)]' : 'border-2 border-cyan-900/40',
                                    !isItemDefined(item) ? 'empty' : '',
                                    selectedItem === item?.id ? '!border-emerald-300 shadow-[0_0_0_0.15vw_#10b981,0_0_1.5vw_rgba(16,185,129,0.9)]' : '',
                                    isItemDefined(item) ? 'hover:-translate-y-[0.25vh] hover:scale-105 hover:shadow-[0_0_1.5vw_rgba(6,182,212,0.95)] hover:border-cyan-300' : ''
                                ]"
                                :style="isItemDefined(item) ? 'background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(8,47,73,0.9));' : 'background: linear-gradient(135deg, rgba(8,47,73,0.5), rgba(4,24,38,0.7));'"
                                @mousedown="(e) => handleMouseDown(e, index)"
                                @click="selectedItem = selectedItem === item?.id ? null : item?.id"
                                @mouseenter="hoveredItem = item?.id"
                                @mouseleave="hoveredItem = null"
                            >
                                <!-- Hotbar Number (1-5) with holographic effect -->
                                <div v-if="index < 5" class="absolute top-[0.2vh] left-[0.3vw] w-[1.2vw] h-[1.2vw] rounded-md text-cyan-950 text-[0.7vw] font-bold flex items-center justify-center z-10 border border-cyan-400/60" style="background: radial-gradient(circle, rgba(6,182,212,0.95), rgba(16,185,129,0.85)); box-shadow: 0 0 0.8vw rgba(6,182,212,0.9), inset 0 0 0.3vw rgba(255,255,255,0.3);">
                                    {{ index + 1 }}
                                </div>

                                <span v-if="!isItemDefined(item)" class="text-cyan-900/30 text-[0.7vw] font-mono">{{ index + 1 }}</span>
                                
                                <template v-if="isItemDefined(item)">
                                    <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw] z-10 border border-cyan-500/30" style="background: rgba(8,47,73,0.6); box-shadow: inset 0 0 0.5vw rgba(6,182,212,0.2);">{{ item.emoji }}</div>
                                    <div v-if="item.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] min-w-[1.3vw] h-[1.1vw] px-[0.3vw] rounded-full text-cyan-950 text-[0.65vw] font-bold flex items-center justify-center z-10 border border-cyan-400/60" style="background: linear-gradient(90deg, rgba(6,182,212,0.95), rgba(16,185,129,0.9)); box-shadow: 0 0 0.8vw rgba(6,182,212,0.8), inset 0 0 0.3vw rgba(255,255,255,0.4);">
                                        {{ item.quantity }}
                                    </div>
                                    <div v-if="hoveredItem === item.id" class="absolute left-1/2 bottom-full -translate-x-1/2 mb-[0.4vh] px-[0.5vw] py-[0.3vh] rounded-lg text-[0.65vw] border whitespace-nowrap z-50 animate-[fadeIn_0.16s_ease-out]" style="background: rgba(8,47,73,0.98); color: #a5f3fc; border-color: rgba(6,182,212,0.7); box-shadow: 0 0 1vw rgba(6,182,212,0.8), inset 0 0 0.5vw rgba(6,182,212,0.2);">
                                        {{ item.name }}
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Equipment Slots (bottom-right) - Command Terminal - Only visible when dual mode inactive -->
                <div v-if="!dualInventoryOpen" class="col-start-3 row-start-2 rounded-[0.8vw] border-2 p-[0.7vw] flex flex-col overflow-hidden" style="background: linear-gradient(135deg, rgba(6,182,212,0.08), rgba(8,47,73,0.85)); border-color: rgba(6,182,212,0.6); box-shadow: 0 0 1.5vw rgba(6,182,212,0.5), inset 0 0 1vw rgba(6,182,212,0.15);">
                    <div class="flex justify-between items-baseline mb-[0.8vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.22em] text-cyan-300" style="text-shadow: 0 0 0.5vw rgba(6,182,212,0.9);">🎫 Ausrüstung</div>
                        <div class="text-[0.6vw] uppercase text-cyan-400/80" style="text-shadow: 0 0 0.4vw rgba(6,182,212,0.8);">Slots</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-[0.8vw] flex-1">
                        <div data-equipment-slot="vest" @mousedown="handleEquipmentMouseDown($event, 'vest')" class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-[0.3vh] transition-all hover:border-cyan-400 hover:shadow-[0_0_1vw_rgba(6,182,212,0.8)] cursor-pointer relative" style="background: rgba(6,182,212,0.05); border-color: rgba(6,182,212,0.4); box-shadow: 0 0 0.5vw rgba(6,182,212,0.3);">
                            <template v-if="equipmentSlots.vest">
                                <span class="text-[1.8vw]">{{ equipmentSlots.vest.emoji }}</span>
                                <span v-if="equipmentSlots.vest.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] bg-cyan-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.vest.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.8vw]">🦺</span>
                                <span class="text-[0.5vw] uppercase text-cyan-300/90" style="text-shadow: 0 0 0.3vw rgba(6,182,212,0.7);">Weste</span>
                            </template>
                        </div>
                        <div data-equipment-slot="weapon" @mousedown="handleEquipmentMouseDown($event, 'weapon')" class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-[0.3vh] transition-all hover:border-cyan-400 hover:shadow-[0_0_1vw_rgba(6,182,212,0.8)] cursor-pointer relative" style="background: rgba(6,182,212,0.05); border-color: rgba(6,182,212,0.4); box-shadow: 0 0 0.5vw rgba(6,182,212,0.3);">
                            <template v-if="equipmentSlots.weapon">
                                <span class="text-[1.8vw]">{{ equipmentSlots.weapon.emoji }}</span>
                                <span v-if="equipmentSlots.weapon.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] bg-cyan-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.weapon.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.8vw]">🔫</span>
                                <span class="text-[0.5vw] uppercase text-cyan-300/90" style="text-shadow: 0 0 0.3vw rgba(6,182,212,0.7);">Waffe</span>
                            </template>
                        </div>
                        <div data-equipment-slot="bag1" @mousedown="handleEquipmentMouseDown($event, 'bag1')" class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-[0.3vh] transition-all hover:border-cyan-400 hover:shadow-[0_0_1vw_rgba(6,182,212,0.8)] cursor-pointer relative" style="background: rgba(6,182,212,0.05); border-color: rgba(6,182,212,0.4); box-shadow: 0 0 0.5vw rgba(6,182,212,0.3);">
                            <template v-if="equipmentSlots.bag1">
                                <span class="text-[1.8vw]">{{ equipmentSlots.bag1.emoji }}</span>
                                <span v-if="equipmentSlots.bag1.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] bg-cyan-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.bag1.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.8vw]">👜</span>
                                <span class="text-[0.5vw] uppercase text-cyan-300/90" style="text-shadow: 0 0 0.3vw rgba(6,182,212,0.7);">Tasche 1</span>
                            </template>
                        </div>
                        <div data-equipment-slot="bag2" @mousedown="handleEquipmentMouseDown($event, 'bag2')" class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-[0.3vh] transition-all hover:border-cyan-400 hover:shadow-[0_0_1vw_rgba(6,182,212,0.8)] cursor-pointer relative" style="background: rgba(6,182,212,0.05); border-color: rgba(6,182,212,0.4); box-shadow: 0 0 0.5vw rgba(6,182,212,0.3);">
                            <template v-if="equipmentSlots.bag2">
                                <span class="text-[1.8vw]">{{ equipmentSlots.bag2.emoji }}</span>
                                <span v-if="equipmentSlots.bag2.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] bg-cyan-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.bag2.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.8vw]">🎒</span>
                                <span class="text-[0.5vw] uppercase text-cyan-300/90" style="text-shadow: 0 0 0.3vw rgba(6,182,212,0.7);">Tasche 2</span>
                            </template>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Action Bar (rechts, beide Reihen) - Hidden when dual mode active -->
                <div v-if="!dualInventoryOpen" class="col-start-4 row-span-2 rounded-[1.3vw] border-2 p-[0.7vw] flex flex-col gap-[0.8vw] justify-center overflow-hidden" style="background: linear-gradient(135deg, rgba(8,47,73,0.95), rgba(4,24,38,0.98)); border-color: rgba(6,182,212,0.6); box-shadow: 0 0 1.5vw rgba(6,182,212,0.3), inset 0 0 1vw rgba(6,182,212,0.1);">
                    <div class="flex justify-center mb-[0.5vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.16em] text-cyan-300" style="text-shadow: 0 0 0.6vw rgba(6,182,212,0.8);">⚡ Quick Actions</div>
                    </div>
                    <button @click="openClothing" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(8,47,73,0.95), rgba(4,24,38,0.98)); border-color: rgba(6,182,212,0.6); box-shadow: 0 0 1.5vw rgba(6,182,212,0.4), inset 0 0 1vw rgba(6,182,212,0.15);">
                        <span class="text-[2vw]">👔</span>
                    </button>
                    <button @click="openGlovebox" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(8,47,73,0.95), rgba(4,24,38,0.98)); border-color: rgba(6,182,212,0.6); box-shadow: 0 0 1.5vw rgba(6,182,212,0.4), inset 0 0 1vw rgba(6,182,212,0.15);">
                        <span class="text-[2vw]">🧤</span>
                    </button>
                    <button @click="openTrunk" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(8,47,73,0.95), rgba(4,24,38,0.98)); border-color: rgba(6,182,212,0.6); box-shadow: 0 0 1.5vw rgba(6,182,212,0.4), inset 0 0 1vw rgba(6,182,212,0.15);">
                        <span class="text-[2vw]">🚗</span>
                    </button>
                    <button @click="openGround" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(8,47,73,0.95), rgba(4,24,38,0.98)); border-color: rgba(6,182,212,0.6); box-shadow: 0 0 1.5vw rgba(6,182,212,0.4), inset 0 0 1vw rgba(6,182,212,0.15);">
                        <span class="text-[2vw]">🌍</span>
                    </button>
                    <button @click="toggleGiveMode" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(8,47,73,0.95), rgba(4,24,38,0.98)); border-color: rgba(6,182,212,0.6); box-shadow: 0 0 1.5vw rgba(6,182,212,0.4), inset 0 0 1vw rgba(6,182,212,0.15);">
                        <span class="text-[2vw]">🤝</span>
                    </button>
                    <button @click="toggleSettings()" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(8,47,73,0.95), rgba(4,24,38,0.98)); border-color: rgba(6,182,212,0.6); box-shadow: 0 0 1.5vw rgba(6,182,212,0.4), inset 0 0 1vw rgba(6,182,212,0.15);">
                        <span class="text-[2vw]">⚙️</span>
                    </button>
                    <button @click="handleClose" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(139,0,0,0.95), rgba(90,0,0,0.98)); border-color: rgba(220,38,38,0.6); box-shadow: 0 0 1.5vw rgba(220,38,38,0.4);">
                        <span class="text-[1.8vw] text-red-300 font-bold">✕</span>
                    </button>
                </div>
                
            </div>
        </div>
    </div>
    `;
}

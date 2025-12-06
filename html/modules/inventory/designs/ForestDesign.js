// Forest Design Template - Immersive woodland experience with trees, wood, moss, and nature
export function generateForestTemplate() {
    return `
    <div class="relative rounded-[2.5vw] w-full h-full flex justify-center items-center overflow-hidden">
        <!-- Mystical Forest Atmosphere with Magic Glow -->
        <div class="absolute inset-0 blur-[3vw] opacity-60 animate-pulse" style="background: radial-gradient(circle at 30% 40%, rgba(52,211,153,0.25), transparent 45%), radial-gradient(circle at 70% 60%, rgba(34,197,94,0.22), transparent 50%), radial-gradient(circle at 50% 80%, rgba(101,163,13,0.28), transparent 55%), radial-gradient(circle at 80% 30%, rgba(74,222,128,0.15), transparent 50%); animation-duration: 4s;"></div>
        
        <!-- Ancient Tree Trunk Frame -->
        <div class="relative rounded-[2.5vw] shadow-[0_2vw_4vw_rgba(0,0,0,0.95),inset_0_0_2vw_rgba(0,0,0,0.8)] border-4 p-[1.5vw] flex flex-col" :class="dualInventoryOpen ? 'w-[90vw] h-[64vh]' : 'w-full h-full'" style="background: linear-gradient(165deg, #3d2817 0%, #2d1810 15%, #1a0f08 35%, #0d0604 60%, #1a0f08 85%, #2d1810 100%), repeating-linear-gradient(90deg, rgba(61,40,23,0.3) 0px, rgba(61,40,23,0.3) 2px, transparent 2px, transparent 8vw); border-color: #4a3728;">
            
            <!-- Realistic Wood Bark Texture with rings -->
            <div class="absolute inset-[1.5vw] rounded-[2vw] pointer-events-none" style="background: 
                repeating-linear-gradient(90deg, rgba(92,64,51,0.4) 0, rgba(92,64,51,0.4) 0.15vw, transparent 0.15vw, transparent 0.8vw),
                repeating-linear-gradient(180deg, rgba(61,40,23,0.15) 0, rgba(61,40,23,0.15) 0.1vw, transparent 0.1vw, transparent 1.5vh),
                repeating-radial-gradient(circle at 50% 50%, rgba(74,51,36,0.2) 0, rgba(74,51,36,0.2) 0.2vw, transparent 0.2vw, transparent 3vw);
                opacity: 0.6;"></div>
            
            <!-- Moss patches growing on wood -->
            <div class="absolute top-[3vh] left-[2vw] w-[8vw] h-[6vh] rounded-[2vw] opacity-30 blur-[0.5vw]" style="background: radial-gradient(ellipse, rgba(34,197,94,0.6), transparent 70%); animation: pulse 4s ease-in-out infinite;"></div>
            <div class="absolute bottom-[5vh] right-[3vw] w-[6vw] h-[5vh] rounded-[1.5vw] opacity-25 blur-[0.4vw]" style="background: radial-gradient(ellipse, rgba(52,211,153,0.5), transparent 65%); animation: pulse 5s ease-in-out infinite; animation-delay: 1s;"></div>
            <div class="absolute top-[50%] left-[1vw] w-[4vw] h-[8vh] rounded-[1vw] opacity-20 blur-[0.3vw]" style="background: radial-gradient(ellipse, rgba(74,222,128,0.4), transparent 60%); animation: pulse 3.5s ease-in-out infinite; animation-delay: 2s;"></div>
            
            <!-- Floating Magic Particles -->
            <div class="absolute top-[20%] left-[15%] w-[0.5vw] h-[0.5vw] rounded-full bg-emerald-400 opacity-70" style="box-shadow: 0 0 1vw rgba(52,211,153,0.8); animation: float 8s ease-in-out infinite;"></div>
            <div class="absolute top-[60%] right-[20%] w-[0.4vw] h-[0.4vw] rounded-full bg-green-400 opacity-60" style="box-shadow: 0 0 0.8vw rgba(34,197,94,0.7); animation: float 6s ease-in-out infinite; animation-delay: 1.5s;"></div>
            <div class="absolute top-[40%] left-[70%] w-[0.6vw] h-[0.6vw] rounded-full bg-lime-400 opacity-65" style="box-shadow: 0 0 1.2vw rgba(101,163,13,0.8); animation: float 7s ease-in-out infinite; animation-delay: 3s;"></div>
            
            <!-- Hanging Vines and Leaves -->
            <div class="absolute top-0 left-[15%] text-[2vw] opacity-40 pointer-events-none animate-[swing_4s_ease-in-out_infinite]" style="filter: drop-shadow(0 0.2vh 0.4vh rgba(0,0,0,0.5))">🌿</div>
            <div class="absolute top-0 right-[25%] text-[1.8vw] opacity-35 pointer-events-none animate-[swing_5s_ease-in-out_infinite_0.5s]" style="filter: drop-shadow(0 0.2vh 0.4vh rgba(0,0,0,0.5))">🍃</div>
            <div class="absolute top-0 left-[60%] text-[2.2vw] opacity-30 pointer-events-none animate-[swing_4.5s_ease-in-out_infinite_1s]" style="filter: drop-shadow(0 0.2vh 0.4vh rgba(0,0,0,0.5))">🌱</div>
            
            <!-- Small mushrooms at bottom -->
            <div class="absolute bottom-[1vh] left-[10%] text-[1.5vw] opacity-50 pointer-events-none">🍄</div>
            <div class="absolute bottom-[1.5vh] right-[15%] text-[1.2vw] opacity-45 pointer-events-none">🍄</div>
            <div class="absolute bottom-[1vh] left-[45%] text-[1vw] opacity-40 pointer-events-none">🍄</div>
            
            <!-- Fireflies / Light particles -->
            <div class="absolute top-[20%] right-[10%] w-[0.3vw] h-[0.3vw] rounded-full bg-emerald-300 opacity-60 animate-[pulse_3s_ease-in-out_infinite] blur-[0.1vw]" style="box-shadow: 0 0 1vw rgba(52,211,153,0.8);"></div>
            <div class="absolute top-[60%] left-[12%] w-[0.25vw] h-[0.25vw] rounded-full bg-lime-300 opacity-50 animate-[pulse_4s_ease-in-out_infinite_1s] blur-[0.1vw]" style="box-shadow: 0 0 0.8vw rgba(132,204,22,0.7);"></div>
            <div class="absolute top-[35%] right-[25%] w-[0.2vw] h-[0.2vw] rounded-full bg-green-300 opacity-55 animate-[pulse_3.5s_ease-in-out_infinite_0.5s] blur-[0.1vw]" style="box-shadow: 0 0 0.9vw rgba(74,222,128,0.7);"></div>
            
            <!-- Content Grid (Dynamic based on mode) -->
            <div class="relative z-10 grid h-full" 
                :class="dualInventoryOpen ? 'gap-[1vw]' : 'grid-cols-[20%_1fr_20%_8%] grid-rows-[1fr_1fr] gap-[1vw]'"
                :style="dualInventoryOpen ? 'grid-template-columns: 45% 45% 8%; grid-template-rows: 1fr auto;' : ''">
                
                    <!-- Wallet (top-left) - Birch bark pouch - Hidden in dual mode -->
                <div v-if="!dualInventoryOpen" class="col-start-1 row-start-1 relative rounded-[1.3vw] shadow-[0_0.8vw_1.7vw_rgba(0,0,0,0.85),inset_0_0.3vh_0.6vh_rgba(255,255,255,0.1)] border-2 p-[0.7vw] flex flex-col overflow-hidden" style="background: linear-gradient(135deg, #d4c5b0 0%, #e8dcc8 20%, #d4c5b0 40%, #c4b5a0 60%, #d4c5b0 80%, #e8dcc8 100%), repeating-linear-gradient(90deg, rgba(61,40,23,0.15) 0, rgba(61,40,23,0.15) 0.1vw, transparent 0.1vw, transparent 0.5vw); border-color: rgba(139,116,91,0.8);">
                    <!-- Moss accent corner -->
                    <div class="absolute top-0 right-0 w-[2vw] h-[2vh] rounded-bl-xl opacity-40" style="background: radial-gradient(ellipse at top right, rgba(34,197,94,0.6), transparent 70%);"></div>
                    
                    <div class="flex justify-between items-baseline mb-[0.8vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.16em] text-stone-700" style="text-shadow: 0 1px 2px rgba(255,255,255,0.3);">🌰 Geldbeutel</div>
                        <div class="text-[0.6vw] uppercase text-stone-600">Bargeld & Lizenzen</div>
                    </div>
                    
                    <div class="flex items-center gap-[0.6vw] p-[0.5vw] rounded-xl shadow-[0_0.4vh_0.8vh_rgba(0,0,0,0.7),inset_0_1px_3px_rgba(255,255,255,0.2)] mb-[0.5vh]" style="background: linear-gradient(135deg, rgba(34,197,94,0.85) 0%, rgba(22,163,74,0.9) 50%, rgba(34,197,94,0.85) 100%); backdrop-filter: blur(4px);">
                        <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.3vw]" style="background: radial-gradient(circle, rgba(255,255,255,0.25), rgba(0,0,0,0.2)); box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);">💰</div>
                        <div class="flex flex-col">
                            <div class="text-[0.55vw] uppercase tracking-wider text-emerald-950/80">Bargeld</div>
                            <div class="text-[1.1vw] font-bold text-white" style="text-shadow: 0 2px 4px rgba(0,0,0,0.5);">2.500 $</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-[0.4vw]">
                        <div v-for="lic in licenses" :key="lic.id" class="rounded-lg border p-[0.4vw]" style="background: linear-gradient(135deg, rgba(245,237,220,0.95), rgba(226,217,200,0.9)); border-color: rgba(139,116,91,0.6); box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
                            <div class="text-[0.6vw] font-semibold text-stone-800">{{ lic.label }}</div>
                            <div class="text-[0.55vw] text-stone-600">{{ lic.desc }}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Second Inventory (when dual mode active) OR Stats (top-right) - Moss-covered stone tablet -->
                <div v-if="dualInventoryOpen" class="row-start-1 row-span-2 col-start-2 rounded-[1.3vw] shadow-[0_0.8vw_1.6vw_rgba(0,0,0,0.95),inset_0_0.5vh_1vh_rgba(0,0,0,0.7)] border-2 flex flex-col overflow-hidden" style="background: linear-gradient(135deg, #14532d 0%, #052e16 25%, #14532d 50%, #052e16 75%, #14532d 100%), repeating-linear-gradient(45deg, rgba(34,197,94,0.2) 0, rgba(34,197,94,0.2) 0.3vw, transparent 0.3vw, transparent 0.8vw); border-color: rgba(34,197,94,0.5);">
                    <div class="px-[1vw] py-[0.8vh] border-b-2 flex justify-between items-baseline" style="background: linear-gradient(90deg, rgba(20,83,45,0.9), rgba(5,46,22,0.95)); border-color: rgba(34,197,94,0.3); box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
                        <div class="font-bold text-[0.75vw] uppercase tracking-[0.22em] text-emerald-300" style="text-shadow: 0 2px 4px rgba(0,0,0,0.8);">📦 {{ dualInventoryTitle }}</div>
                        <div class="text-[0.6vw] uppercase text-emerald-400/80">{{ secondInventoryItems.filter(isItemDefined).length }}/{{ secondInventoryItems.length }}</div>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto min-h-0 p-[0.5vw] custom-scrollbar-forest" style="scrollbar-width: thin; scrollbar-color: rgba(34,197,94,0.95) rgba(20,83,45,0.9);">
                        <div class="grid grid-cols-5 gap-[0.4vw] auto-rows-min">
                            <div v-for="(item, index) in secondInventoryItems" :key="'second-' + index" 
                                :data-slot-index="'second-' + index"
                                @mousedown="(e) => handleMouseDown(e, 'second-' + index)"
                                @contextmenu.prevent="(e) => openContextMenu(e, item, 'second-' + index)"
                                @mouseenter="hoveredItem = item?.id"
                                @mouseleave="hoveredItem = null"
                                class="relative rounded-lg border-2 border-emerald-600/40 flex items-center justify-center p-[0.35vw] cursor-grab transition-all hover:-translate-y-[0.25vh] hover:scale-105 hover:border-emerald-400"
                                style="aspect-ratio: 1/1; width: 100%;"
                                :style="isItemDefined(item) ? 'background: linear-gradient(135deg, rgba(20,83,45,0.7), rgba(5,46,22,0.8));' : 'background: linear-gradient(135deg, rgba(20,83,45,0.3), rgba(5,46,22,0.5));'"
                            >
                                <span v-if="!isItemDefined(item)" class="text-emerald-950/40 text-[0.7vw] font-mono">{{ index + 1 }}</span>
                                
                                <template v-if="isItemDefined(item)">
                                    <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw] z-10" style="background: rgba(20,83,45,0.6);">{{ item.emoji }}</div>
                                    <div v-if="item.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] min-w-[1.3vw] h-[1.1vw] px-[0.3vw] rounded-full text-white text-[0.65vw] font-bold flex items-center justify-center z-10" style="background: linear-gradient(90deg, rgba(34,197,94,0.9), rgba(22,163,74,0.95)); box-shadow: 0 0 0.4vw rgba(34,197,94,0.6);">
                                        {{ item.quantity }}
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Equipment Bar (horizontal strip below player inventory only) -->
                <div v-if="dualInventoryOpen" class="row-start-2 col-start-1 rounded-[1vw] shadow-[0_0.5vw_1vw_rgba(0,0,0,0.9),inset_0_0.3vh_0.6vh_rgba(0,0,0,0.6)] border-2 p-[0.5vw] flex flex-col overflow-hidden" style="background: linear-gradient(135deg, #6b4423 0%, #8b5a3c 20%, #6b4423 50%, #8b5a3c 80%, #6b4423 100%); border-color: rgba(107,68,35,0.8);">
                    <div class="flex justify-between items-baseline mb-[0.5vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.16em] text-amber-200" style="text-shadow: 0 2px 3px rgba(0,0,0,0.7);">🎫 Ausrüstung</div>
                        <div class="text-[0.6vw] uppercase text-amber-300/80">4 Slots</div>
                    </div>
                    
                    <div class="grid grid-cols-4 gap-[0.4vw]">
                        <div data-equipment-slot="vest" @mousedown="handleEquipmentMouseDown($event, 'vest')" class="rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-[0.35vw] transition-all hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer relative" style="aspect-ratio: 1/1; background: rgba(34,197,94,0.05); border-color: rgba(52,211,153,0.4);">
                            <template v-if="equipmentSlots.vest">
                                <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw]" style="background: rgba(107,68,35,0.6);">{{ equipmentSlots.vest.emoji }}</div>
                                <span v-if="equipmentSlots.vest.quantity > 1" class="absolute top-[0.2vh] right-[0.3vw] bg-emerald-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.vest.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.5vw]">🦺</span>
                                <span class="text-[0.5vw] uppercase text-amber-50/90">Weste</span>
                            </template>
                        </div>
                        <div data-equipment-slot="weapon" @mousedown="handleEquipmentMouseDown($event, 'weapon')" class="rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-[0.35vw] transition-all hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer relative" style="aspect-ratio: 1/1; background: rgba(34,197,94,0.05); border-color: rgba(52,211,153,0.4);">
                            <template v-if="equipmentSlots.weapon">
                                <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw]" style="background: rgba(107,68,35,0.6);">{{ equipmentSlots.weapon.emoji }}</div>
                                <span v-if="equipmentSlots.weapon.quantity > 1" class="absolute top-[0.2vh] right-[0.3vw] bg-emerald-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.weapon.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.5vw]">🔫</span>
                                <span class="text-[0.5vw] uppercase text-amber-50/90">Waffe</span>
                            </template>
                        </div>
                        <div data-equipment-slot="bag1" @mousedown="handleEquipmentMouseDown($event, 'bag1')" class="rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-[0.35vw] transition-all hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer relative" style="aspect-ratio: 1/1; background: rgba(52,211,153,0.05); border-color: rgba(52,211,153,0.4);">
                            <template v-if="equipmentSlots.bag1">
                                <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw]" style="background: rgba(107,68,35,0.6);">{{ equipmentSlots.bag1.emoji }}</div>
                                <span v-if="equipmentSlots.bag1.quantity > 1" class="absolute top-[0.2vh] right-[0.3vw] bg-emerald-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.bag1.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.5vw]">👜</span>
                                <span class="text-[0.5vw] uppercase text-emerald-100/90">Tasche 1</span>
                            </template>
                        </div>
                        <div data-equipment-slot="bag2" @mousedown="handleEquipmentMouseDown($event, 'bag2')" class="rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-[0.35vw] transition-all hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer relative" style="aspect-ratio: 1/1; background: rgba(52,211,153,0.05); border-color: rgba(52,211,153,0.4);">
                            <template v-if="equipmentSlots.bag2">
                                <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw]" style="background: rgba(107,68,35,0.6);">{{ equipmentSlots.bag2.emoji }}</div>
                                <span v-if="equipmentSlots.bag2.quantity > 1" class="absolute top-[0.2vh] right-[0.3vw] bg-emerald-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.bag2.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.5vw]">🎒</span>
                                <span class="text-[0.5vw] uppercase text-emerald-100/90">Tasche 2</span>
                            </template>
                        </div>
                    </div>
                </div>
                
                <!-- Button Column (only visible in dual mode) -->
                <div v-if="dualInventoryOpen" class="row-start-1 row-span-2 col-start-3 flex flex-col gap-[1vh] justify-end">
                    <!-- Bargeld Anzeige -->
                    <div class="w-full rounded-lg border-2 p-[0.4vw] flex flex-col items-center gap-[0.3vh]" style="background: linear-gradient(135deg, #d4c5b0 0%, #e8dcc8 50%, #d4c5b0 100%); border-color: rgba(139,116,91,0.8); box-shadow: 0 0.3vw 0.6vw rgba(0,0,0,0.8);">
                        <div class="w-[2vw] h-[2vw] rounded-lg flex items-center justify-center text-[1.2vw]" style="background: radial-gradient(circle, rgba(34,197,94,0.85), rgba(22,163,74,0.9)); box-shadow: 0 0.2vw 0.4vw rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.3);">💰</div>
                        <div class="text-[0.5vw] uppercase tracking-wider text-stone-700">Bargeld</div>
                        <div class="text-[0.8vw] font-bold text-stone-800" style="text-shadow: 0 1px 2px rgba(255,255,255,0.5);">2.500 $</div>
                    </div>
                    
                    <!-- Kleidung Button -->
                    <button @click="openClothing" class="w-full aspect-square rounded-lg border-2 flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_1.5vw_rgba(139,90,60,0.8)]" style="background: linear-gradient(135deg, rgba(107,68,35,0.95), rgba(139,90,60,0.9)); border-color: rgba(139,116,91,0.6); box-shadow: 0 0.3vw 0.6vw rgba(0,0,0,0.8);">
                        <span class="text-[1.8vw]">👔</span>
                    </button>
                    
                    <!-- Items Entfernen Button -->
                    <button @click="clearDualInventory" class="w-full aspect-square rounded-lg border-2 flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_1.5vw_rgba(217,119,6,0.8)]" style="background: linear-gradient(135deg, rgba(74,51,36,0.95), rgba(61,40,23,0.98)); border-color: rgba(217,119,6,0.6); box-shadow: 0 0.3vw 0.6vw rgba(0,0,0,0.8);">
                        <span class="text-[1.8vw]">🗑️</span>
                    </button>
                    
                    <!-- Schließen & Speichern Button (ganz unten) -->
                    <button @click="closeDualInventory" class="w-full aspect-square rounded-lg border-2 flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_1.5vw_rgba(34,197,94,0.8)]" style="background: linear-gradient(135deg, rgba(20,83,45,0.95), rgba(5,46,22,0.98)); border-color: rgba(52,211,153,0.7); box-shadow: 0 0.3vw 0.6vw rgba(0,0,0,0.8), 0 0 1vw rgba(34,197,94,0.3);">
                        <span class="text-[1.8vw]">✅</span>
                    </button>
                </div>
                
                <!-- Stats (top-right) - Only visible when dual mode inactive -->
                <div v-else class="col-start-3 row-start-1 rounded-[1.3vw] shadow-[0_0.6vw_1vw_rgba(0,0,0,0.75),inset_0_0.5vh_1vh_rgba(0,0,0,0.6)] border-2 p-[0.7vw] flex flex-col gap-[0.5vh] overflow-hidden" style="background: linear-gradient(135deg, #4a5548 0%, #3d4640 25%, #2f3630 50%, #3d4640 75%, #4a5548 100%), repeating-linear-gradient(45deg, rgba(34,197,94,0.12) 0, rgba(34,197,94,0.12) 0.3vw, transparent 0.3vw, transparent 0.8vw); border-color: rgba(74,85,72,0.8);">
                    <!-- Moss patches on stone -->
                    <div class="absolute top-[1vh] left-[0.5vw] w-[3vw] h-[2vh] rounded-lg opacity-50 blur-[0.2vw]" style="background: radial-gradient(ellipse, rgba(52,211,153,0.6), transparent);"></div>
                    
                    <div class="flex justify-between items-baseline mb-[0.3vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.22em] text-emerald-300" style="text-shadow: 0 2px 4px rgba(0,0,0,0.8);">🍀 Status</div>
                        <div class="text-[0.6vw] uppercase text-emerald-400/90">Live</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-[0.5vw]">
                        <div v-for="stat in stats" :key="stat.name" class="rounded-lg border p-[0.4vw]" style="background: linear-gradient(135deg, rgba(61,73,65,0.85), rgba(45,54,48,0.9)); border-color: rgba(52,211,153,0.3); backdrop-filter: blur(2px);">
                            <div class="text-[0.6vw] uppercase tracking-wide text-emerald-300">{{ stat.name }}</div>
                            <div class="flex justify-between items-baseline">
                                <div class="text-[0.8vw] font-semibold text-emerald-100">{{ stat.value }}</div>
                                <div class="text-[0.6vw] text-emerald-400/70">/ {{ stat.max }}</div>
                            </div>
                            <div class="h-[0.4vh] rounded-full mt-[0.4vh] overflow-hidden" style="background: linear-gradient(90deg, rgba(0,0,0,0.5), rgba(0,0,0,0.6)); box-shadow: inset 0 1px 2px rgba(0,0,0,0.8);">
                                <div class="h-full rounded-full transition-all" :style="{ width: (stat.value / stat.max * 100) + '%', background: stat.color, boxShadow: '0 0 0.5vh currentColor' }"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-[0.4vh] rounded-lg px-[0.5vw] py-[0.4vh] flex justify-between items-center" style="background: linear-gradient(90deg, rgba(34,197,94,0.25), rgba(52,211,153,0.2)); border: 1px solid rgba(52,211,153,0.4); box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);">
                        <div>
                            <div class="text-[0.7vw] text-emerald-100" style="text-shadow: 0 1px 2px rgba(0,0,0,0.5);">24.5 / 50.0 kg</div>
                            <div class="text-[0.55vw] uppercase tracking-wide text-emerald-300/90">🪨 Gewicht</div>
                        </div>
                        <div class="text-[0.6vw] uppercase tracking-wider text-emerald-400 font-bold">OK</div>
                    </div>
                </div>
                
                <!-- Keys (bottom-left) - Wooden key holder - Hidden when dual mode active -->
                <div v-if="!dualInventoryOpen" class="col-start-1 row-start-2 relative rounded-[1.3vw] shadow-[0_0.6vw_1.4vw_rgba(0,0,0,0.9),inset_0_0.4vh_0.7vh_rgba(0,0,0,0.6)] border-2 p-[1vw] flex flex-col overflow-hidden" style="background: linear-gradient(135deg, #6b4423 0%, #8b5a3c 20%, #6b4423 40%, #563619 60%, #6b4423 80%, #8b5a3c 100%), repeating-linear-gradient(90deg, rgba(0,0,0,0.2) 0, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 0.6vw); border-color: rgba(107,68,35,0.8);">
                    <!-- Wood grain knots -->
                    <div class="absolute top-[2vh] right-[1vw] w-[1.5vw] h-[1.5vw] rounded-full opacity-40" style="background: radial-gradient(circle, rgba(0,0,0,0.4), transparent 60%);"></div>
                    
                    <div class="flex justify-between items-baseline mb-[0.5vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.22em] text-amber-200" style="text-shadow: 0 2px 3px rgba(0,0,0,0.7);">🔑 Schlüsselbund</div>
                        <div class="text-[0.6vw] uppercase text-amber-300/80">{{ keys.length }} Schlüssel</div>
                    </div>
                    
                    <div class="flex flex-col gap-[0.4vw] mt-[0.3vh]">
                        <div v-for="(k, i) in keys" :key="i" class="flex items-center gap-[0.5vw] px-[0.5vw] py-[0.4vh] rounded-full border" style="background: linear-gradient(90deg, rgba(139,90,60,0.7), rgba(107,68,35,0.8)); border-color: rgba(139,116,91,0.5); box-shadow: inset 0 1px 2px rgba(0,0,0,0.4);">
                            <div class="w-[1.7vw] h-[1.7vw] rounded-full flex items-center justify-center text-[0.95vw] shadow-[0_0.2vh_0.4vh_rgba(0,0,0,0.6)]" style="background: radial-gradient(circle, rgba(251,191,36,0.9), rgba(217,119,6,0.85)); box-shadow: 0 0 0.3vw rgba(251,191,36,0.5), inset 0 1px 2px rgba(255,255,255,0.3);">{{ k.icon }}</div>
                            <div class="text-[0.65vw] text-amber-100" style="text-shadow: 0 1px 2px rgba(0,0,0,0.5);">{{ k.name }}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Main inventory (center) - Ancient root trunk -->
                <div :class="dualInventoryOpen ? 'row-start-1 col-start-1' : 'col-start-2 row-start-1 row-span-2'" class="rounded-[1.3vw] shadow-[0_0.8vw_1.6vw_rgba(0,0,0,0.95),inset_0_0.5vh_1vh_rgba(0,0,0,0.7)] border-2 flex flex-col overflow-hidden" :style="dualInventoryOpen ? 'background: linear-gradient(135deg, #3d2817 0%, #2d1810 25%, #1a0f08 50%, #2d1810 75%, #3d2817 100%), repeating-linear-gradient(0deg, rgba(107,68,35,0.3) 0, rgba(107,68,35,0.3) 1px, transparent 1px, transparent 0.8vh), repeating-linear-gradient(90deg, rgba(61,40,23,0.25) 0, rgba(61,40,23,0.25) 2px, transparent 2px, transparent 1.2vw); border-color: rgba(61,40,23,0.9);' : 'background: linear-gradient(135deg, #3d2817 0%, #2d1810 25%, #1a0f08 50%, #2d1810 75%, #3d2817 100%), repeating-linear-gradient(0deg, rgba(107,68,35,0.3) 0, rgba(107,68,35,0.3) 1px, transparent 1px, transparent 0.8vh), repeating-linear-gradient(90deg, rgba(61,40,23,0.25) 0, rgba(61,40,23,0.25) 2px, transparent 2px, transparent 1.2vw); border-color: rgba(61,40,23,0.9);'">
                    <div class="px-[1vw] py-[0.8vh] border-b-2 flex justify-between items-baseline" style="background: linear-gradient(90deg, rgba(45,24,16,0.9), rgba(26,15,8,0.95)); border-color: rgba(34,197,94,0.3); box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
                        <div class="font-bold text-[0.75vw] uppercase tracking-[0.22em] text-amber-300" style="text-shadow: 0 2px 4px rgba(0,0,0,0.8);">🌳 Inventar</div>
                        <div class="text-[0.6vw] uppercase text-emerald-300/80">50 Slots • {{ inventoryItems.filter(isItemDefined).length }} belegt</div>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto min-h-0 custom-scrollbar-forest rounded-lg" :class="dualInventoryOpen ? 'p-[0.5vw]' : 'p-[1vw]'" style="scrollbar-width: thin; scrollbar-color: rgba(34,197,94,0.95) rgba(45,24,16,0.9);">
                        <div class="grid auto-rows-min" :class="dualInventoryOpen ? 'grid-cols-5 gap-[0.4vw]' : 'grid-cols-5 gap-[0.6vw]'">
                            <div v-for="(item, index) in inventoryItems" :key="index" 
                                :data-slot-index="index"
                                style="aspect-ratio: 1/1; width: 100%;"
                                :class="[
                                    'relative rounded-lg border flex items-center justify-center cursor-grab transition-all',
                                    dualInventoryOpen ? 'p-[0.35vw]' : 'p-[0.4vw]',
                                    index < 5 ? 'border-2 !border-emerald-500 shadow-[0_0_0_0.05vw_rgba(52,211,153,0.6),0_0.4vh_0.7vh_rgba(0,0,0,0.8)]' : 'border-2 border-emerald-950/40',
                                    !isItemDefined(item) ? 'empty' : '',
                                    selectedItem === item?.id ? '!border-emerald-400 shadow-[0_0_0_0.1vw_#34d399,0_0_1.2vh_rgba(52,211,153,0.9)]' : '',
                                    isItemDefined(item) ? 'hover:-translate-y-[0.25vh] hover:scale-105 hover:shadow-[0_0.6vh_0.9vh_rgba(0,0,0,0.95)] hover:border-emerald-400' : ''
                                ]"
                                :style="isItemDefined(item) ? 'background: linear-gradient(135deg, rgba(107,68,35,0.7), rgba(61,40,23,0.8));' : 'background: linear-gradient(135deg, rgba(61,40,23,0.6), rgba(45,24,16,0.7));'"
                                @mousedown="(e) => handleMouseDown(e, index)"
                                @contextmenu.prevent="(e) => openContextMenu(e, item, index)"
                                @click="selectedItem = selectedItem === item?.id ? null : item?.id"
                                @mouseenter="hoveredItem = item?.id"
                                @mouseleave="hoveredItem = null"
                            >
                                <!-- Moss corner accent -->
                                <div v-if="isItemDefined(item)" class="absolute top-0 left-0 w-[1vw] h-[1vh] rounded-br-lg opacity-30" style="background: radial-gradient(ellipse at top left, rgba(52,211,153,0.8), transparent);"></div>
                                
                                <!-- Hotbar Number (1-5) -->
                                <div v-if="index < 5" class="absolute top-[0.2vh] left-[0.3vw] w-[1.2vw] h-[1.2vw] rounded-md text-white text-[0.7vw] font-bold flex items-center justify-center shadow-[0_0.1vh_0.3vh_rgba(0,0,0,0.7)] z-10" style="background: radial-gradient(circle, rgba(34,197,94,0.9), rgba(22,163,74,0.95));">
                                    {{ index + 1 }}
                                </div>

                                <span v-if="!isItemDefined(item)" class="text-amber-950/40 text-[0.7vw] font-mono">{{ index + 1 }}</span>
                                
                                <template v-if="isItemDefined(item)">
                                    <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw] z-10" style="background: rgba(61,40,23,0.3);">{{ item.emoji }}</div>
                                    <div v-if="item.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] min-w-[1.3vw] h-[1.1vw] px-[0.3vw] rounded-full text-white text-[0.65vw] font-bold flex items-center justify-center z-10" style="background: linear-gradient(90deg, rgba(34,197,94,0.9), rgba(22,163,74,0.95)); box-shadow: 0 0 0.4vw rgba(34,197,94,0.6);">
                                        {{ item.quantity }}
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Equipment Slots (bottom-right) - Only visible when dual mode inactive -->
                <div v-if="!dualInventoryOpen" class="col-start-3 row-start-2 rounded-[1.3vw] shadow-[0_0.6vw_1.3vw_rgba(0,0,0,0.85),inset_0_0.4vh_0.7vh_rgba(0,0,0,0.6)] border-2 p-[0.7vw] flex flex-col overflow-hidden" style="background: linear-gradient(135deg, #6b4423 0%, #8b5a3c 15%, #6b4423 30%, #563619 50%, #6b4423 70%, #8b5a3c 85%, #6b4423 100%), repeating-linear-gradient(45deg, rgba(0,0,0,0.15) 0, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 1vw); border-color: rgba(107,68,35,0.8);">
                    <!-- Carved patterns -->
                    <div class="absolute top-[1vh] right-[0.5vw] w-[2vw] h-[2vw] rounded-lg opacity-20" style="background: repeating-linear-gradient(0deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 1px, transparent 1px, transparent 0.3vw), repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 1px, transparent 1px, transparent 0.3vw);"></div>
                    
                    <div class="flex justify-between items-baseline mb-[0.8vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.22em] text-amber-200" style="text-shadow: 0 2px 3px rgba(0,0,0,0.7);">🎫 Ausrüstung</div>
                        <div class="text-[0.6vw] uppercase text-amber-300/80">Slots</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-[0.8vw] flex-1">
                        <div data-equipment-slot="vest" @mousedown="handleEquipmentMouseDown($event, 'vest')" class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-[0.3vh] transition-all hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer relative" style="background: rgba(34,197,94,0.05); border-color: rgba(52,211,153,0.4);">
                            <template v-if="equipmentSlots.vest">
                                <span class="text-[1.8vw]">{{ equipmentSlots.vest.emoji }}</span>
                                <span v-if="equipmentSlots.vest.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] bg-emerald-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.vest.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.8vw]">🦺</span>
                                <span class="text-[0.5vw] uppercase text-amber-50/90">Weste</span>
                            </template>
                        </div>
                        <div data-equipment-slot="weapon" @mousedown="handleEquipmentMouseDown($event, 'weapon')" class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-[0.3vh] transition-all hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer relative" style="background: rgba(34,197,94,0.05); border-color: rgba(52,211,153,0.4);">
                            <template v-if="equipmentSlots.weapon">
                                <span class="text-[1.8vw]">{{ equipmentSlots.weapon.emoji }}</span>
                                <span v-if="equipmentSlots.weapon.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] bg-emerald-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.weapon.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.8vw]">🔫</span>
                                <span class="text-[0.5vw] uppercase text-amber-50/90">Waffe</span>
                            </template>
                        </div>
                        <div data-equipment-slot="bag1" @mousedown="handleEquipmentMouseDown($event, 'bag1')" class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-[0.3vh] transition-all hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer relative" style="background: rgba(52,211,153,0.05); border-color: rgba(52,211,153,0.4);">
                            <template v-if="equipmentSlots.bag1">
                                <span class="text-[1.8vw]">{{ equipmentSlots.bag1.emoji }}</span>
                                <span v-if="equipmentSlots.bag1.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] bg-emerald-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.bag1.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.8vw]">👜</span>
                                <span class="text-[0.5vw] uppercase text-emerald-100/90">Tasche 1</span>
                            </template>
                        </div>
                        <div data-equipment-slot="bag2" @mousedown="handleEquipmentMouseDown($event, 'bag2')" class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-[0.3vh] transition-all hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer relative" style="background: rgba(52,211,153,0.05); border-color: rgba(52,211,153,0.4);">
                            <template v-if="equipmentSlots.bag2">
                                <span class="text-[1.8vw]">{{ equipmentSlots.bag2.emoji }}</span>
                                <span v-if="equipmentSlots.bag2.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] bg-emerald-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.bag2.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.8vw]">🎒</span>
                                <span class="text-[0.5vw] uppercase text-emerald-100/90">Tasche 2</span>
                            </template>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Action Bar (rechts, beide Reihen) - Hidden when dual mode active -->
                <div v-if="!dualInventoryOpen" class="col-start-4 row-span-2 rounded-[1.3vw] shadow-[0_0.8vw_1.7vw_rgba(0,0,0,0.95),inset_0_0.3vh_0.6vh_rgba(255,255,255,0.05)] border-2 p-[0.7vw] flex flex-col gap-[0.8vw] justify-center overflow-hidden" style="background: linear-gradient(135deg, rgba(45,24,16,0.9), rgba(26,15,8,0.95)); border-color: rgba(74,55,40,0.8);">
                    <div class="flex justify-center mb-[0.5vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.16em] text-green-300" style="text-shadow: 0 2px 4px rgba(0,0,0,0.7);">⚡ Quick Actions</div>
                    </div>
                    <button @click="openClothing" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(45,24,16,0.9), rgba(26,15,8,0.95)); border-color: rgba(74,55,40,0.8); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.9), inset 0 0 1vw rgba(34,197,94,0.1);">
                        <span class="text-[2vw]">👔</span>
                    </button>
                    <button @click="openGlovebox" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(45,24,16,0.9), rgba(26,15,8,0.95)); border-color: rgba(74,55,40,0.8); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.9), inset 0 0 1vw rgba(34,197,94,0.1);">
                        <span class="text-[2vw]">🧤</span>
                    </button>
                    <button @click="openTrunk" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(45,24,16,0.9), rgba(26,15,8,0.95)); border-color: rgba(74,55,40,0.8); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.9), inset 0 0 1vw rgba(34,197,94,0.1);">
                        <span class="text-[2vw]">🚗</span>
                    </button>
                    <button @click="openGround" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(45,24,16,0.9), rgba(26,15,8,0.95)); border-color: rgba(74,55,40,0.8); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.9), inset 0 0 1vw rgba(34,197,94,0.1);">
                        <span class="text-[2vw]">🌍</span>
                    </button>
                    <button @click="toggleGiveMode" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(45,24,16,0.9), rgba(26,15,8,0.95)); border-color: rgba(74,55,40,0.8); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.9), inset 0 0 1vw rgba(34,197,94,0.1);">
                        <span class="text-[2vw]">🤝</span>
                    </button>
                    <button @click="toggleSettings()" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(45,24,16,0.9), rgba(26,15,8,0.95)); border-color: rgba(74,55,40,0.8); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.9), inset 0 0 1vw rgba(34,197,94,0.1);">
                        <span class="text-[2vw]">⚙️</span>
                    </button>
                    <button @click="handleClose" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(139,0,0,0.9), rgba(90,0,0,0.95)); border-color: rgba(220,38,38,0.6); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.9);">
                        <span class="text-[1.8vw] text-red-300 font-bold">✕</span>
                    </button>
                </div>
                
            </div>
        </div>
        

    </div>
    `;
}

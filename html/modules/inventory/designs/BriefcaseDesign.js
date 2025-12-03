// Briefcase Design Template - Premium leather with stitching and metal hardware
export function generateBriefcaseTemplate() {
    return `
    <div class="relative w-full h-full flex justify-center items-center overflow-hidden">
        <!-- Ambient Glow with Animation -->
        <div class="absolute inset-0 blur-[4vw] opacity-40 animate-pulse" style="background: radial-gradient(circle at 30% 40%, rgba(180,120,60,0.25), transparent 50%), radial-gradient(circle at 70% 60%, rgba(212,175,55,0.22), transparent 55%); animation-duration: 4s;"></div>
        
        <!-- Briefcase Shell with Leather Texture -->
        <div class="relative rounded-[2.5vw] shadow-[0_2vw_4vw_rgba(0,0,0,0.95),inset_0_0_2vw_rgba(0,0,0,0.6)] border-4 p-[1.5vw] flex flex-col transition-all duration-500 hover:shadow-[0_2.5vw_5vw_rgba(212,175,55,0.3),inset_0_0_2vw_rgba(212,175,55,0.2)]" :class="dualInventoryOpen ? 'w-[90vw] h-[64vh] justify-start' : 'w-full h-full'" style="background: linear-gradient(165deg, #5a3d25 0%, #4a2f1a 20%, #3d2415 45%, #2d1810 70%, #3d2415 85%, #4a2f1a 100%), repeating-linear-gradient(90deg, rgba(90,61,37,0.3) 0px, rgba(90,61,37,0.3) 1px, transparent 1px, transparent 10vw); border-color: #2d1810; animation: float 6s ease-in-out infinite;">
            
            <!-- Animated Shine Effect -->
            <div class="absolute inset-0 pointer-events-none opacity-30" style="background: linear-gradient(110deg, transparent 0%, transparent 40%, rgba(212,175,55,0.4) 50%, transparent 60%, transparent 100%); animation: shine 8s ease-in-out infinite;"></div>
            
            <!-- Leather Grain Texture -->
            <div class="absolute inset-[1.5vw] rounded-[2vw] pointer-events-none opacity-50" style="background: 
                repeating-linear-gradient(45deg, rgba(139,90,60,0.15) 0, rgba(139,90,60,0.15) 0.1vw, transparent 0.1vw, transparent 0.5vw),
                repeating-linear-gradient(135deg, rgba(107,68,35,0.1) 0, rgba(107,68,35,0.1) 0.15vw, transparent 0.15vw, transparent 0.6vw);"></div>
            
            <!-- Stitching Details -->
            <div class="absolute inset-[1vw] rounded-[2vw] border-2 pointer-events-none" style="border-color: rgba(212,175,55,0.4); border-style: dashed; border-width: 2px;"></div>
            
            <!-- Metal Corners -->
            <div class="absolute top-[1vw] left-[1vw] w-[2vw] h-[2vw] rounded-br-xl opacity-80" style="background: linear-gradient(135deg, rgba(212,175,55,0.8), rgba(139,90,43,0.6)); box-shadow: inset 0 1px 3px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.6);"></div>
            <div class="absolute top-[1vw] right-[1vw] w-[2vw] h-[2vw] rounded-bl-xl opacity-80" style="background: linear-gradient(225deg, rgba(212,175,55,0.8), rgba(139,90,43,0.6)); box-shadow: inset 0 1px 3px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.6);"></div>
            <div class="absolute bottom-[1vw] left-[1vw] w-[2vw] h-[2vw] rounded-tr-xl opacity-80" style="background: linear-gradient(45deg, rgba(212,175,55,0.8), rgba(139,90,43,0.6)); box-shadow: inset 0 1px 3px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.6);"></div>
            <div class="absolute bottom-[1vw] right-[1vw] w-[2vw] h-[2vw] rounded-tl-xl opacity-80" style="background: linear-gradient(315deg, rgba(212,175,55,0.8), rgba(139,90,43,0.6)); box-shadow: inset 0 1px 3px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.6);"></div>
            
            <!-- Handle with Metal -->
            <div class="absolute -top-[2.5vh] left-1/2 -translate-x-1/2 w-[14vw] h-[2.8vh] rounded-full border-3 shadow-[0_1vh_1.2vh_rgba(0,0,0,0.9)]" style="background: linear-gradient(180deg, rgba(139,90,43,0.9), rgba(107,68,35,0.95)); border: 3px solid rgba(61,40,23,0.8);"></div>
            <div class="absolute -top-[1.8vh] left-[calc(50%-6vw)] w-[1.5vw] h-[1.5vw] rounded-full" style="background: radial-gradient(circle, rgba(212,175,55,0.9), rgba(139,90,43,0.8)); box-shadow: inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.7);"></div>
            <div class="absolute -top-[1.8vh] right-[calc(50%-6vw)] w-[1.5vw] h-[1.5vw] rounded-full" style="background: radial-gradient(circle, rgba(212,175,55,0.9), rgba(139,90,43,0.8)); box-shadow: inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.7);"></div>
            
            <!-- Lock Clasp -->
            <div class="absolute top-[50%] -translate-y-1/2 -left-[0.8vw] w-[1.6vw] h-[4vh] rounded-r-lg" style="background: linear-gradient(90deg, rgba(139,90,43,0.9), rgba(212,175,55,0.7)); box-shadow: inset 0 1px 3px rgba(255,255,255,0.3), 2px 2px 6px rgba(0,0,0,0.8);"></div>
            <div class="absolute top-[50%] -translate-y-1/2 -left-[0.5vw] w-[1vw] h-[1vw] rounded-full" style="background: radial-gradient(circle, rgba(212,175,55,0.95), rgba(139,90,43,0.9)); box-shadow: inset 0 1px 2px rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.8);"></div>
            
            <!-- Content Grid -->
            <div class="relative z-10 grid h-full" 
                :class="dualInventoryOpen ? 'gap-[1vw]' : 'grid-cols-[20%_1fr_20%_8%] grid-rows-[1fr_1fr] gap-[1vw]'"
                :style="dualInventoryOpen ? 'grid-template-columns: 45% 45% 8%; grid-template-rows: 1fr auto;' : ''">
                
                <!-- Wallet (top-left) - Quilted leather pocket -->
                <div v-if="!dualInventoryOpen" class="col-start-1 row-start-1 relative rounded-[1.3vw] shadow-[0_0.8vw_1.7vw_rgba(0,0,0,0.85),inset_0_0.3vh_0.6vh_rgba(255,255,255,0.08)] border-2 p-[0.7vw] flex flex-col overflow-hidden" style="background: linear-gradient(135deg, rgba(90,61,37,0.85), rgba(74,47,26,0.9)), repeating-linear-gradient(45deg, rgba(139,90,60,0.1) 0, rgba(139,90,60,0.1) 0.8vw, transparent 0.8vw, transparent 1.6vw); border-color: rgba(212,175,55,0.6);">
                    <!-- Quilted diamond pattern -->
                    <div class="absolute inset-0 opacity-20 pointer-events-none" style="background: repeating-linear-gradient(45deg, transparent 0, transparent 1vw, rgba(212,175,55,0.3) 1vw, rgba(212,175,55,0.3) 1.1vw), repeating-linear-gradient(-45deg, transparent 0, transparent 1vw, rgba(212,175,55,0.3) 1vw, rgba(212,175,55,0.3) 1.1vw);"></div>
                    
                    <div class="flex justify-between items-baseline mb-[0.8vh] relative z-10">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.16em] text-amber-100" style="text-shadow: 0 2px 4px rgba(0,0,0,0.7);">💼 Geldbeutel</div>
                        <div class="text-[0.6vw] uppercase text-amber-200/80">Bargeld & ID</div>
                    </div>
                    
                    <div class="flex items-center gap-[0.6vw] p-[0.5vw] rounded-xl shadow-[0_0.4vh_0.8vh_rgba(0,0,0,0.7),inset_0_1px_3px_rgba(212,175,55,0.2)] mb-[0.5vh] relative z-10" style="background: linear-gradient(135deg, rgba(212,175,55,0.85), rgba(180,120,60,0.9), rgba(212,175,55,0.85)); backdrop-filter: blur(4px);">
                        <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.3vw]" style="background: radial-gradient(circle, rgba(255,255,255,0.3), rgba(0,0,0,0.2)); box-shadow: inset 0 2px 4px rgba(255,255,255,0.4);">💰</div>
                        <div class="flex flex-col">
                            <div class="text-[0.55vw] uppercase tracking-wider text-amber-950/90 font-semibold">Bargeld</div>
                            <div class="text-[1.1vw] font-bold text-amber-950" style="text-shadow: 0 1px 2px rgba(255,255,255,0.3);">2.500 $</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-[0.4vw] relative z-10">
                        <div v-for="lic in licenses" :key="lic.id" class="rounded-lg border p-[0.4vw]" style="background: linear-gradient(135deg, rgba(245,237,220,0.2), rgba(226,217,200,0.25)); border-color: rgba(212,175,55,0.5); box-shadow: inset 0 1px 2px rgba(212,175,55,0.1); backdrop-filter: blur(2px);">
                            <div class="text-[0.6vw] font-semibold text-amber-100">{{ lic.label }}</div>
                            <div class="text-[0.55vw] text-amber-200/80">{{ lic.desc }}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Second Inventory (when dual mode active) OR Stats (top-right) -->
                <div v-if="dualInventoryOpen" class="row-start-1 row-span-2 col-start-2 rounded-[1.3vw] shadow-[0_0.8vw_1.6vw_rgba(0,0,0,0.95),inset_0_0.5vh_1vh_rgba(0,0,0,0.6)] border-2 flex flex-col overflow-hidden" style="background: linear-gradient(135deg, rgba(90,61,37,0.85), rgba(74,47,26,0.9)); border-color: rgba(212,175,55,0.5);">
                    <div class="px-[1vw] py-[0.8vh] border-b-2 flex justify-between items-baseline" style="background: linear-gradient(90deg, rgba(92,67,50,0.9), rgba(69,50,37,0.95)); border-color: rgba(217,119,6,0.3); box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
                        <div class="font-bold text-[0.75vw] uppercase tracking-[0.22em] text-amber-200" style="text-shadow: 0 2px 4px rgba(0,0,0,0.8);">📦 {{ dualInventoryTitle }}</div>
                        <div class="text-[0.6vw] uppercase text-amber-300/80">{{ secondInventoryItems.filter(isItemDefined).length }}/{{ secondInventoryItems.length }}</div>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto min-h-0 p-[0.8vw] custom-scrollbar-briefcase" style="scrollbar-width: thin; scrollbar-color: rgba(212,175,55,0.7) rgba(61,40,23,0.8);">
                        <div class="grid grid-cols-5 gap-[0.5vw]">
                            <div v-for="(item, index) in secondInventoryItems" :key="'second-' + index" 
                                :data-slot-index="'second-' + index"
                                @mousedown="(e) => handleMouseDown(e, 'second-' + index)"
                                @mouseenter="hoveredItem = item?.id"
                                @mouseleave="hoveredItem = null"
                                class="relative rounded-lg border-2 border-amber-600/40 flex items-center justify-center p-[0.35vw] cursor-grab transition-all aspect-square hover:-translate-y-[0.25vh] hover:scale-105 hover:border-amber-400"
                                :style="isItemDefined(item) ? 'background: linear-gradient(135deg, rgba(90,61,37,0.7), rgba(61,40,23,0.8));' : 'background: linear-gradient(135deg, rgba(90,61,37,0.3), rgba(61,40,23,0.5));'"
                            >
                                <span v-if="!isItemDefined(item)" class="text-amber-950/40 text-[0.7vw] font-mono">{{ index + 1 }}</span>
                                
                                <template v-if="isItemDefined(item)">
                                    <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw] z-10" style="background: rgba(61,40,23,0.5);">{{ item.emoji }}</div>
                                    <div v-if="item.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] min-w-[1.3vw] h-[1.1vw] px-[0.3vw] rounded-full text-white text-[0.65vw] font-bold flex items-center justify-center z-10" style="background: linear-gradient(90deg, rgba(212,175,55,0.9), rgba(180,120,60,0.95)); box-shadow: 0 0 0.4vw rgba(212,175,55,0.6);">
                                        {{ item.quantity }}
                                    </div>
                                    <div v-if="hoveredItem === item.id" class="absolute left-1/2 bottom-full -translate-x-1/2 mb-[0.4vh] px-[0.5vw] py-[0.3vh] rounded-lg text-[0.65vw] border whitespace-nowrap z-50 animate-[fadeIn_0.16s_ease-out]" style="background: rgba(45,24,16,0.98); color: #fef3c7; border-color: rgba(212,175,55,0.6);">
                                        {{ item.name }}
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Equipment Bar (horizontal strip below player inventory only) -->
                <div v-if="dualInventoryOpen" class="row-start-2 col-start-1 rounded-[1vw] shadow-[0_0.5vw_1vw_rgba(0,0,0,0.9),inset_0_0.3vh_0.6vh_rgba(0,0,0,0.6)] border-2 p-[0.5vw] flex flex-col overflow-hidden" style="background: linear-gradient(135deg, rgba(90,61,37,0.9), rgba(74,47,26,0.95)); border-color: rgba(212,175,55,0.5);">
                    <div class="flex justify-between items-baseline mb-[0.5vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.16em] text-amber-200" style="text-shadow: 0 2px 3px rgba(0,0,0,0.7);">🎫 Ausrüstung</div>
                        <div class="text-[0.6vw] uppercase text-amber-300/80">4 Slots</div>
                    </div>
                    
                    <div class="grid grid-cols-4 gap-[0.4vw]">
                        <div data-equipment-slot="vest" @mousedown="handleEquipmentMouseDown($event, 'vest')" class="rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-[0.35vw] transition-all hover:border-amber-400 hover:bg-amber-500/10 cursor-pointer relative" style="aspect-ratio: 1/1; background: rgba(212,175,55,0.05); border-color: rgba(212,175,55,0.4);">
                            <template v-if="equipmentSlots.vest">
                                <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw]" style="background: rgba(90,61,37,0.6);">{{ equipmentSlots.vest.emoji }}</div>
                                <span v-if="equipmentSlots.vest.quantity > 1" class="absolute top-[0.2vh] right-[0.3vw] bg-amber-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.vest.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.5vw]">🦺</span>
                                <span class="text-[0.5vw] uppercase text-amber-50/90">Weste</span>
                            </template>
                        </div>
                        <div data-equipment-slot="weapon" @mousedown="handleEquipmentMouseDown($event, 'weapon')" class="rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-[0.35vw] transition-all hover:border-amber-400 hover:bg-amber-500/10 cursor-pointer relative" style="aspect-ratio: 1/1; background: rgba(212,175,55,0.05); border-color: rgba(212,175,55,0.4);">
                            <template v-if="equipmentSlots.weapon">
                                <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw]" style="background: rgba(90,61,37,0.6);">{{ equipmentSlots.weapon.emoji }}</div>
                                <span v-if="equipmentSlots.weapon.quantity > 1" class="absolute top-[0.2vh] right-[0.3vw] bg-amber-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.weapon.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.5vw]">🔫</span>
                                <span class="text-[0.5vw] uppercase text-amber-50/90">Waffe</span>
                            </template>
                        </div>
                        <div data-equipment-slot="bag1" @mousedown="handleEquipmentMouseDown($event, 'bag1')" class="rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-[0.35vw] transition-all hover:border-amber-400 hover:bg-amber-500/10 cursor-pointer relative" style="aspect-ratio: 1/1; background: rgba(212,175,55,0.05); border-color: rgba(212,175,55,0.4);">
                            <template v-if="equipmentSlots.bag1">
                                <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw]" style="background: rgba(90,61,37,0.6);">{{ equipmentSlots.bag1.emoji }}</div>
                                <span v-if="equipmentSlots.bag1.quantity > 1" class="absolute top-[0.2vh] right-[0.3vw] bg-amber-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.bag1.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.5vw]">👜</span>
                                <span class="text-[0.5vw] uppercase text-amber-100/90">Tasche 1</span>
                            </template>
                        </div>
                        <div data-equipment-slot="bag2" @mousedown="handleEquipmentMouseDown($event, 'bag2')" class="rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-[0.35vw] transition-all hover:border-amber-400 hover:bg-amber-500/10 cursor-pointer relative" style="aspect-ratio: 1/1; background: rgba(212,175,55,0.05); border-color: rgba(212,175,55,0.4);">
                            <template v-if="equipmentSlots.bag2">
                                <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw]" style="background: rgba(90,61,37,0.6);">{{ equipmentSlots.bag2.emoji }}</div>
                                <span v-if="equipmentSlots.bag2.quantity > 1" class="absolute top-[0.2vh] right-[0.3vw] bg-amber-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.bag2.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.5vw]">🎒</span>
                                <span class="text-[0.5vw] uppercase text-amber-100/90">Tasche 2</span>
                            </template>
                        </div>
                    </div>
                </div>
                
                <!-- Button Column (only visible in dual mode) - Briefcase style -->
                <div v-if="dualInventoryOpen" class="row-start-1 row-span-2 col-start-3 flex flex-col gap-[1vh] justify-end">
                    <!-- Bargeld Anzeige -->
                    <div class="w-full rounded-lg border-2 p-[0.4vw] flex flex-col items-center gap-[0.3vh]" style="background: linear-gradient(135deg, rgba(90,61,37,0.9), rgba(74,47,26,0.95)); border-color: rgba(212,175,55,0.6); box-shadow: 0 0.3vw 0.6vw rgba(0,0,0,0.8);">
                        <div class="w-[2vw] h-[2vw] rounded-lg flex items-center justify-center text-[1.2vw]" style="background: radial-gradient(circle, rgba(251,191,36,0.85), rgba(217,119,6,0.9)); box-shadow: 0 0.2vw 0.4vw rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.3);">💰</div>
                        <div class="text-[0.5vw] uppercase tracking-wider text-amber-200">Bargeld</div>
                        <div class="text-[0.8vw] font-bold text-amber-100" style="text-shadow: 0 1px 2px rgba(0,0,0,0.5);">2.500 $</div>
                    </div>
                    
                    <!-- Kleidung Button -->
                    <button @click="openClothing" class="w-full aspect-square rounded-lg border-2 flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_1.5vw_rgba(139,90,60,0.8)]" style="background: linear-gradient(135deg, rgba(90,61,37,0.95), rgba(74,47,26,0.98)); border-color: rgba(212,175,55,0.6); box-shadow: 0 0.3vw 0.6vw rgba(0,0,0,0.8);">
                        <span class="text-[1.8vw]">👔</span>
                    </button>
                    
                    <!-- Items Entfernen Button -->
                    <button @click="clearDualInventory" class="w-full aspect-square rounded-lg border-2 flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_1.5vw_rgba(217,119,6,0.8)]" style="background: linear-gradient(135deg, rgba(180,120,60,0.95), rgba(139,90,43,0.98)); border-color: rgba(217,119,6,0.6); box-shadow: 0 0.3vw 0.6vw rgba(0,0,0,0.8);">
                        <span class="text-[1.8vw]">🗑️</span>
                    </button>
                    
                    <!-- Schließen & Speichern Button (ganz unten) -->
                    <button @click="closeDualInventory" class="w-full aspect-square rounded-lg border-2 flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_1.5vw_rgba(74,133,71,0.8)]" style="background: linear-gradient(135deg, rgba(74,133,71,0.95), rgba(56,103,54,0.98)); border-color: rgba(134,239,172,0.7); box-shadow: 0 0.3vw 0.6vw rgba(0,0,0,0.8), 0 0 1vw rgba(74,133,71,0.3);">
                        <span class="text-[1.8vw]">✅</span>
                    </button>
                </div>
                
                <!-- Stats (top-right) - Only visible when dual mode inactive -->
                <div v-else class="col-start-3 row-start-1 rounded-[1.3vw] shadow-[0_0.6vw_1vw_rgba(0,0,0,0.75),inset_0_0.5vh_1vh_rgba(0,0,0,0.5)] border-2 p-[1vw] flex flex-col gap-[0.5vh] overflow-hidden" style="background: linear-gradient(135deg, rgba(90,61,37,0.8), rgba(61,40,23,0.85)); border-color: rgba(212,175,55,0.5);">
                    <div class="flex justify-between items-baseline mb-[0.3vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.22em] text-amber-100" style="text-shadow: 0 2px 4px rgba(0,0,0,0.8);">📊 Status</div>
                        <div class="text-[0.6vw] uppercase text-amber-200/80">Live</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-[0.5vw]">
                        <div v-for="stat in stats" :key="stat.name" class="rounded-lg border p-[0.4vw]" style="background: linear-gradient(135deg, rgba(61,40,23,0.6), rgba(45,24,16,0.7)); border-color: rgba(212,175,55,0.3); backdrop-filter: blur(2px);">
                            <div class="text-[0.6vw] uppercase tracking-wide text-amber-200/90">{{ stat.name }}</div>
                            <div class="flex justify-between items-baseline">
                                <div class="text-[0.8vw] font-semibold text-amber-100">{{ stat.value }}</div>
                                <div class="text-[0.6vw] text-amber-300/70">/ {{ stat.max }}</div>
                            </div>
                            <div class="h-[0.4vh] rounded-full mt-[0.4vh] overflow-hidden" style="background: linear-gradient(90deg, rgba(0,0,0,0.5), rgba(0,0,0,0.6)); box-shadow: inset 0 1px 2px rgba(0,0,0,0.8);">
                                <div class="h-full rounded-full transition-all" :style="{ width: (stat.value / stat.max * 100) + '%', background: stat.color, boxShadow: '0 0 0.5vh currentColor' }"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-[0.4vh] rounded-lg px-[0.5vw] py-[0.4vh] flex justify-between items-center" style="background: linear-gradient(90deg, rgba(212,175,55,0.2), rgba(180,120,60,0.25)); border: 1px solid rgba(212,175,55,0.4); box-shadow: inset 0 1px 3px rgba(212,175,55,0.1);">
                        <div>
                            <div class="text-[0.7vw] text-amber-100 font-semibold" style="text-shadow: 0 1px 2px rgba(0,0,0,0.5);">24.5 / 50.0 kg</div>
                            <div class="text-[0.55vw] uppercase tracking-wide text-amber-200/90">⚖️ Gewicht</div>
                        </div>
                        <div class="text-[0.6vw] uppercase tracking-wider text-emerald-400 font-bold">OK</div>
                    </div>
                </div>
                
                <!-- Keys (bottom-left) - Hidden when dual mode active -->
                <div v-if="!dualInventoryOpen" class="col-start-1 row-start-2 relative rounded-[1.3vw] shadow-[0_0.6vw_1.4vw_rgba(0,0,0,0.9),inset_0_0.4vh_0.7vh_rgba(0,0,0,0.5)] border-2 p-[1vw] flex flex-col overflow-hidden" style="background: linear-gradient(135deg, rgba(90,61,37,0.8), rgba(61,40,23,0.85)); border-color: rgba(212,175,55,0.5);">
                    <div class="flex justify-between items-baseline mb-[0.5vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.22em] text-amber-100" style="text-shadow: 0 2px 3px rgba(0,0,0,0.7);">🔑 Schlüssel</div>
                        <div class="text-[0.6vw] uppercase text-amber-200/80">{{ keys.length }} Stk</div>
                    </div>
                    
                    <div class="flex flex-col gap-[0.4vw] mt-[0.3vh]">
                        <div v-for="(k, i) in keys" :key="i" class="flex items-center gap-[0.5vw] px-[0.5vw] py-[0.4vh] rounded-full border" style="background: linear-gradient(90deg, rgba(90,61,37,0.6), rgba(74,47,26,0.7)); border-color: rgba(212,175,55,0.4); box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);">
                            <div class="w-[1.7vw] h-[1.7vw] rounded-full flex items-center justify-center text-[0.95vw] shadow-[0_0.2vh_0.4vh_rgba(0,0,0,0.6)]" style="background: radial-gradient(circle, rgba(212,175,55,0.95), rgba(180,120,60,0.9)); box-shadow: 0 0 0.4vw rgba(212,175,55,0.5), inset 0 1px 3px rgba(255,255,255,0.4);">{{ k.icon }}</div>
                            <div class="text-[0.65vw] text-amber-100" style="text-shadow: 0 1px 2px rgba(0,0,0,0.5);">{{ k.name }}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Main inventory (center) -->
                <div :class="dualInventoryOpen ? 'row-start-1 col-start-1' : 'col-start-2 row-start-1 row-span-2'" class="rounded-[1.3vw] shadow-[0_0.8vw_1.6vw_rgba(0,0,0,0.95),inset_0_0.5vh_1vh_rgba(0,0,0,0.6)] border-2 flex flex-col overflow-hidden" style="background: linear-gradient(135deg, rgba(74,47,26,0.95), rgba(58,37,21,0.98)); border-color: rgba(139,90,60,0.6);">
                    <div class="px-[1vw] py-[0.8vh] border-b-2 flex justify-between items-baseline" style="background: linear-gradient(90deg, rgba(45,24,16,0.95), rgba(26,15,8,0.98)); border-color: rgba(212,175,55,0.4); box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
                        <div class="font-bold text-[0.75vw] uppercase tracking-[0.22em] text-amber-200" style="text-shadow: 0 2px 4px rgba(0,0,0,0.8);">🎒 Inventar</div>
                        <div class="text-[0.6vw] uppercase text-amber-300/80">50 Slots • {{ inventoryItems.filter(isItemDefined).length }} belegt</div>
                    </div>
                    
                    <!-- Custom Scrollbar: Brown-Gold theme -->
                    <div class="flex-1 overflow-y-auto min-h-0 custom-scrollbar-briefcase" :class="dualInventoryOpen ? 'p-[0.5vw]' : 'p-[1vw]'" style="scrollbar-width: thin; scrollbar-color: rgba(212,175,55,0.95) rgba(45,24,16,0.9);">
                        <div class="grid auto-rows-min" :class="dualInventoryOpen ? 'grid-cols-5 gap-[0.4vw]' : 'grid-cols-5 gap-[0.6vw]'">
                            <div v-for="(item, index) in inventoryItems" :key="index" 
                                :data-slot-index="index"
                                :class="[
                                    'relative rounded-lg border flex items-center justify-center cursor-grab transition-all aspect-square',
                                    dualInventoryOpen ? 'p-[0.35vw]' : 'p-[0.4vw]',
                                    index < 5 ? 'border-2 !border-amber-400 shadow-[0_0_0_0.05vw_rgba(245,158,11,0.6),0_0.4vh_0.7vh_rgba(0,0,0,0.8)]' : 'border-2 border-amber-950/40',
                                    !isItemDefined(item) ? 'empty' : '',
                                    selectedItem === item?.id ? '!border-amber-300 shadow-[0_0_0_0.1vw_#fbbf24,0_0_1.2vh_rgba(251,191,36,0.9)]' : '',
                                    isItemDefined(item) ? 'hover:-translate-y-[0.25vh] hover:scale-105 hover:shadow-[0_0.6vh_0.9vh_rgba(0,0,0,0.95)] hover:border-amber-300' : ''
                                ]"
                                :style="isItemDefined(item) ? 'background: linear-gradient(135deg, rgba(90,61,37,0.7), rgba(61,40,23,0.8));' : 'background: linear-gradient(135deg, rgba(61,40,23,0.5), rgba(45,24,16,0.6));'"
                                @mousedown="(e) => handleMouseDown(e, index)"
                                @click="selectedItem = selectedItem === item?.id ? null : item?.id"
                                @mouseenter="hoveredItem = item?.id"
                                @mouseleave="hoveredItem = null"
                            >
                                <!-- Hotbar Number (1-5) -->
                                <div v-if="index < 5" class="absolute top-[0.2vh] left-[0.3vw] w-[1.2vw] h-[1.2vw] rounded-md text-amber-950 text-[0.7vw] font-bold flex items-center justify-center shadow-[0_0.1vh_0.3vh_rgba(0,0,0,0.7)] z-10" style="background: radial-gradient(circle, rgba(212,175,55,0.95), rgba(180,120,60,0.9));">
                                    {{ index + 1 }}
                                </div>

                                <span v-if="!isItemDefined(item)" class="text-amber-950/30 text-[0.7vw] font-mono">{{ index + 1 }}</span>
                                
                                <template v-if="isItemDefined(item)">
                                    <div class="w-[2.2vw] h-[2.2vw] rounded-xl flex items-center justify-center text-[1.5vw] z-10" style="background: rgba(61,40,23,0.4);">{{ item.emoji }}</div>
                                    <div v-if="item.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] min-w-[1.3vw] h-[1.1vw] px-[0.3vw] rounded-full text-amber-950 text-[0.65vw] font-bold flex items-center justify-center z-10" style="background: linear-gradient(90deg, rgba(212,175,55,0.95), rgba(180,120,60,0.95)); box-shadow: 0 0 0.4vw rgba(212,175,55,0.6), inset 0 1px 2px rgba(255,255,255,0.3);">
                                        {{ item.quantity }}
                                    </div>
                                    <div v-if="hoveredItem === item.id" class="absolute left-1/2 bottom-full -translate-x-1/2 mb-[0.4vh] px-[0.5vw] py-[0.3vh] rounded-lg text-[0.65vw] border whitespace-nowrap z-50 animate-[fadeIn_0.16s_ease-out]" style="background: rgba(45,24,16,0.98); color: #fef3c7; border-color: rgba(212,175,55,0.6); box-shadow: 0 4px 8px rgba(0,0,0,0.7);">
                                        {{ item.name }}
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Equipment Slots (bottom-right) - Only visible when dual mode inactive -->
                <div v-if="!dualInventoryOpen" class="col-start-3 row-start-2 rounded-[1.3vw] shadow-[0_0.6vw_1.3vw_rgba(0,0,0,0.85),inset_0_0.4vh_0.7vh_rgba(0,0,0,0.5)] border-2 p-[1vw] flex flex-col overflow-hidden" style="background: linear-gradient(135deg, rgba(90,61,37,0.8), rgba(61,40,23,0.85)); border-color: rgba(212,175,55,0.5);">
                    <div class="flex justify-between items-baseline mb-[0.8vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.22em] text-amber-100" style="text-shadow: 0 2px 3px rgba(0,0,0,0.7);">🎫 Ausrüstung</div>
                        <div class="text-[0.6vw] uppercase text-amber-200/80">Slots</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-[0.8vw] flex-1">
                        <div data-equipment-slot="vest" @mousedown="handleEquipmentMouseDown($event, 'vest')" class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-[0.3vh] transition-all hover:border-amber-400 hover:bg-amber-500/10 cursor-pointer relative" style="background: rgba(212,175,55,0.05); border-color: rgba(212,175,55,0.4);">
                            <template v-if="equipmentSlots.vest">
                                <span class="text-[1.8vw]">{{ equipmentSlots.vest.emoji }}</span>
                                <span v-if="equipmentSlots.vest.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] bg-amber-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.vest.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.8vw]">🦺</span>
                                <span class="text-[0.5vw] uppercase text-amber-100/90">Weste</span>
                            </template>
                        </div>
                        <div data-equipment-slot="weapon" @mousedown="handleEquipmentMouseDown($event, 'weapon')" class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-[0.3vh] transition-all hover:border-amber-400 hover:bg-amber-500/10 cursor-pointer relative" style="background: rgba(212,175,55,0.05); border-color: rgba(212,175,55,0.4);">
                            <template v-if="equipmentSlots.weapon">
                                <span class="text-[1.8vw]">{{ equipmentSlots.weapon.emoji }}</span>
                                <span v-if="equipmentSlots.weapon.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] bg-amber-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.weapon.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.8vw]">🔫</span>
                                <span class="text-[0.5vw] uppercase text-amber-100/90">Waffe</span>
                            </template>
                        </div>
                        <div data-equipment-slot="bag1" @mousedown="handleEquipmentMouseDown($event, 'bag1')" class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-[0.3vh] transition-all hover:border-amber-400 hover:bg-amber-500/10 cursor-pointer relative" style="background: rgba(212,175,55,0.05); border-color: rgba(212,175,55,0.4);">
                            <template v-if="equipmentSlots.bag1">
                                <span class="text-[1.8vw]">{{ equipmentSlots.bag1.emoji }}</span>
                                <span v-if="equipmentSlots.bag1.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] bg-amber-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.bag1.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.8vw]">👜</span>
                                <span class="text-[0.5vw] uppercase text-amber-100/90">Tasche 1</span>
                            </template>
                        </div>
                        <div data-equipment-slot="bag2" @mousedown="handleEquipmentMouseDown($event, 'bag2')" class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-[0.3vh] transition-all hover:border-amber-400 hover:bg-amber-500/10 cursor-pointer relative" style="background: rgba(212,175,55,0.05); border-color: rgba(212,175,55,0.4);">
                            <template v-if="equipmentSlots.bag2">
                                <span class="text-[1.8vw]">{{ equipmentSlots.bag2.emoji }}</span>
                                <span v-if="equipmentSlots.bag2.quantity > 1" class="absolute top-[0.3vh] right-[0.4vw] bg-amber-500 text-white text-[0.5vw] font-bold px-[0.3vw] rounded-full">{{ equipmentSlots.bag2.quantity }}</span>
                            </template>
                            <template v-else>
                                <span class="text-[1.8vw]">🎒</span>
                                <span class="text-[0.5vw] uppercase text-amber-100/90">Tasche 2</span>
                            </template>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Action Bar (rechts, beide Reihen) - Hidden when dual mode active -->
                <div v-if="!dualInventoryOpen" class="col-start-4 row-span-2 rounded-[1.3vw] shadow-[0_0.8vw_1.7vw_rgba(0,0,0,0.85),inset_0_0.3vh_0.6vh_rgba(255,255,255,0.08)] border-2 p-[0.7vw] flex flex-col gap-[0.6vw] justify-center overflow-hidden" style="background: linear-gradient(135deg, rgba(90,61,37,0.85), rgba(74,47,26,0.9)); border-color: rgba(212,175,55,0.6);">
                    <div class="flex justify-center mb-[0.3vh]">
                        <div class="font-bold text-[0.7vw] uppercase tracking-[0.16em] text-amber-100" style="text-shadow: 0 2px 4px rgba(0,0,0,0.7);">⚡ Quick Actions</div>
                    </div>
                    <button @click="openClothing" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(90,61,37,0.85), rgba(61,40,23,0.9)); border-color: rgba(212,175,55,0.6); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.7);">
                        <span class="text-[1.8vw]">👔</span>
                    </button>
                    
                    <button @click="openGround" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(90,61,37,0.85), rgba(61,40,23,0.9)); border-color: rgba(212,175,55,0.6); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.7);">
                        <span class="text-[1.8vw]">🌍</span>
                    </button>
                    <button @click="openGlovebox" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(90,61,37,0.85), rgba(61,40,23,0.9)); border-color: rgba(212,175,55,0.6); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.7);">
                        <span class="text-[2vw]">🧤</span>
                    </button>
                    <button @click="openTrunk" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(90,61,37,0.85), rgba(61,40,23,0.9)); border-color: rgba(212,175,55,0.6); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.7);">
                        <span class="text-[2vw]">🚗</span>
                    </button>
                    <button @click="openGround" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(90,61,37,0.85), rgba(61,40,23,0.9)); border-color: rgba(212,175,55,0.6); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.7);">
                        <span class="text-[2vw]">🌍</span>
                    </button>
                    <button @click="toggleGiveMode" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(90,61,37,0.85), rgba(61,40,23,0.9)); border-color: rgba(212,175,55,0.6); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.7);">
                        <span class="text-[2vw]">🤝</span>
                    </button>
                    <button @click="toggleSettings" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(90,61,37,0.85), rgba(61,40,23,0.9)); border-color: rgba(212,175,55,0.6); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.7);">
                        <span class="text-[2vw]">⚙️</span>
                    </button>
                    <button @click="handleClose" class="w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105" style="background: linear-gradient(135deg, rgba(139,0,0,0.85), rgba(90,0,0,0.9)); border-color: rgba(220,38,38,0.6); box-shadow: 0 0.4vw 0.8vw rgba(0,0,0,0.7);">
                        <span class="text-[1.8vw] text-red-300 font-bold">✕</span>
                    </button>
                </div>
                
            </div>
        </div>
    </div>
    `;
}

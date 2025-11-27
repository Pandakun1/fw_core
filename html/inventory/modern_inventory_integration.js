// Modern Inventory Integration für FiveM Server
// Vanilla JS - No Vue Dependencies

let visible = false;
let inventory = {
    wallet: [],
    keys: [],
    main: [],
    hotbar: []
};

let maxWeight = 50;
let currentWeight = 0;
let bankAmount = 0;
let cashAmount = 0;

let draggedItem = null;
let draggedFrom = null;

let activeMode = null; // 'give' oder 'use' oder null
let groundItems = [];

// Status-Werte
let playerHealth = 100;
let playerArmor = 0;
let playerHunger = 100;
let playerThirst = 100;

// Geben-System
let giveItems = []; // Items die weitergegeben werden sollen
let giveMode = false; // Ob Geben-Modus aktiv ist
let nearbyPlayers = []; // Spieler in der Nähe
let isProcessingGiveModal = false; // Verhindert doppeltes Öffnen des Modals

// Rucksack-System (Neues permanentes Sekundär-Inventar)
let backpackItems = []; // Items im Rucksack mit Slot-Zuordnung
let backpackMode = false; // Ob Rucksack-Modus aktiv ist
let backpackSavedLeft = false; // Merken-Status links
let backpackSavedRight = false; // Merken-Status rechts
let hotbarSlots = [null, null, null, null, null]; // Hotbar Slots 1-5

// Inject HTML & CSS
function injectModernInventory() {
    const container = document.getElementById('inventory-app');
    
    container.innerHTML = `
        <style>
            /* Modern Design 2018-2025 - Glassmorphism & Clean Aesthetics */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            #modern-inventory {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(10, 15, 25, 0.75);
                backdrop-filter: blur(10px);
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 9999;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
            }

            #modern-inventory.active {
                display: flex;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            /* Main Container - Glassmorphism */
            .inventory-container {
                width: 1240px;
                max-width: 95vw;
                max-height: 90vh;
                background: linear-gradient(145deg, rgba(30, 35, 50, 0.95), rgba(20, 25, 40, 0.95));
                backdrop-filter: blur(25px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 28px;
                box-shadow: 
                    0 25px 80px rgba(0, 0, 0, 0.6),
                    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
                position: relative;
                padding: 80px 32px 32px 32px;
                animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                display: grid;
                grid-template-columns: 290px 1fr 270px;
                gap: 24px;
                overflow: hidden;
            }

            @keyframes slideUp {
                from { transform: translateY(30px) scale(0.96); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
            }

            @keyframes slideInLeft {
                from { transform: translateX(-30px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slideInRight {
                from { transform: translateX(30px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slideInUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            @keyframes fadeOut {
                from { opacity: 1; transform: scale(1); }
                to { opacity: 0; transform: scale(0.95); }
            }

            /* Sequenzielle Animationen für Inventar-Bereiche */
            .inventory-container.animating .left-sidebar {
                animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
            }

            .inventory-container.animating .center-area {
                animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
            }

            .inventory-container.animating .right-sidebar {
                animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
            }

            /* Fade-Out Animation beim Wechsel zu Geben-Modus */
            .hiding {
                animation: fadeOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                pointer-events: none;
            }

            /* Geben-Inventar Container */
            .give-inventory-wrapper {
                display: none;
                grid-column: 1 / -1;
                width: 100%;
                gap: 24px;
                padding: 20px;
            }

            .give-inventory-wrapper.active {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-template-rows: 1fr auto;
                justify-items: center;
                width: 100%;
                animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
            }

            /* Header Bar */
            .inventory-header {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 60px;
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15));
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 24px 24px 0 0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 28px;
            }

            .header-title {
                font-size: 20px;
                font-weight: 700;
                background: linear-gradient(135deg, #818cf8, #c084fc);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: -0.5px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .header-subtitle {
                color: rgba(255, 255, 255, 0.5);
                font-size: 13px;
                font-weight: 500;
                margin-left: 16px;
            }

            /* Close Button - Modern */
            .close-btn {
                width: 36px;
                height: 36px;
                background: rgba(239, 68, 68, 0.15);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 10px;
                color: #ef4444;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .close-btn:hover {
                background: rgba(239, 68, 68, 0.25);
                border-color: rgba(239, 68, 68, 0.5);
                transform: scale(1.05);
            }

            /* Left Sidebar */
            .left-sidebar {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            /* Wallet Card - Skeuomorphic kept */
            .wallet-card {
                background: linear-gradient(135deg, #3e2723 0%, #5d4037 50%, #3e2723 100%);
                border: 1px solid rgba(139, 69, 19, 0.5);
                border-radius: 16px;
                padding: 20px;
                box-shadow: 
                    0 10px 30px rgba(0, 0, 0, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
            }

            .wallet-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: repeating-linear-gradient(
                    90deg,
                    #8b4513 0px,
                    #8b4513 4px,
                    transparent 4px,
                    transparent 8px
                );
            }

            .card-title {
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 16px;
                color: #d4af37;
                display: flex;
                align-items: center;
                gap: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .wallet-slots {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }

            .wallet-item {
                background: rgba(0, 0, 0, 0.3);
                border: 1.5px solid rgba(139, 69, 19, 0.5);
                border-radius: 10px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 70px;
                transition: all 0.2s;
            }

            .wallet-item:hover {
                background: rgba(0, 0, 0, 0.4);
                border-color: #d4af37;
                transform: scale(1.05);
            }

            .wallet-item-icon {
                font-size: 24px;
                margin-bottom: 4px;
            }

            .wallet-item-label {
                font-size: 9px;
                color: #d4af37;
                text-align: center;
                font-weight: 500;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .wallet-item-amount {
                font-size: 13px;
                color: #fbbf24;
                font-weight: 700;
                margin-top: 2px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .wallet-licenses-btn {
                background: rgba(212, 175, 55, 0.1);
                border: 1.5px solid rgba(212, 175, 55, 0.3);
                cursor: pointer;
            }

            .wallet-licenses-btn:hover {
                background: rgba(212, 175, 55, 0.2);
                border-color: #d4af37;
            }

            .wallet-item.empty {
                opacity: 0.4;
                cursor: default;
            }

            .wallet-item.empty:hover {
                transform: none;
                border-color: rgba(139, 69, 19, 0.5);
            }

            /* Key Ring Card - Modern with metal effect */
            .keyring-card {
                background: linear-gradient(135deg, rgba(156, 163, 175, 0.15), rgba(107, 114, 128, 0.15));
                backdrop-filter: blur(10px);
                border: 1px solid rgba(156, 163, 175, 0.3);
                border-radius: 16px;
                padding: 20px;
                flex: 1;
                overflow: hidden;
            }

            .keyring-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-height: 320px;
                overflow-y: auto;
                padding-right: 8px;
            }

            .key-item {
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 12px 14px;
                font-size: 13px;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.9);
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                gap: 10px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .key-item:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(168, 85, 247, 0.5);
                transform: translateX(4px);
            }

            .key-icon {
                font-size: 18px;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
            }

            /* Center Area - Main Inventory */
            .center-area {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .inventory-section {
                background: rgba(255, 255, 255, 0.04);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 18px;
                padding: 24px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                height: fit-content;
            }

            .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 16px;
            }

            .section-title {
                font-size: 14px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.9);
                text-transform: uppercase;
                letter-spacing: 1px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .section-count {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.5);
                background: rgba(255, 255, 255, 0.05);
                padding: 4px 10px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            /* Inventory Grid - Modern */
            .inventory-grid {
                display: grid;
                grid-template-columns: repeat(5, minmax(80px, 100px));
                grid-auto-rows: minmax(80px, 100px);
                column-gap: 10px;
                row-gap: 12px;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 12px 8px 12px 12px;
                max-height: calc((100px * 5) + (12px * 4) + 24px);
                justify-content: center;
            }

            .inventory-grid::-webkit-scrollbar {
                width: 6px;
            }

            .inventory-grid::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
            }

            .inventory-grid::-webkit-scrollbar-thumb {
                background: rgba(129, 140, 248, 0.3);
                border-radius: 3px;
            }

            .inventory-grid::-webkit-scrollbar-thumb:hover {
                background: rgba(129, 140, 248, 0.5);
            }

            /* Item Slot - Elegant Thin Borders */
            .item-slot {
                aspect-ratio: 1;
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border: 1.5px solid rgba(255, 255, 255, 0.12);
                border-radius: 16px;
                padding: 10px;
                cursor: grab;
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                -webkit-user-drag: none;
                -khtml-user-drag: none;
                -moz-user-drag: none;
                -o-user-drag: none;
            }

            .item-slot::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(135deg, rgba(129, 140, 248, 0.1), rgba(192, 132, 252, 0.1));
                opacity: 0;
                transition: opacity 0.3s;
                border-radius: 16px;
            }

            .item-slot:hover {
                background: rgba(129, 140, 248, 0.12);
                border-color: rgba(129, 140, 248, 0.5);
                transform: translateY(-2px) scale(1.03);
                box-shadow: 0 6px 16px rgba(129, 140, 248, 0.25);
            }

            .item-slot:hover::before {
                opacity: 1;
            }

            .item-slot.dragging {
                opacity: 0.5;
                cursor: grabbing;
                transform: scale(0.95) rotate(2deg);
                filter: brightness(0.7);
                transition: all 0.15s ease-out;
            }

            .item-slot.drag-over {
                border-color: #10b981;
                background: rgba(16, 185, 129, 0.15);
                transform: scale(1.08);
                box-shadow: 
                    0 0 0 3px rgba(16, 185, 129, 0.2),
                    0 8px 24px rgba(16, 185, 129, 0.4),
                    inset 0 0 20px rgba(16, 185, 129, 0.1);
                animation: pulse-glow 1s ease-in-out infinite;
            }

            @keyframes pulse-glow {
                0%, 100% { box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2), 0 8px 24px rgba(16, 185, 129, 0.4); }
                50% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.3), 0 12px 32px rgba(16, 185, 129, 0.6); }
            }

            .item-icon {
                width: 48px;
                height: 48px;
                object-fit: contain;
                margin-bottom: 4px;
                filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
                flex-shrink: 0;
                pointer-events: none;
                user-select: none;
            }
            
            .item-icon-fallback {
                font-size: 32px;
                margin-bottom: 4px;
                pointer-events: none;
                user-select: none;
            }

            .item-name {
                color: rgba(255, 255, 255, 0.9);
                font-size: 10px;
                font-weight: 500;
                text-align: center;
                line-height: 1.2;
                max-width: 100%;
                overflow: visible;
                word-wrap: break-word;
                white-space: normal;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
                pointer-events: none;
                user-select: none;
            }

            .item-amount {
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(10px);
                color: #fbbf24;
                padding: 3px 8px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 700;
                border: 1px solid rgba(251, 191, 36, 0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
                pointer-events: none;
                user-select: none;
            }

            /* Ghost Item beim Dragging */
            .drag-ghost {
                position: fixed;
                pointer-events: none;
                z-index: 10000;
                opacity: 0.85;
                transform: scale(1.1) rotate(5deg);
                transition: transform 0.1s ease-out;
                filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
            }

            .drag-ghost .item-slot {
                animation: float 0.6s ease-in-out infinite;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
            }

            /* Item Move Animation */
            @keyframes item-move {
                0% { transform: scale(0.9); opacity: 0.5; }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); opacity: 1; }
            }

            .item-slot.just-moved {
                animation: item-move 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            /* Hotbar - Modern */
            .hotbar-section {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 16px 20px;
                height: 130px;
            }

            .hotbar-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 12px;
                height: 100%;
            }

            .hotbar-slot {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(10px);
                border: 1.5px solid rgba(255, 255, 255, 0.1);
                border-radius: 14px;
                padding: 10px;
                cursor: grab;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .hotbar-slot:hover {
                background: rgba(255, 255, 255, 0.06);
                border-color: rgba(34, 197, 94, 0.5);
                transform: translateY(-3px);
                box-shadow: 0 8px 16px rgba(34, 197, 94, 0.2);
            }

            .hotbar-slot .item-icon {
                font-size: 32px;
            }

            .hotbar-slot .item-name {
                font-size: 10px;
            }

            /* Right Sidebar - Stats */
            .right-sidebar {
                display: flex;
                flex-direction: column;
                gap: 16px;
                overflow-y: auto;
                padding-right: 8px;
            }

            .stats-card {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 20px;
                flex-shrink: 0;
            }

            .stat-item {
                margin-bottom: 20px;
            }

            .stat-item:last-child {
                margin-bottom: 0;
            }

            .stat-label {
                font-size: 12px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.6);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .stat-value {
                font-size: 24px;
                font-weight: 700;
                background: linear-gradient(135deg, #818cf8, #c084fc);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            /* Weight Bar - Modern */
            .weight-bar {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 999px;
                overflow: hidden;
                margin-top: 8px;
                position: relative;
            }

            .weight-fill {
                height: 100%;
                background: linear-gradient(90deg, #10b981, #34d399);
                border-radius: 999px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
            }

            .weight-fill::after {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .weight-fill.warning {
                background: linear-gradient(90deg, #f59e0b, #fbbf24);
            }

            .weight-fill.critical {
                background: linear-gradient(90deg, #ef4444, #f87171);
            }

            .weight-text {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.7);
                margin-top: 8px;
                font-weight: 500;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            /* Status Bars für Leben, Rüstung, Hunger, Durst */
            .status-bar {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 999px;
                overflow: hidden;
                margin-top: 8px;
                position: relative;
            }

            .status-fill {
                height: 100%;
                border-radius: 999px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .health-fill {
                background: linear-gradient(90deg, #ef4444, #f87171);
            }

            .armor-fill {
                background: linear-gradient(90deg, #3b82f6, #60a5fa);
            }

            .hunger-fill {
                background: linear-gradient(90deg, #f59e0b, #fbbf24);
            }

            .thirst-fill {
                background: linear-gradient(90deg, #06b6d4, #22d3ee);
            }

            .status-text {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.7);
                margin-top: 8px;
                font-weight: 500;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            /* Scrollbar - Modern */
            .inventory-grid::-webkit-scrollbar,
            .keyring-list::-webkit-scrollbar {
                width: 8px;
            }

            .inventory-grid::-webkit-scrollbar-track,
            .keyring-list::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 10px;
            }

            .inventory-grid::-webkit-scrollbar-thumb,
            .keyring-list::-webkit-scrollbar-thumb {
                background: rgba(168, 85, 247, 0.3);
                border-radius: 10px;
                transition: background 0.2s;
            }

            .inventory-grid::-webkit-scrollbar-thumb:hover,
            .keyring-list::-webkit-scrollbar-thumb:hover {
                background: rgba(168, 85, 247, 0.5);
            }

            /* Wallet Slot Specific */
            .wallet-slot {
                aspect-ratio: 1;
                background: rgba(0, 0, 0, 0.3);
                border: 1.5px solid rgba(139, 69, 19, 0.5);
                border-radius: 10px;
                padding: 8px;
                cursor: grab;
                transition: all 0.2s;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
            }

            .wallet-slot:hover {
                background: rgba(0, 0, 0, 0.4);
                border-color: #d4af37;
                transform: scale(1.05);
            }

            .wallet-slot .item-icon {
                font-size: 28px;
                margin-bottom: 4px;
            }

            .wallet-slot .item-name {
                font-size: 9px;
                color: #d4af37;
            }

            /* Action Buttons */
            .action-buttons {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 16px;
            }

            .action-btn {
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border: 1.5px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 12px 16px;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                gap: 10px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
                color: rgba(255, 255, 255, 0.9);
                font-size: 13px;
                font-weight: 500;
            }

            .action-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(99, 102, 241, 0.5);
                transform: translateX(4px);
            }

            .action-btn.active {
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
                border-color: rgba(99, 102, 241, 0.8);
            }

            .action-icon {
                font-size: 18px;
            }

            .action-label {
                flex: 1;
            }

            /* Ground Zone */
            .ground-zone {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
            }

            .ground-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                color: rgba(255, 255, 255, 0.9);
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .ground-icon {
                font-size: 16px;
            }

            .ground-drop-area {
                background: rgba(34, 197, 94, 0.05);
                border: 2px dashed rgba(34, 197, 94, 0.3);
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                transition: all 0.2s;
                min-height: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ground-drop-area.drag-over {
                background: rgba(34, 197, 94, 0.15);
                border-color: rgba(34, 197, 94, 0.6);
                transform: scale(1.02);
            }

            .ground-placeholder {
                color: rgba(255, 255, 255, 0.5);
                font-size: 11px;
                font-weight: 500;
                text-align: center;
                line-height: 1.4;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .ground-items-list {
                margin-top: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-height: 200px;
                overflow-y: auto;
            }

            .ground-pickup-btn {
                width: 100%;
                padding: 12px 16px;
                margin-top: 12px;
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
                border: 1.5px solid rgba(34, 197, 94, 0.4);
                border-radius: 12px;
                color: #22c55e;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ground-pickup-btn:hover {
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3));
                border-color: rgba(34, 197, 94, 0.6);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
            }

            .ground-pickup-btn:active {
                transform: translateY(0);
            }

            .ground-pickup-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
                transform: none;
            }

            .ground-item {
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 10px 12px;
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                transition: all 0.2s;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .ground-item:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(34, 197, 94, 0.5);
                transform: translateX(4px);
            }

            .ground-item-icon {
                font-size: 20px;
            }

            .ground-item-info {
                flex: 1;
            }

            .ground-item-name {
                color: rgba(255, 255, 255, 0.9);
                font-size: 12px;
                font-weight: 500;
            }

            .ground-item-amount {
                color: rgba(255, 255, 255, 0.6);
                font-size: 10px;
            }

            /* Pickup Modal */
            .pickup-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(8px);
                align-items: center;
                justify-content: center;
                z-index: 10002;
                animation: fadeIn 0.2s ease;
            }

            .pickup-modal.active {
                display: flex;
            }

            .pickup-modal-content {
                background: linear-gradient(145deg, rgba(30, 35, 50, 0.98), rgba(20, 25, 40, 0.98));
                backdrop-filter: blur(20px);
                border: 1.5px solid rgba(255, 255, 255, 0.15);
                border-radius: 24px;
                padding: 32px;
                width: 600px;
                max-width: 90vw;
                max-height: 80vh;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .pickup-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .pickup-modal-title {
                font-size: 24px;
                font-weight: 700;
                background: linear-gradient(135deg, #22c55e, #10b981);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .pickup-modal-close {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 10px;
                color: #ef4444;
                font-size: 24px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .pickup-modal-close:hover {
                background: rgba(239, 68, 68, 0.3);
                transform: scale(1.1);
            }

            .pickup-modal-body {
                overflow-y: auto;
                max-height: 60vh;
            }

            .pickup-items-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 16px;
            }

            .pickup-item-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1.5px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }

            .pickup-item-card:hover {
                background: rgba(34, 197, 94, 0.15);
                border-color: rgba(34, 197, 94, 0.5);
                transform: translateY(-4px) scale(1.02);
                box-shadow: 0 8px 20px rgba(34, 197, 94, 0.2);
            }

            .pickup-item-image {
                width: 64px;
                height: 64px;
                object-fit: contain;
                border-radius: 12px;
            }

            .pickup-item-info {
                text-align: center;
                width: 100%;
            }

            .pickup-item-name {
                font-size: 14px;
                font-weight: 600;
                color: #fff;
                margin-bottom: 4px;
            }

            .pickup-item-amount {
                font-size: 12px;
                color: rgba(34, 197, 94, 0.8);
                font-weight: 600;
            }

            .pickup-empty {
                text-align: center;
                padding: 40px 20px;
                color: rgba(255, 255, 255, 0.4);
                font-size: 14px;
            }

            /* Pickup Modal */
            .pickup-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(8px);
                align-items: center;
                justify-content: center;
                z-index: 10002;
                animation: fadeIn 0.2s ease;
            }

            .pickup-modal.active {
                display: flex;
            }

            .pickup-modal-content {
                background: linear-gradient(145deg, rgba(30, 35, 50, 0.98), rgba(20, 25, 40, 0.98));
                backdrop-filter: blur(20px);
                border: 1.5px solid rgba(255, 255, 255, 0.15);
                border-radius: 24px;
                padding: 32px;
                width: 600px;
                max-width: 90vw;
                max-height: 80vh;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .pickup-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .pickup-modal-title {
                font-size: 24px;
                font-weight: 700;
                background: linear-gradient(135deg, #22c55e, #10b981);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .pickup-modal-close {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 10px;
                color: #ef4444;
                font-size: 24px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .pickup-modal-close:hover {
                background: rgba(239, 68, 68, 0.3);
                transform: scale(1.1);
            }

            .pickup-modal-body {
                overflow-y: auto;
                max-height: 60vh;
            }

            .pickup-items-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 16px;
            }

            .pickup-item-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1.5px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }

            .pickup-item-card:hover {
                background: rgba(34, 197, 94, 0.15);
                border-color: rgba(34, 197, 94, 0.5);
                transform: translateY(-4px) scale(1.02);
                box-shadow: 0 8px 20px rgba(34, 197, 94, 0.2);
            }

            .pickup-item-image {
                width: 64px;
                height: 64px;
                object-fit: contain;
                border-radius: 12px;
            }

            .pickup-item-info {
                text-align: center;
                width: 100%;
            }

            .pickup-item-name {
                font-size: 14px;
                font-weight: 600;
                color: #fff;
                margin-bottom: 4px;
            }

            .pickup-item-amount {
                font-size: 12px;
                color: rgba(34, 197, 94, 0.8);
                font-weight: 600;
            }

            .pickup-empty {
                text-align: center;
                padding: 40px 20px;
                color: rgba(255, 255, 255, 0.4);
                font-size: 14px;
            }

            /* Geben Modal */
            .give-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease-out;
            }

            .give-modal.active {
                display: flex;
            }

            .give-modal-content {
                background: linear-gradient(145deg, rgba(30, 35, 50, 0.98), rgba(20, 25, 40, 0.98));
                backdrop-filter: blur(25px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 24px;
                padding: 32px;
                width: 920px;
                max-height: 85vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
                animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .give-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 24px;
            }

            .give-modal-title {
                font-size: 20px;
                font-weight: 700;
                background: linear-gradient(135deg, #818cf8, #c084fc);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .give-modal-close {
                width: 32px;
                height: 32px;
                background: rgba(239, 68, 68, 0.15);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 8px;
                color: #ef4444;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .give-modal-close:hover {
                background: rgba(239, 68, 68, 0.25);
                transform: scale(1.05);
            }

            .give-modal-body {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: 24px;
                flex: 1;
                overflow: hidden;
            }

            .give-panel {
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 18px;
                padding: 20px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .give-panel-title {
                font-size: 12px;
                font-weight: 700;
                color: rgba(255, 255, 255, 0.7);
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .give-items-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                overflow-y: auto;
                overflow-x: hidden;
                flex: 1;
                padding-right: 8px;
            }

            .give-items-list::-webkit-scrollbar {
                width: 6px;
            }

            .give-items-list::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
            }

            .give-items-list::-webkit-scrollbar-thumb {
                background: rgba(129, 140, 248, 0.3);
                border-radius: 3px;
            }

            .give-items-list::-webkit-scrollbar-thumb:hover {
                background: rgba(129, 140, 248, 0.5);
            }

            .give-item {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 14px;
                padding: 14px;
                display: flex;
                align-items: center;
                gap: 14px;
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                flex-shrink: 0;
            }

            .give-item:hover {
                background: rgba(129, 140, 248, 0.15);
                border-color: rgba(129, 140, 248, 0.5);
                transform: translateX(4px);
            }

            .give-item-disabled {
                opacity: 0.4;
                cursor: not-allowed;
                pointer-events: none;
            }

            .give-item-disabled:hover {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.1);
                transform: none;
            }

            .give-item-icon {
                font-size: 24px;
                flex-shrink: 0;
            }

            .give-item-info {
                flex: 1;
            }

            .give-item-name {
                font-size: 13px;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.9);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .give-item-amount {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.6);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .give-item-remove {
                width: 24px;
                height: 24px;
                background: rgba(239, 68, 68, 0.15);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 6px;
                color: #ef4444;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
            }

            .give-item-remove:hover {
                background: rgba(239, 68, 68, 0.25);
            }

            .give-modal-footer {
                display: flex;
                gap: 16px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
            }

            .give-modal-btn {
                flex: 1;
                padding: 16px 24px;
                border: 1px solid;
                border-radius: 14px;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .give-modal-btn-cancel {
                background: rgba(239, 68, 68, 0.1);
                border-color: rgba(239, 68, 68, 0.3);
                color: #ef4444;
            }

            .give-modal-btn-cancel:hover {
                background: rgba(239, 68, 68, 0.2);
                border-color: rgba(239, 68, 68, 0.5);
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(239, 68, 68, 0.2);
            }

            .give-modal-btn-confirm {
                background: linear-gradient(135deg, rgba(129, 140, 248, 0.2), rgba(192, 132, 252, 0.2));
                border-color: rgba(129, 140, 248, 0.5);
                color: #fff;
            }

            .give-modal-btn-confirm:hover {
                background: linear-gradient(135deg, rgba(129, 140, 248, 0.3), rgba(192, 132, 252, 0.3));
                border-color: rgba(129, 140, 248, 0.7);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(129, 140, 248, 0.3);
            }

            .give-empty {
                text-align: center;
                padding: 60px 20px;
                color: rgba(255, 255, 255, 0.4);
                font-size: 14px;
                font-weight: 500;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            /* Lizenzen Modal */
            .licenses-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease-out;
            }

            .licenses-modal.active {
                display: flex;
            }

            .licenses-modal-content {
                background: rgba(20, 25, 35, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 30px;
                width: 700px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .licenses-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 24px;
            }

            .licenses-modal-title {
                font-size: 20px;
                font-weight: 700;
                background: linear-gradient(135deg, #d4af37, #f4d03f);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .licenses-modal-close {
                width: 32px;
                height: 32px;
                background: rgba(239, 68, 68, 0.15);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 8px;
                color: #ef4444;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .licenses-modal-close:hover {
                background: rgba(239, 68, 68, 0.25);
                transform: scale(1.05);
            }

            .licenses-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 16px;
            }

            .license-card {
                background: rgba(255, 255, 255, 0.03);
                border: 1.5px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 16px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
            }

            .license-card:hover {
                background: rgba(255, 255, 255, 0.06);
                border-color: rgba(212, 175, 55, 0.5);
                transform: translateY(-4px);
                box-shadow: 0 12px 24px rgba(212, 175, 55, 0.2);
            }

            .license-card-icon {
                font-size: 48px;
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
            }

            .license-card-info {
                text-align: center;
                width: 100%;
            }

            .license-card-name {
                font-size: 14px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.9);
                margin-bottom: 4px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .license-card-amount {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .license-card-weight {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.4);
                margin-top: 4px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .licenses-empty {
                text-align: center;
                padding: 60px 20px;
                color: rgba(255, 255, 255, 0.5);
                font-size: 14px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .license-card-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
                width: 100%;
            }

            .license-btn {
                flex: 1;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: rgba(255, 255, 255, 0.9);
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            }

            .license-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(212, 175, 55, 0.5);
                transform: translateY(-2px);
            }

            .license-btn-show {
                background: rgba(59, 130, 246, 0.15);
                border-color: rgba(59, 130, 246, 0.3);
                color: #3b82f6;
            }

            .license-btn-show:hover {
                background: rgba(59, 130, 246, 0.25);
                border-color: rgba(59, 130, 246, 0.5);
            }

            .license-btn-view {
                background: rgba(16, 185, 129, 0.15);
                border-color: rgba(16, 185, 129, 0.3);
                color: #10b981;
            }

            .license-btn-view:hover {
                background: rgba(16, 185, 129, 0.25);
                border-color: rgba(16, 185, 129, 0.5);
            }

            /* ID Card Modal */
            #id-card-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                animation: fadeIn 0.2s ease-out;
            }

            #id-card-modal.active {
                display: flex;
            }

            #id-card-modal-content {
                background: rgba(20, 25, 35, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 40px;
                width: 400px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .id-card-header {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 30px;
            }

            .id-card-header img.id-card-image {
                width: 100px;
                height: 100px;
                object-fit: contain;
                margin-bottom: 16px;
            }

            .id-card-header h3 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                background: linear-gradient(135deg, #818cf8, #c084fc);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .id-card-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .id-card-btn {
                padding: 16px 24px;
                border-radius: 12px;
                border: 1px solid;
                background: transparent;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .id-card-btn:hover {
                transform: translateY(-2px);
            }

            .id-card-btn-show {
                background: rgba(59, 130, 246, 0.15);
                border-color: rgba(59, 130, 246, 0.3);
                color: #3b82f6;
            }

            .id-card-btn-show:hover {
                background: rgba(59, 130, 246, 0.25);
                border-color: rgba(59, 130, 246, 0.5);
            }

            .id-card-btn-view {
                background: rgba(16, 185, 129, 0.15);
                border-color: rgba(16, 185, 129, 0.3);
                color: #10b981;
            }

            .id-card-btn-view:hover {
                background: rgba(16, 185, 129, 0.25);
                border-color: rgba(16, 185, 129, 0.5);
            }

            /* Amount Selector Modal */
            .amount-selector-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10002;
                animation: fadeIn 0.2s ease-out;
            }

            .amount-selector-modal.active {
                display: flex;
            }

            .amount-selector-content {
                background: linear-gradient(145deg, rgba(30, 35, 50, 0.98), rgba(20, 25, 40, 0.98));
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 40px;
                width: 450px;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
                animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .amount-selector-header {
                text-align: center;
                margin-bottom: 32px;
            }

            .amount-selector-header img {
                margin-bottom: 16px;
                filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3));
            }

            .amount-selector-header h3 {
                margin: 0 0 8px 0;
                font-size: 24px;
                font-weight: 700;
                background: linear-gradient(135deg, #818cf8, #c084fc);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .amount-selector-header p {
                margin: 0;
                color: rgba(255, 255, 255, 0.6);
                font-size: 14px;
            }

            .amount-available {
                color: #818cf8;
                font-weight: 600;
            }

            .amount-selector-body {
                margin-bottom: 32px;
            }

            .amount-display {
                text-align: center;
                margin-bottom: 24px;
            }

            .amount-value {
                font-size: 56px;
                font-weight: 700;
                background: linear-gradient(135deg, #818cf8, #c084fc);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-shadow: 0 0 40px rgba(129, 140, 248, 0.3);
            }

            .amount-slider-container {
                margin-bottom: 24px;
            }

            .amount-slider {
                width: 100%;
                height: 8px;
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.1);
                outline: none;
                -webkit-appearance: none;
                appearance: none;
                cursor: pointer;
            }

            .amount-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: linear-gradient(135deg, #818cf8, #c084fc);
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(129, 140, 248, 0.5);
                transition: all 0.2s ease;
            }

            .amount-slider::-webkit-slider-thumb:hover {
                transform: scale(1.2);
                box-shadow: 0 6px 20px rgba(129, 140, 248, 0.7);
            }

            .amount-slider::-moz-range-thumb {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: linear-gradient(135deg, #818cf8, #c084fc);
                cursor: pointer;
                border: none;
                box-shadow: 0 4px 12px rgba(129, 140, 248, 0.5);
                transition: all 0.2s ease;
            }

            .amount-slider::-moz-range-thumb:hover {
                transform: scale(1.2);
                box-shadow: 0 6px 20px rgba(129, 140, 248, 0.7);
            }

            .amount-slider-labels {
                display: flex;
                justify-content: space-between;
                margin-top: 8px;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.5);
            }

            .amount-quick-buttons {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
                margin-bottom: 20px;
            }

            .amount-quick-btn {
                padding: 12px;
                background: rgba(129, 140, 248, 0.1);
                border: 1px solid rgba(129, 140, 248, 0.3);
                border-radius: 12px;
                color: #818cf8;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .amount-quick-btn:hover {
                background: rgba(129, 140, 248, 0.2);
                border-color: rgba(129, 140, 248, 0.5);
                transform: translateY(-2px);
            }

            .amount-input-container {
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 8px;
            }

            .amount-btn {
                width: 40px;
                height: 40px;
                background: rgba(129, 140, 248, 0.15);
                border: 1px solid rgba(129, 140, 248, 0.3);
                border-radius: 8px;
                color: #818cf8;
                font-size: 20px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .amount-btn:hover {
                background: rgba(129, 140, 248, 0.25);
                transform: scale(1.05);
            }

            .amount-input {
                flex: 1;
                background: transparent;
                border: none;
                color: white;
                font-size: 24px;
                font-weight: 600;
                text-align: center;
                outline: none;
            }

            .amount-input::-webkit-inner-spin-button,
            .amount-input::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }

            .amount-selector-footer {
                display: flex;
                gap: 12px;
            }

            .amount-btn-cancel,
            .amount-btn-confirm {
                flex: 1;
                padding: 16px;
                border-radius: 12px;
                border: 1px solid;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .amount-btn-cancel {
                background: rgba(239, 68, 68, 0.1);
                border-color: rgba(239, 68, 68, 0.3);
                color: #ef4444;
            }

            .amount-btn-cancel:hover {
                background: rgba(239, 68, 68, 0.2);
                border-color: rgba(239, 68, 68, 0.5);
                transform: translateY(-2px);
            }

            .amount-btn-confirm {
                background: linear-gradient(135deg, rgba(129, 140, 248, 0.2), rgba(192, 132, 252, 0.2));
                border-color: rgba(129, 140, 248, 0.5);
                color: #818cf8;
            }

            .amount-btn-confirm:hover {
                background: linear-gradient(135deg, rgba(129, 140, 248, 0.3), rgba(192, 132, 252, 0.3));
                border-color: rgba(129, 140, 248, 0.7);
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(129, 140, 248, 0.3);
            }

            /* Rucksack-Inventar Styles (Neues permanentes Sekundär-Inventar) */
            .backpack-inventory-wrapper {
                display: none;
                grid-column: 1 / -1;
                width: 100%;
                gap: 32px;
                padding: 20px;
                justify-content: center;
                align-items: flex-start;
            }

            .backpack-inventory-wrapper.active {
                display: flex;
            }

            .backpack-inventory-panel {
                background: linear-gradient(145deg, rgba(30, 35, 50, 0.8), rgba(20, 25, 40, 0.8));
                border: 1px solid rgba(129, 140, 248, 0.2);
                border-radius: 20px;
                padding: 24px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                min-width: 600px;
                max-width: 600px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }

            .backpack-panel-header {
                text-align: center;
                padding-bottom: 16px;
                border-bottom: 2px solid rgba(129, 140, 248, 0.2);
            }

            .backpack-panel-header h3 {
                font-size: 22px;
                font-weight: 700;
                color: #fff;
                margin-bottom: 6px;
                text-shadow: 0 2px 8px rgba(129, 140, 248, 0.3);
            }

            .backpack-panel-header p {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.6);
            }

            .backpack-inventory-grid {
                display: grid;
                grid-template-columns: repeat(5, minmax(90px, 110px));
                grid-auto-rows: minmax(90px, 110px);
                column-gap: 10px;
                row-gap: 10px;
                max-height: calc((110px * 5) + (10px * 4) + 24px); /* 5 Reihen + Gaps + Padding */
                justify-content: center;
                padding: 12px;
                border-radius: 12px;
                background: rgba(0, 0, 0, 0.3);
                overflow-y: auto;
            }

            .backpack-inventory-grid::-webkit-scrollbar {
                width: 8px;
            }

            .backpack-inventory-grid::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }

            .backpack-inventory-grid::-webkit-scrollbar-thumb {
                background: rgba(129, 140, 248, 0.5);
                border-radius: 4px;
            }

            .backpack-inventory-grid::-webkit-scrollbar-thumb:hover {
                background: rgba(129, 140, 248, 0.7);
            }

            .backpack-hotbar {
                display: grid;
                grid-template-columns: repeat(5, minmax(90px, 110px));
                gap: 10px;
                justify-content: center;
                margin-top: 8px;
                padding: 16px 12px 12px 12px;
                border-top: 2px solid rgba(129, 140, 248, 0.3);
                background: rgba(129, 140, 248, 0.05);
                border-radius: 12px;
            }

            .backpack-hotbar .item-slot {
                position: relative;
                background: rgba(129, 140, 248, 0.08);
                border-color: rgba(129, 140, 248, 0.3);
            }

            .backpack-hotbar .item-slot::before {
                content: attr(data-key);
                position: absolute;
                top: 4px;
                left: 4px;
                background: rgba(129, 140, 248, 0.8);
                color: #fff;
                font-size: 10px;
                font-weight: 700;
                padding: 2px 6px;
                border-radius: 4px;
                z-index: 2;
            }

            .backpack-hotbar .item-slot:hover {
                border-color: rgba(129, 140, 248, 0.6);
                background: rgba(129, 140, 248, 0.15);
            }

            .backpack-actions {
                display: flex;
                gap: 12px;
                margin-top: 8px;
                padding-top: 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .backpack-btn {
                flex: 1;
                padding: 14px 20px;
                border: none;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .backpack-btn .btn-icon {
                font-size: 18px;
            }

            .backpack-btn-cancel {
                background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }

            .backpack-btn-cancel:hover {
                background: rgba(239, 68, 68, 0.25);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            }

            .backpack-btn-save {
                background: rgba(245, 158, 11, 0.15);
                color: #f59e0b;
                border: 1px solid rgba(245, 158, 11, 0.3);
            }

            .backpack-btn-save:hover {
                background: rgba(245, 158, 11, 0.25);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
            }

            .backpack-btn-save.active {
                background: rgba(245, 158, 11, 0.3);
                border-color: rgba(245, 158, 11, 0.5);
            }

            .backpack-btn-confirm {
                background: linear-gradient(135deg, rgba(129, 140, 248, 0.2), rgba(192, 132, 252, 0.2));
                color: #818cf8;
                border: 1px solid rgba(129, 140, 248, 0.3);
            }

            .backpack-btn-confirm:hover {
                background: linear-gradient(135deg, rgba(129, 140, 248, 0.3), rgba(192, 132, 252, 0.3));
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(129, 140, 248, 0.4);
            }

            .backpack-btn-confirm:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            /* Geben-Inventar Styles */
            .give-inventory-panel {
                background: linear-gradient(145deg, rgba(30, 35, 50, 0.6), rgba(20, 25, 40, 0.6));
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 14px;
                width: 100%;
                max-width: 600px;
            }

            .give-panel-header {
                text-align: center;
                padding-bottom: 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(129, 140, 248, 0.05);
                border-radius: 12px;
                padding: 16px;
            }

            .give-panel-header h3 {
                font-size: 20px;
                font-weight: 800;
                color: #fff;
                margin-bottom: 6px;
            }

            .give-panel-header p {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.6);
                font-weight: 500;
            }

            .give-inventory-grid {
                display: grid;
                grid-template-columns: repeat(5, minmax(80px, 100px));
                grid-auto-rows: minmax(80px, 100px);
                column-gap: 8px;
                row-gap: 24px;
                justify-content: center;
                padding: 12px;
                border-radius: 16px;
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow-y: auto;
                max-height: calc((100px * 3) + (24px * 2) + 24px);
            }
            
            .give-inventory-grid::-webkit-scrollbar {
                width: 8px;
            }
            
            .give-inventory-grid::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }
            
            .give-inventory-grid::-webkit-scrollbar-thumb {
                background: rgba(129, 140, 248, 0.3);
                border-radius: 4px;
            }
            
            .give-inventory-grid::-webkit-scrollbar-thumb:hover {
                background: rgba(129, 140, 248, 0.5);
            }
            
            .give-hotbar-slots {
                display: grid;
                grid-column: 1 / -1;
                grid-template-columns: repeat(5, minmax(80px, 100px));
                gap: 8px;
                margin-bottom: 4px;
                padding-bottom: 3px;
                border-bottom: 2px solid rgba(129, 140, 248, 0.3);
                justify-content: center;
            }
            
            #give-player-inventory {
                max-height: calc((100px * 4) + (24px * 3) + 24px);
            }
        </style>
        
        <div id="modern-inventory">
            <!-- Header -->
            <div class="inventory-header">
                <div style="display: flex; align-items: center;">
                    <div class="header-title">INVENTAR</div>
                    <div class="header-subtitle">Organisiere deine Items</div>
                </div>
                <div class="close-btn" onclick="closeInventory()">×</div>
            </div>

            <!-- Left Sidebar -->
            <div class="left-sidebar">
                <!-- Wallet Card -->
                <div class="wallet-card">
                    <div class="card-title">
                        <span>💳</span>
                        <span>Geldbeutel</span>
                    </div>
                    <div class="wallet-slots" id="wallet-slots"></div>
                </div>

                <!-- Key Ring Card -->
                <div class="keyring-card">
                    <div class="card-title" style="color: rgba(255, 255, 255, 0.9);">
                        <span>🔑</span>
                        <span>Schlüsselbund</span>
                    </div>
                    <div class="keyring-list" id="keyring-list"></div>
                </div>
            </div>

            <!-- Center Area -->
            <div class="center-area">
                <!-- Main Inventory -->
                <div class="inventory-section">
                    <div class="section-header">
                        <div class="section-title">Hauptinventar</div>
                        <div class="section-count">
                            <span id="slots-used">0</span> / <span id="slots-total">30</span>
                        </div>
                    </div>
                    <div class="inventory-grid" id="inventory-grid"></div>
                </div>

                <!-- Hotbar -->
                <div class="hotbar-section">
                    <div class="hotbar-grid" id="hotbar-grid"></div>
                </div>
            </div>

            <!-- Right Sidebar - Stats -->
            <div class="right-sidebar">
                <div class="stats-card">
                    <div class="card-title" style="color: rgba(255, 255, 255, 0.9);">
                        <span>📊</span>
                        <span>Statistiken</span>
                    </div>

                    <div class="stat-item">
                        <div class="stat-label">Gewicht</div>
                        <div class="weight-bar">
                            <div class="weight-fill" id="weight-fill" style="width: 0%"></div>
                        </div>
                        <div class="weight-text" id="weight-text">0 / 50 kg</div>
                    </div>

                    <div class="stat-item">
                        <div class="stat-label">Bargeld</div>
                        <div class="stat-value">$<span id="money-amount">0</span></div>
                    </div>

                    <div class="stat-item">
                        <div class="stat-label">Bank</div>
                        <div class="stat-value" style="background: linear-gradient(135deg, #34d399, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            $<span id="bank-amount">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div
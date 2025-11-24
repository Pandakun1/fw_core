const NOTIFY_LIMIT = 3; // Maximale Anzahl gleichzeitig sichtbarer Benachrichtigungen
let notifyQueue = [];
let activeNotifies = 0;

/**
 * Erstellt die HTML-Box und startet die Einblend-/Ausblendanimation.
 * @param {object} notifyData - { text, time, type }
 */
function createAndShowNotify(notifyData) {
    const container = document.getElementById("notify-container");
    if (!container) return;

    // Erhöht den Zähler der aktiven Benachrichtigungen
    activeNotifies++;

    // 1. Box erstellen
    const box = document.createElement("div");
    box.innerText = notifyData.text;
    
    // 2. Klassen und Typ zuweisen
    box.classList.add("notify-box", "fade-in", notifyData.notifyType);
    
    // 3. Zur Warteschlange hinzufügen (am Anfang, damit neue oben erscheinen)
    container.prepend(box); 

    // 4. Timer zum Entfernen starten
    setTimeout(() => {
        // Starte Fade-Out Animation
        box.classList.replace("fade-in", "fade-out");

        // Nach Abschluss der Animation die Box komplett aus dem DOM entfernen
        box.addEventListener('animationend', () => {
            box.remove();
            activeNotifies--; // Zähler reduzieren
            
            // Prüfe, ob Benachrichtigungen in der Warteschlange sind und Platz frei wurde
            if (notifyQueue.length > 0) {
                const nextNotify = notifyQueue.shift();
                createAndShowNotify(nextNotify);
            }
        }, { once: true }); // Stellt sicher, dass der Listener nur einmal ausgelöst wird
        
    }, notifyData.time);
}

// Hauptfunktion, die eine Benachrichtigung in die Warteschlange stellt oder direkt anzeigt
function queueOrShowNotify(text, time, type) {
    const notifyData = {
        text: text,
        time: time,
        notifyType: type
    };

    if (activeNotifies < NOTIFY_LIMIT) {
        // Platz frei: Sofort anzeigen
        createAndShowNotify(notifyData);
    } else {
        // Limit erreicht: Zur Warteschlange hinzufügen
        notifyQueue.push(notifyData);
    }
}

// Event-Listener für NUI-Nachrichten
window.addEventListener("message", function (event) {
    const data = event.data;
    if (data.type === "showNotify") {
        const text = data.text || "Benachrichtigung";
        const time = data.time || 4500;
        const type = data.notifyType || "info"; 
        
        queueOrShowNotify(text, time, type);
    }
});
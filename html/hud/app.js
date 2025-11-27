window.addEventListener("message", function (event) {
    const data = event.data;

    if (data.action === "updateHud") {
        if (data.playerId !== undefined) {
            const el = document.getElementById("playerId");
            if (el) el.innerText = data.playerId;
        }
        if (data.cash !== undefined) {
            const el = document.getElementById("cash");
            if (el) el.innerText = "$" + data.cash.toLocaleString();
        }
        if (data.bank !== undefined) {
            const el = document.getElementById("bank");
            if (el) el.innerText = "$" + data.bank.toLocaleString();
        }
        if (data.speed !== undefined) {
            const el = document.getElementById("speed");
            if (el) el.innerText = data.speed + " km/h";
        }
    }

    if (data.action === "toggleHud") {
        const hud = document.getElementById("hud");
        if (hud) hud.style.display = data.state ? "block" : "none";
    }

    if (event.data.type === "showNotify") {
        const box = document.getElementById("notify");
        if (box) {
            box.innerText = event.data.text;
            box.style.display = "block";

            setTimeout(() => {
                box.style.display = "none";
            }, event.data.time);
        }
    }
});

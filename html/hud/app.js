window.addEventListener("message", function (event) {
    const data = event.data;

    if (data.action === "updateHud") {
        if (data.playerId !== undefined) {
            document.getElementById("playerId").innerText = data.playerId;
        }
        if (data.cash !== undefined) {
            document.getElementById("cash").innerText = "$" + data.cash.toLocaleString();
        }
        if (data.bank !== undefined) {
            document.getElementById("bank").innerText = "$" + data.bank.toLocaleString();
        }
        if (data.speed !== undefined) {
            document.getElementById("speed").innerText = data.speed + " km/h";
        }
    }

    if (data.action === "toggleHud") {
        const hud = document.getElementById("hud");
        hud.style.display = data.state ? "block" : "none";
    }

    if (event.data.type === "showNotify") {
        const box = document.getElementById("notify");
        box.innerText = event.data.text;
        box.style.display = "block";

        setTimeout(() => {
            box.style.display = "none";
        }, event.data.time);
    }
});

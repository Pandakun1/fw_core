FW = FW or {}
FW.Admin = FW.Admin or {}

function FW.Admin.RevivePlayer()
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)

    -- Falls du noch in der "tot"-Cam hängst, einmal sauber resurrecten
    NetworkResurrectLocalPlayer(coords.x, coords.y, coords.z + 0.5, heading, true, true, false)

    -- Health setzen
    local maxHealth = GetEntityMaxHealth(ped)
    SetEntityHealth(ped, maxHealth)

    -- Blut & Effekte weg
    ClearPedBloodDamage(ped)
    ResetPedVisibleDamage(ped)
    ClearPedTasksImmediately(ped)
    SetPedArmour(ped, 0)

    -- Sicherstellen, dass du nicht in Ragdoll hängst
    SetPedCanRagdoll(ped, true)
    ClearPedSecondaryTask(ped)

    -- Optional: bisschen Quality of Life
    SetGameplayCamRelativePitch(0.0, 1.0)
    SetPedDiesInWater(ped, false)
    SetPedDiesInSinkingVehicle(ped, false)

    print("[FW] Self-Revive ausgeführt")
end

-- Command /selfrevive
RegisterCommand("selfrevive", function()
    FW.Admin.RevivePlayer()
end, false)

-- Keybinding: Standard F3 -> ruft Command "selfrevive" auf
RegisterKeyMapping("selfrevive", "Self-Revive (eigener Spieler)", "keyboard", "F3")

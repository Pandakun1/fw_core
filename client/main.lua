-- fw_core/client/main.lua
FW = FW or {}
FW.Client = FW.Client or {}

function GetCoreObject()
    return FW
end
exports('GetCoreObject', GetCoreObject)

local started = false

-- Initialisierung beim Start
AddEventHandler('onClientResourceStart', function(resName)
    if resName ~= GetCurrentResourceName() then return end
    while not NetworkIsPlayerActive(PlayerId()) do Wait(50) end
    
    if not started then
        started = true
        ShutdownLoadingScreen()
        ShutdownLoadingScreenNui()
        Wait(2500)
        -- TriggerServerEvent('fw:loadPlayer', ...) -- Je nach Framework Logik
        
        -- NEU: Multicharacter über das neue Modul öffnen
        TriggerEvent('fw:client:openMultichar')
    end
end)

function FW.Client.PlayerData()
    FW.TriggerCallback("fw:getPlayer", function(Player)
        while Player == nil do Wait(100) end
        return Player
    end)
end

-- Clipboard Helper (kann bleiben)
RegisterNetEvent('fw:CopyToClipboard', function(text)
    SendNUIMessage({ action = "copy", text = text })
end)
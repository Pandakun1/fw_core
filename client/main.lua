FW = FW or {}
FW.Client = FW.Client or {}

function GetCoreObject()
    return FW
end

exports('GetCoreObject', GetCoreObject)

local started = false
AddEventHandler('onClientResourceStart', function(resName)
    if resName ~= GetCurrentResourceName() then return end
    while not NetworkIsPlayerActive(PlayerId()) do
        Wait(50)
    end
    if started == false then
        started = true
        ShutdownLoadingScreen()
        ShutdownLoadingScreenNui()
        Wait(2500)
        --TriggerServerEvent('fw:loadPlayer', GetPlayerServerId(PlayerId()))
        --Wait(5000)
        --TriggerServerEvent('fw:playerReady', GetPlayerServerId(PlayerId()))
    end
end)



function FW.Client.PlayerData()
    FW.TriggerCallback("fw:getPlayer", function(Player)
        while Player == nil do Wait(100) end
        local player = Player
        return player
    end)
end

function FW.CopyToClipboard(text)
    SendNUIMessage({
        action = "copy",
        text = text
    })
end

RegisterNetEvent('fw:CopyToClipboard', function(text)
    FW.CopyToClipboard(text)
end)

-- Character Creator notifications
RegisterNetEvent('charcreator:client:notify', function(message, type)
    SendNUIMessage({
        action = 'notify',
        message = message,
        type = type or 'info'
    })
end)

-- NEU: Multichar beim Spawn aktivieren
local hasLoadedMultichar = false
local SelectionCam = nil
local InCharSelection = false

AddEventHandler('onClientResourceStart', function(resName)
    if resName ~= GetCurrentResourceName() then return end
    
    while not NetworkIsPlayerActive(PlayerId()) do
        Wait(50)
    end
    
    Wait(1000)
    
    if not hasLoadedMultichar then
        hasLoadedMultichar = true
        OpenCharacterSelection()
    end
end)

-- Character Selection öffnen
function OpenCharacterSelection()
    InCharSelection = true
    
    FW.TriggerCallback('charcreator:loadCharacters', function(characters)
        if not characters then characters = {} end
        
        -- UI öffnen
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = 'openCharSelection',
            characters = characters,
            maxChars = Config.MaxCharacters
        })
        
        -- Screen Fade
        DoScreenFadeOut(500)
        Wait(500)
        DoScreenFadeIn(1000)
    end)
end

-- NUI Callbacks for Character Selection
RegisterNUICallback('selectCharacter', function(data, cb)
    print('[FW Client] Character selected: ' .. tostring(data.charid))
    InCharSelection = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'hideUI' })
    
    TriggerServerEvent('charcreator:server:selectCharacter', data.charid)
    cb('ok')
end)

RegisterNUICallback('deleteCharacter', function(data, cb)
    TriggerServerEvent('charcreator:server:deleteCharacter', data.charid)
    -- Focus bleibt aktiv, Character Selection ist noch offen
    cb('ok')
end)

RegisterNUICallback('openCharCreator', function(data, cb)
    -- Open character creator UI (Focus bleibt aktiv)
    SendNUIMessage({
        action = 'openCharCreator'
    })
    cb('ok')
end)

RegisterNUICallback('closeCharCreator', function(data, cb)
    -- Reopen character selection (Focus bleibt aktiv)
    OpenCharacterSelection()
    cb('ok')
end)

RegisterNUICallback('createCharacter', function(data, cb)
    print('[FW Client] Creating character')
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'hideUI' })
    TriggerServerEvent('charcreator:server:createCharacter', data)
    cb('ok')
end)

RegisterNUICallback('openAppearance', function(data, cb)
    -- Wechselt zu Appearance Editor (Focus bleibt aktiv)
    SendNUIMessage({
        action = 'openAppearance',
        currentSkin = data.currentSkin,
        fromCreator = true
    })
    cb('ok')
end)

RegisterNUICallback('closeAppearance', function(data, cb)
    if data.returnToCreator then
        -- Zurück zu Creator (Focus bleibt aktiv, fromAppearance flag)
        SendNUIMessage({
            action = 'openCharCreator',
            fromAppearance = true
        })
    else
        -- Komplett schließen
        SetNuiFocus(false, false)
    end
    cb('ok')
end)

RegisterNUICallback('saveAppearance', function(data, cb)
    if data.returnToCreator then
        -- Update skin data in character creator und zurück mit fromAppearance flag
        SendNUIMessage({
            action = 'openCharCreator',
            skin = data.skin,
            fromAppearance = true
        })
    else
        -- Save to server (for existing characters)
        TriggerServerEvent('charcreator:server:saveSkin', data.skin)
        SetNuiFocus(false, false)
    end
    cb('ok')
end)

RegisterNUICallback('previewAppearance', function(data, cb)
    -- Apply appearance preview to ped
    -- This would update the player model in real-time
    cb('ok')
end)

RegisterNUICallback('close', function(data, cb)
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('showNotification', function(data, cb)
    SendNUIMessage({
        action = 'notify',
        message = data.message,
        type = data.type or 'info'
    })
    cb('ok')
end)

-- Zurück zum Multichar Menü
RegisterNetEvent('fw:client:returnToMultichar', function()
    -- Close all open UIs
    SendNUIMessage({ action = 'hideUI' })
    SendNUIMessage({ action = 'close' })
    SendNUIMessage({ action = 'closeInventory' })
    SendNUIMessage({ action = 'closeAdminMenu' })
    
    -- Reset player state
    DoScreenFadeOut(500)
    Wait(500)
    
    -- Reopen multichar
    OpenCharacterSelection()
end)
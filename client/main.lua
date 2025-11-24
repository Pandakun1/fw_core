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
        
        -- Screen Fade und Kamera setzen
        DoScreenFadeOut(500)
        Wait(500)
        
        -- HIER: Setzen Sie eine Standard-Auswahlkamera (z.B. im Himmel)
        -- SelectionCam = CreateCam(...)
        
        -- Setze einen unsichtbaren, inaktiven Ped
        local model = GetHashKey('mp_m_freemode_01')
        RequestModel(model)
        while not HasModelLoaded(model) do Wait(0) end
        
        -- Verwenden Sie den Ped, um Charaktere anzuzeigen (z.B. in einer Reihe)
        -- ...
        
        DoScreenFadeIn(1000)
    end)
end

-- NUI Callbacks for Character Selection
RegisterNUICallback('selectCharacter', function(data, cb)
    InCharSelection = false
    SetNuiFocus(false, false)
    DoScreenFadeOut(500)
    Wait(500)
    TriggerServerEvent('charcreator:server:selectCharacter', data.charid)
    cb('ok')
end)

RegisterNUICallback('deleteCharacter', function(data, cb)
    TriggerServerEvent('charcreator:server:deleteCharacter', data.charid)
    cb('ok')
end)

RegisterNUICallback('openCharCreator', function(data, cb)
    -- Open character creator UI
    SendNUIMessage({
        action = 'openCharCreator'
    })
    cb('ok')
end)

RegisterNUICallback('closeCharCreator', function(data, cb)
    -- Reopen character selection
    OpenCharacterSelection()
    cb('ok')
end)

RegisterNUICallback('createCharacter', function(data, cb)
    SetNuiFocus(false, false)
    DoScreenFadeOut(500)
    Wait(500)
    TriggerServerEvent('charcreator:server:createCharacter', data)
    cb('ok')
end)

RegisterNUICallback('openAppearance', function(data, cb)
    SendNUIMessage({
        action = 'openAppearance',
        currentSkin = data.currentSkin,
        fromCreator = true
    })
    cb('ok')
end)

RegisterNUICallback('closeAppearance', function(data, cb)
    if data.returnToCreator then
        SendNUIMessage({
            action = 'openCharCreator'
        })
    end
    cb('ok')
end)

RegisterNUICallback('saveAppearance', function(data, cb)
    if data.returnToCreator then
        -- Update skin data in character creator
        SendNUIMessage({
            action = 'updateSkin',
            skin = data.skin
        })
        SendNUIMessage({
            action = 'openCharCreator',
            skin = data.skin
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
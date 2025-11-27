-- ============================================
-- FW Core: Character NUI Integration
-- ============================================

local inCharSelection = false

-- ============================================
-- FW Core: Character & Appearance Logic
-- ============================================

local tempIdentity = {} -- Zwischenspeicher für Vorname/Nachname

-- 1. Öffnet den Identity Creator (Schritt 1)
RegisterNetEvent('fw:client:openCharCreator', function()
    -- Manager Bescheid geben
    exports['fw_core']:RegisterUIOpen('creator', true)
    
    SendNUIMessage({
        action = 'open',
        data = {
            route = 'creator',
            data = {}
        }
    })
end)

-- Callback: Identität erhalten -> Weiter zum Appearance (Schritt 2)
RegisterNUICallback('createCharacterBase', function(data, cb)
    print('[CharCreator] Basisdaten erhalten:', data.firstname, data.lastname)
    
    -- Speichere Identität temporär im Client
    tempIdentity = data
    
    -- Modell setzen (Männlich/Weiblich) für Preview
    local model = (data.gender == 'm') and `mp_m_freemode_01` or `mp_f_freemode_01`
    
    RequestModel(model)
    while not HasModelLoaded(model) do Wait(0) end
    SetPlayerModel(PlayerId(), model)
    SetModelAsNoLongerNeeded(model)
    
    -- Kamera Setup für Appearance
    -- (Hier könnte man eine schöne Kamera-Animation hinzufügen)
    
    -- Wechselt UI zu Appearance
    SendNUIMessage({
        action = 'open',
        data = {
            route = 'appearance',
            data = {} -- Hier könnte man aktuelle Kleidung senden
        }
    })
    
    cb('ok')
end)

-- Callback: Live Preview der Kleidung/Haare
RegisterNUICallback('previewAppearance', function(data, cb)
    local ped = PlayerPedId()
    local component = data.component
    local val = data.value
    
    -- Mapping (Vereinfachtes Beispiel)
    if component == 'hair' then
        SetPedComponentVariation(ped, 2, val, 0, 2)
    elseif component == 'tshirt' then
        if data.type == 'id' then SetPedComponentVariation(ped, 8, val, 0, 2) end
        if data.type == 'texture' then SetPedComponentVariation(ped, 8, GetPedDrawableVariation(ped, 8), val, 2) end
    elseif component == 'pants' then
        SetPedComponentVariation(ped, 4, val, 0, 2)
    elseif component == 'shoes' then
        SetPedComponentVariation(ped, 6, val, 0, 2)
    end
    
    cb('ok')
end)

-- Callback: Kamera drehen
RegisterNUICallback('rotateCamera', function(data, cb)
    local ped = PlayerPedId()
    local heading = GetEntityHeading(ped)
    if data.direction == 'left' then
        SetEntityHeading(ped, heading + 10.0)
    else
        SetEntityHeading(ped, heading - 10.0)
    end
    cb('ok')
end)

-- Callback: Final Speichern
RegisterNUICallback('saveAppearance', function(skinData, cb)
    -- Füge die Identität zu den Skin-Daten hinzu
    local fullCharacterData = {
        identity = tempIdentity,
        skin = skinData
    }
    
    -- Sende alles an den Server zum Speichern in DB
    TriggerServerEvent('charcreator:server:createCharacter', fullCharacterData)
    
    -- UI Schließen
    exports['fw_core']:RegisterUIClose('creator') -- Oder 'appearance'
    SendNUIMessage({ action = 'closeUI' })
    
    -- Spawn Player Logic triggern (falls nötig)
    -- TriggerEvent('fw:client:spawnPlayer')
    
    cb('ok')
end)

function OpenCharacterSelection()
    if inCharSelection then return end
    
    FW.TriggerCallback('charcreator:loadCharacters', function(characters)
        if not characters then characters = {} end
        
        -- NUI Manager Bescheid geben (Fokus an, aber Cursor auch!)
        exports['fw_core']:RegisterUIOpen('multichar', true)
        inCharSelection = true

        -- Screen Fade für schönen Effekt
        DoScreenFadeOut(500)
        Wait(500)
        
        -- Daten an Vue Route 'multichar' senden
        SendNUIMessage({
            action = 'open',
            data = {
                route = 'multichar',
                data = {
                    characters = characters,
                    maxChars = Config.MaxCharacters or 4
                }
            }
        })
        
        DoScreenFadeIn(1000)
    end)
end

-- === CALLBACKS ===

RegisterNUICallback('selectCharacter', function(data, cb)
    local charid = data.charid
    
    -- UI Schließen
    exports['fw_core']:RegisterUIClose('multichar')
    inCharSelection = false
    SendNUIMessage({ action = 'closeUI' })

    -- Server Logik feuern
    TriggerServerEvent('charcreator:server:selectCharacter', charid)
    cb('ok')
end)

RegisterNUICallback('openCharCreator', function(data, cb)
    -- Wechselt intern die Route von Multichar -> Creator
    -- Wir müssen die UI nicht schließen, nur neue Daten senden
    SendNUIMessage({
        action = 'open',
        data = {
            route = 'creator', -- Deine neue Creator.vue Komponente
            data = {} -- Leere Daten für neuen Char
        }
    })
    cb('ok')
end)

RegisterNUICallback('createCharacter', function(data, cb)
    -- UI Schließen
    exports['fw_core']:RegisterUIClose('multichar')
    inCharSelection = false
    SendNUIMessage({ action = 'closeUI' })
    
    TriggerServerEvent('charcreator:server:createCharacter', data)
    cb('ok')
end)

-- Event um Multichar beim Joinen zu öffnen
RegisterNetEvent('fw:client:openMultichar')
AddEventHandler('fw:client:openMultichar', function()
    OpenCharacterSelection()
end)

-- Exports
exports('OpenCharacterSelection', OpenCharacterSelection)
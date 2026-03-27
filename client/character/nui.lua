-- ============================================
-- FW Core: Character NUI Integration
-- Verwaltet Multichar, Creator und Appearance NUI Callbacks
-- ============================================

local inCharSelection = false
local tempIdentity = {} -- Temporärer Speicher für Vorname/Nachname während der Erstellung

-- Export: Öffnet die Character Selection
function OpenCharacterSelection()
    if inCharSelection then return end
    
    -- Lade Charaktere vom Server (angenommene FW Callback)
    if FW and FW.TriggerCallback then
        FW.TriggerCallback('charcreator:loadCharacters', function(characters)
            if not characters then characters = {} end
            
            exports['fw_core']:RegisterUIOpen('multichar', true)
            inCharSelection = true

            -- Optische Effekte
            DoScreenFadeOut(500)
            Wait(500)
            
            -- Sende Daten an Vue Route 'multichar'
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
end

-- Event um Multichar beim Joinen zu öffnen
RegisterNetEvent('fw:client:openMultichar')
AddEventHandler('fw:client:openMultichar', function()
    OpenCharacterSelection()
end)

-- ============================================
-- NUI CALLBACKS (MÜSSEN MIT FRONTEND-SEND GLEICH SEIN)
-- ============================================

-- 1. Multichar: Charakter auswählen (Klick auf Char-Karte)
RegisterNUICallback('selectCharacter', function(data, cb)
    local charid = data.charid
    
    -- Schließt das UI
    exports['fw_core']:RegisterUIClose('multichar')
    inCharSelection = false
    SendNUIMessage({ action = 'closeUI' })

    -- Server Logik feuern (Spieler wird geladen)
    TriggerServerEvent('charcreator:server:selectCharacter', charid)
    cb('ok')
end)

-- 2. Multichar: Neuen Charakter erstellen (Klick auf "+"-Karte)
RegisterNUICallback('openCharCreator', function(data, cb)
    -- Wechselt intern die Route von Multichar -> Creator
    SendNUIMessage({
        action = 'open',
        data = {
            route = 'creator', 
            data = {} 
        }
    })
    cb('ok')
end)

-- 3. Multichar: Charakter löschen
RegisterNUICallback('deleteCharacter', function(data, cb)
    local charid = data.charid
    TriggerServerEvent('charcreator:server:deleteCharacter', charid)
    
    -- UI kurz schließen und neu öffnen, um die Liste zu aktualisieren
    exports['fw_core']:RegisterUIClose('multichar')
    TriggerEvent('fw:client:openMultichar') 
    cb('ok')
end)

-- 4. CharCreator: Basisdaten erhalten -> Öffne Appearance
RegisterNUICallback('createCharacterBase', function(data, cb)
    -- Speichere Identität temporär
    tempIdentity = data 
    
    local isMale = data.gender == 'm' or data.gender == 'male'
    local model = (isMale and 'mp_m_freemode_01' or 'mp_f_freemode_01')
    
    -- Modell setzen für Preview
    RequestModel(model)
    while not HasModelLoaded(model) do Wait(0) end
    SetPlayerModel(PlayerId(), model)
    SetModelAsNoLongerNeeded(model)
    
    -- Wechselt UI zu Appearance
    SendNUIMessage({
        action = 'open',
        data = {
            route = 'appearance',
            data = {} 
        }
    })
    cb('ok')
end)

-- 5. Appearance: Live Preview (Slider Bewegung)
RegisterNUICallback('previewAppearance', function(data, cb)
    local ped = PlayerPedId()
    local component = data.component
    local val = data.value
    
    -- Vereinfachtes Mapping (muss erweitert werden)
    if component == 'hair' then
        SetPedComponentVariation(ped, 2, val, 0, 2)
    elseif component == 'tshirt' then
        if data.type == 'id' then SetPedComponentVariation(ped, 8, val, GetPedTextureVariation(ped, 8), 2) end
        if data.type == 'texture' then SetPedComponentVariation(ped, 8, GetPedDrawableVariation(ped, 8), val, 2) end
    elseif component == 'pants' then
        SetPedComponentVariation(ped, 4, val, 0, 2)
    elseif component == 'shoes' then
        SetPedComponentVariation(ped, 6, val, 0, 2)
    end
    
    cb('ok')
end)

-- 6. Appearance: Kamera drehen
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

-- 7. Appearance: Final Speichern
RegisterNUICallback('saveAppearance', function(skinData, cb)
    
    local fullCharacterData = {
        identity = tempIdentity or {}, 
        skin = skinData
    }
    
    -- Server speichert in DB und triggert Spawn
    TriggerServerEvent('charcreator:server:createCharacter', fullCharacterData)
    
    -- Schließt UI nach Speichern
    exports['fw_core']:RegisterUIClose('multichar') 
    SendNUIMessage({ action = 'closeUI' })
    
    cb('ok')
end)
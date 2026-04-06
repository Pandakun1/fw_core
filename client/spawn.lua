CreateThread(function()
    while not NetworkIsSessionStarted() do
        Wait(0)
    end

    local ped = PlayerPedId()

    -- Spieler komplett "neutralisieren"
    SetEntityVisible(ped, false, false)
    FreezeEntityPosition(ped, true)
    SetEntityInvincible(ped, true)

    DoScreenFadeOut(0)

    local x = Config.Firstspawn.x or 0.0
    local y = Config.Firstspawn.y or 0.0
    local z = Config.Firstspawn.z or -100.0
    SetEntityCoords(ped, x, y, z, false, false, false, false)

    -- Multichar öffnen
    TriggerEvent('fw:client:openMultichar')
end)

local firstSpawn = true

local spawned1 = false
RegisterNetEvent('fw:spawnPlayer')
AddEventHandler('fw:spawnPlayer', function(data)
    FW.Debug('Spawn', 'Received fw:spawnPlayer event')
    if spawned1 == false then
        spawned1 = true
        FW.Debug('Spawn', 'Starting spawn process')
        FW.ClientNotify("spawnPlayer gestartet", 100)
        local ped = PlayerPedId()
        if data.model then
            local model = GetHashKey(data.model)
            
            if not IsModelInCdimage(model) or not IsModelValid(model) then
                TriggerServerEvent('fw:debug', '[FW] Ungültiges Model: '.. model)
                return
            end
            RequestModel(model)
            while not HasModelLoaded(model) do Wait(0) end

            SetPlayerModel(PlayerId(), model)
            SetModelAsNoLongerNeeded(model)
            
            -- Warte kurz damit das Model geladen wird
            Wait(100)
            ped = PlayerPedId()
            SetPedDefaultComponentVariation(ped)
            
            -- Setze Ped-Einstellungen BEVOR Teleport
            FreezeEntityPosition(ped, false)
            SetEntityCollision(ped, true, true)
            SetEntityVisible(ped, true, false)
            SetEntityInvincible(ped, false)
            
            TriggerServerEvent('fw:serverTeleportTo', data.x, data.y, data.z, data.heading)
        end
        
        FW.Debug('Spawn', 'Fading in screen')
        DoScreenFadeIn(1000)
        Wait(1000)
        FW.Debug('Spawn', 'Spawn complete')

        --[[FreezeEntityPosition(ped, true)
        SetEntityCollision(ped, false, false)
        SetEntityVisible(ped, false, false)
        -- Alive Status abfragen!!!
        SetEntityCoordsNoOffset(ped, data.x, data.y, data.z, false, false, false)
        if data.heading then
            SetEntityHeading(ped, data.heading)
        end
        DoScreenFadeOut(500)
        while not IsScreenFadedOut() do Wait(0) end

        if IsEntityDead(ped) then
            NetworkResurrectLocalPlayer(data.x, data.y, data.z, data.heading or 0.0, 500, false)
            ped = PlayerPedId()
            ClearPedTasksImmediately(ped)
            RemoveAllPedWeapons(ped, true)
        end

        FreezeEntityPosition(ped, false)
        SetEntityCollision(ped, true, true)
        SetEntityVisible(ped, true, true)

        DoScreenFadeIn(500)]]
    end

end)
local firstSpawn = true

local spawned1 = false
RegisterNetEvent('fw:spawnPlayer')
AddEventHandler('fw:spawnPlayer', function(data)
    print('[FW Client] Received fw:spawnPlayer event')
    print('[FW Client] Spawn data: ' .. json.encode(data))
    if spawned1 == false then
        spawned1 = true
        print('[FW Client] Starting spawn process')
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
        
        print('[FW Client] Spawn completed, fading in screen')
        DoScreenFadeIn(1000)
        Wait(1000)
        print('[FW Client] Spawn fully complete')

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
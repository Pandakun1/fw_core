local firstSpawn = true

local spawned1 = false
RegisterNetEvent('fw:spawnPlayer')
AddEventHandler('fw:spawnPlayer', function(data)
    if spawned1 == false then
        spawned1 = true
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
            ped = PlayerPedId()
            SetPedDefaultComponentVariation(ped)
            TriggerServerEvent('fw:serverTeleportTo', data.x, data.y, data.z, data.heading)
            --NetworkResurrectLocalPlayer(data.x, data.y, data.z, data.heading, true, true, false)
            FreezeEntityPosition(ped, false)
            SetEntityCollision(ped, true, true)
            SetEntityVisible(ped, true)
            Wait(100)
            if not IsEntityVisible(ped) then
                SetEntityVisible(ped, true)
            end
        end

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
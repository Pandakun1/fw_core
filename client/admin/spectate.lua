FW = FW or {}
FW.Admin = FW.Admin or {}

local spec = false

RegisterCommand("spec", function(source, args)
    local targetId = tonumber(args[1])
    if not spectating then
        if not targetId then
            print("Usage: /spec [serverId]")
            return
        end

        FW.Admin.StartSpectate(targetId)
    else
        FW.Admin.StopSpectate()
    end
end, false)

RegisterKeyMapping("spec", "NoClip an/aus", "keyboard", "F6")


function FW.Admin.StartSpectate(targetServerId)
    local playerId = GetPlayerFromServerId(targetServerId)
    if playerId == -1 then
        print("Player not found")
        return
    end

    specTarget = playerId
    spectating = true
    freecam = false

    FW.Admin.hidePlayerPed()

    local targetPed = GetPlayerPed(playerId)
    local targetPos = GetEntityCoords(targetPed)

    cam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)

    local radius = 5.0
    local height = 1.5
    local angleDeg = GetEntityHeading(targetPed) + 180.0
    local angle = math.rad(angleDeg)

    local camX = targetPos.x + radius * math.cos(angle)
    local camY = targetPos.y + radius * math.sin(angle)
    local camZ = targetPos.z + height

    SetCamCoord(cam, camX, camY, camZ)
    PointCamAtEntity(cam, targetPed, 0.0, 0.0, 0.0, true)

    RenderScriptCams(true, true, 500, true, true)
    spec = true
end


function FW.Admin.StopSpectate()
    if not spectating then return end
    spectating = false
    specTarget = nil

    if cam ~= nil then
        RenderScriptCams(false, true, 500, true, true)
        DestroyCam(cam, false)
        spec = false
        cam = nil
    end

    FW.Admin.restorePlayerPed()
end

CreateThread(function()
    local radius = 5.0
    local height = 1.5
    local angleOffset = 0.0

    while true do
        if spectating and cam ~= nil and specTarget ~= nil then
            DisableAllControlActions(0)

            local targetPed = GetPlayerPed(specTarget)
            if not DoesEntityExist(targetPed) then
                FW.Admin.StopSpectate()
            else
                local lookX = GetDisabledControlNormal(0, 1)
                local lookY = GetDisabledControlNormal(0, 2)

                angleOffset = angleOffset + lookX * -3.0
                height = height + lookY * 1.0
                if height < 0.5 then height = 0.5 end
                if height > 3.0 then height = 3.0 end

                local targetPos = GetEntityCoords(targetPed)
                local angle = math.rad(GetEntityHeading(targetPed) + angleOffset)

                local camX = targetPos.x + radius * math.cos(angle)
                local camY = targetPos.y + radius * math.sin(angle)
                local camZ = targetPos.z + height

                SetCamCoord(cam, camX, camY, camZ)
                PointCamAtEntity(cam, targetPed, 0.0, 0.0, 0.0, true)
            end
        end

        Wait(0)
    end
end)

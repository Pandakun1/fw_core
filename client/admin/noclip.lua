FW = FW or {}
FW.Admin = FW.Admin or {}

local freecam = false
local spectating = false
local cam = nil

local savedPos = nil
local savedHeading = nil

local specTarget = nil

function FW.Admin.hidePlayerPed()
    local ped = PlayerPedId()
    savedPos = GetEntityCoords(ped)
    savedHeading = GetEntityHeading(ped)

    -- Ped weit weg parken (z.B. unter der Map)
    SetEntityCoordsNoOffset(ped, 0.0, 0.0, -200.0, false, false, false)
    FreezeEntityPosition(ped, true)
    SetEntityVisible(ped, false, false)
    SetEntityCollision(ped, false, false)
    SetEntityInvincible(ped, true)
    NetworkSetEntityInvisibleToNetwork(ped, true)
end

function FW.Admin.restorePlayerPed(targetPos, targetHeading)
    local ped = PlayerPedId()

    local pos = targetPos or savedPos
    local heading = targetHeading or savedHeading or 0.0

    SetEntityCoordsNoOffset(ped, pos.x, pos.y, pos.z, false, false, false)
    SetEntityHeading(ped, heading)

    FreezeEntityPosition(ped, false)
    SetEntityVisible(ped, true, false)
    SetEntityCollision(ped, true, true)
    SetEntityInvincible(ped, false)
    NetworkSetEntityInvisibleToNetwork(ped, false)
end

function FW.Admin.EnableFreecam()
    local ped = PlayerPedId()
    local pos = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)

    FW.Admin.hidePlayerPed()

    cam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
    SetCamCoord(cam, pos.x, pos.y, pos.z + 1.0)
    SetCamRot(cam, 0.0, 0.0, heading, 2)

    RenderScriptCams(true, true, 500, true, true)

    freecam = true
end

function FW.Admin.DisableFreecam()
    if not freecam then return end
    freecam = false

    local camPos = GetCamCoord(cam)
    local camRot = GetCamRot(cam, 2)

    RenderScriptCams(false, true, 500, true, true)
    DestroyCam(cam, false)
    cam = nil

    FW.Admin.restorePlayerPed(camPos, camRot.z)
end

-- NoClip an/aus
function FW.Admin.toggleNoClip()
        if freecam then
        FW.Admin.DisableFreecam()
    else
        FW.Admin.EnableFreecam()
    end
end

-- Bewegung in NoClip
CreateThread(function()
    local speed = 3.0

    while true do
        Wait(0)
        if freecam and cam ~= nil then
            DisableAllControlActions(0) -- Spieler soll nichts anderes machen

            -- Maus / Stick: Kamera drehen
            local lookX = GetDisabledControlNormal(0, 1) -- LINKS/RECHTS
            local lookY = GetDisabledControlNormal(0, 2) -- HOCH/RUNTER

            local rot = GetCamRot(cam, 2)
            rot = vector3(
                rot.x + lookY * -5.0,
                0.0,
                rot.z + lookX * -5.0
            )
            SetCamRot(cam, rot.x, rot.y, rot.z, 2)

            -- Bewegung (WASD)
            local forward = GetDisabledControlNormal(0, 35) -- W
            local backward = GetDisabledControlNormal(0, 34) -- S
            local left = GetDisabledControlNormal(0, 33) -- A
            local right = GetDisabledControlNormal(0, 32) -- D
            local up = GetDisabledControlNormal(0, 22)   -- SPACE
            local down = GetDisabledControlNormal(0, 36) -- CTRL

            local moveZ = (up - down) * speed

            local heading = math.rad(rot.z)
            local dx = (forward - backward) * math.cos(heading) - (left - right) * math.sin(heading)
            local dy = (forward - backward) * math.sin(heading) + (left - right) * math.cos(heading)

            local camPos = GetCamCoord(cam)
            local newPos = vector3(
                camPos.x + dx * speed,
                camPos.y + dy * speed,
                camPos.z + moveZ
            )

            SetCamCoord(cam, newPos.x, newPos.y, newPos.z)
        else
            Wait(100)
        end
    end
end)

-- Command /noclip
RegisterCommand("noclip", function()
    FW.Admin.toggleNoClip()
end, false)

-- Optional: Keybinding (z.B. F2)
-- Im F8: /bind keyboard F2 noclip
RegisterKeyMapping("noclip", "NoClip an/aus", "keyboard", "F2")
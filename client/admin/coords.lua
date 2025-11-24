FW = FW or {}
FW.Admin = FW.Admin or {}

function FW.Admin.coords3()
    local ped = PlayerPedId()
    local coordinates = GetEntityCoords(ped)
    local x, y, z = coordinates.x, coordinates.y, coordinates.z
    FW.ClientNotify("Coordinaten: vector3(" ..x.. ", " ..y.. ", " ..z..") in die Zwischenablage kopiert.", 5000)
    local text = string.format("vector3(%.2f, %.2f, %.2f)", x, y, z)
    SendNUIMessage({
        action = "copy",
        text = text
    })
end

function FW.Admin.heading()
    local ped = PlayerPedId()
    local heading = GetEntityHeading(ped)
    FW.ClientNotify("Heading: " ..heading.. " in die Zwischenablage kopiert.", 5000)
    local text = string.format("%.2f", heading)
    SendNUIMessage({
        action = "copy",
        text = text
    })
end

function FW.Admin.coords4()
    local ped = PlayerPedId()
    local coordinates = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
    local x, y, z, w = coordinates.x, coordinates.y, coordinates.z, heading
    FW.ClientNotify("Coordinaten: vector4(" ..x.. ", " ..y.. ", " ..z.. ", " ..heading.. ") in die Zwischenablage kopiert.", 5000)
    local text = string.format("vector4(%.2f, %.2f, %.2f, %.2f)", x, y, z, w)
    SendNUIMessage({
        action = "copy",
        text = text
    })
end

function FW.Admin.TeleportToWaypoint()
    local waypointBlip = GetFirstBlipInfoId(8) -- 8 = waypoint
    if DoesBlipExist(waypointBlip) then
        local coords = GetBlipInfoIdCoord(waypointBlip)
        local ped = PlayerPedId()
        SetEntityCoordsNoOffset(ped, coords.x, coords.y, coords.z + 1.0, true, false, true)
    else
        print("[AdminMenu] Kein Wegpunkt gesetzt.")
    end
end

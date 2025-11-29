FW = FW or {}
FW.Admin = FW.Admin or {}

function FW.Admin.SpawnAdminVehicle(modelName)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)

    local model = GetHashKey(modelName)
    if not IsModelInCdimage(model) then
        print("[AdminMenu] Ungültiges Fahrzeug: " .. modelName)
        return
    end

    RequestModel(model)
    while not HasModelLoaded(model) do
        Wait(0)
    end

    local veh = CreateVehicle(model, coords.x, coords.y, coords.z, GetEntityHeading(ped), true, false)
    SetPedIntoVehicle(ped, veh, -1)
    SetModelAsNoLongerNeeded(model)
end

function FW.Admin.FixCurrentVehicle()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh ~= 0 then
        SetVehicleFixed(veh)
        SetVehicleDirtLevel(veh, 0.0)
    end
end

function FW.Admin.DeleteVehicle()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh ~= 0 then
        SetEntityAsMissionEntity(veh, true, true)
        DeleteVehicle(veh)
        FW.ClientNotify("Fahrzeug gelöscht.")
    else
        FW.ClientNotify("Du bist in keinem Fahrzeug.")
    end
end

RegisterCommand("car", function(source, args)
    local modelName = args[1]
    if modelName then
        FW.Admin.SpawnAdminVehicle(modelName)
    else
        print("[AdminMenu] Bitte gib einen Fahrzeugmodellnamen an.")
    end
end, false)

RegisterCommand("fix", function()
    FW.Admin.FixCurrentVehicle()
end, false)
RegisterCommand("dv", function()
    FW.Admin.DeleteVehicle()
end, false)
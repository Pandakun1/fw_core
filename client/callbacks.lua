FW = FW or {}
FW.ClientCallbacks = {}

RegisterNetEvent("FW:CallbackResult", function(name, ...)
    if FW.ClientCallbacks[name] then
        print(name)
        FW.ClientCallbacks[name](...)
        FW.ClientCallbacks[name] = nil
    end
end)

function FW.TriggerCallback(name, cb, ...)
    FW.ClientCallbacks[name] = cb
    TriggerServerEvent("FW:TriggerCallback", name, ...)
end
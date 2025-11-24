FW = FW or {}
FW.Hud = FW.Hud or {}

local DEFAULT_DURATION = 4500

function FW.ClientNotify(message, duration, notifyType)
    if not notifyType then
        notifyType = "info"
    end
    TriggerEvent('FW:Notify', message, duration, notifyType)
end

function FW.ClientNotifySuccess(message, duration)
    FW.ClientNotify(message, duration or DEFAULT_DURATION, "success")
end

function FW.ClientNotifyError(message, duration)
    FW.ClientNotify(message, duration or DEFAULT_DURATION, "error")
end

function FW.ClientNotifyInfo(message, duration)
    FW.ClientNotify(message, duration or DEFAULT_DURATION, "info")
end


RegisterNetEvent('FW:Notify')
AddEventHandler('FW:Notify', function(message, duration, notifyType)
    duration = duration or DEFAULT_DURATION
    notifyType = notifyType or "info"

    SendNUIMessage({
        type = "showNotify",
        text = message,
        time = duration,
        notifyType = notifyType
    })
end)

RegisterCommand('notify', function(source, args, rawCommand)
    local message = args[1] or "Testnachricht"
    local duration = tonumber(args[2]) or DEFAULT_DURATION
    local notifyType = args[3] or "info"

    FW.ClientNotify(message, duration, notifyType)
end, false)
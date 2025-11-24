FW = FW or {}
FW.Hud = FW.Hud or {}

local cash  = 0
local bank  = 0
local playerId = PlayerPedId()
local showHud = true

Citizen.CreateThread(function()
    while true do
        Wait(200)
        if showHud then
            local ped = PlayerPedId()
            local speed = 0

            if IsPedInAnyVehicle(ped, false) then
                local veh = GetVehiclePedIsIn(ped, false)
                speed = GetEntitySpeed(veh) * 3.6
            end
            SendNUIMessage({
                action = "updateHud",
                speed = math.floor(speed)
            })
        end
    end

end)


RegisterNetEvent("fw:MoneyChange", function(account, oldAmount, newAmount)
    if account == "cash" then
        SendNUIMessage({
            action = "updateHud",
            cash = newAmount,
        })
    else
        SendNUIMessage({
            action = "updateHud",
            bank = newAmount
        })
    end
end)

RegisterNetEvent("fw:IdLoad", function(id)
    if id ~= 0 or id ~= nil then
        SendNUIMessage({
            action = "updateHud",
            playerId = id
        })
    end
end)

RegisterNetEvent('fw:updateHud', function (id, cash1, bank1)
    local newID = id
    local newCash = cash1
    local newBank = bank1
    SendNUIMessage({
        action = "updateHud",
        cash = newCash,
        bank = newBank,
        playerId = id,
    })
end)

RegisterCommand('updateHud', function ()
    FW.TriggerCallback("fw:getPlayer", function(Player)
        local inhalt = 'Spieler id: '.. Player.id .. ' und PlayerPedId: ' .. PlayerPedId()
        FW.ClientNotify(inhalt, 8000)
        SendNUIMessage({
            action = "updateHud",
            cash = Player.money.cash or 0,
            bank = Player.money.bank or 0,
            playerId = PlayerPedId(),
        })
    end)
end, false)

RegisterCommand('toggleHud', function()
    showHud = not showHud
    SendNUIMessage({
        action = "toggleHud",
        state = showHud
    })
end, false)

RegisterCommand('id', function()
    print(playerId)
end,false)

RegisterKeyMapping('toggleHud', 'ToggleHud', 'keyboard', 'F10')


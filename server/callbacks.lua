FW = FW or {}
FW.ServerCallbacks = FW.ServerCallbacks or {}

RegisterNetEvent("FW:TriggerCallback", function(name, ...)
    local src = source
    if FW.ServerCallbacks[name] then
        FW.ServerCallbacks[name](src, function(...)
            TriggerClientEvent("FW:CallbackResult", src, name, ...)
        end, ...)
    else
        print(("[FW] Callback: %s nicht gefunden."):format(name))
    end
end)

function FW.RegisterServerCallback(name, cb)
    FW.ServerCallbacks[name] = cb
end

----------------------------------------------------------------------------------------------

FW.RegisterServerCallback("fw:getPlayer", function(src, cb)
    local player = FW.GetPlayer(src)
    if not player then cb(nil) return end

    local playerPed = GetPlayerPed(src)
    local coords = GetEntityCoords(playerPed)
    cb({
        id = player.id,
        identifier = player.identifier,
        name = player.name,
        money = player.money,
        job = player.job,
        position = vector3(coords.x, coords.y, coords.z),
        inventory = player.inventory,
    })
end)

FW.RegisterServerCallback("fw:getPlayerIdentifiers", function(src, cb)
    local identifiers = GetIdentifier(src)
    cb(identifiers)
end)

FW.RegisterServerCallback("fw:getOtherInventory", function(src, cb, targetId)
    local targetPlayer = FW.GetPlayer(targetId)
    if not targetPlayer then cb(nil) return end

    FW.Inventory.GetInventory(targetId, function(inventory)
        cb(inventory)
    end)
end)

FW.RegisterServerCallback('charcreator:loadCharacters', function(src, cb)
    local identifier = GetPlayerIdentifiers(src)
    if not identifier[1] then
        cb({})
        return
    end
    MySQL.query('SELECT id, firstname, lastname, dateofbirth, sex, height FROM characters WHERE identifier = ? ORDER BY last_played DESC', {identifier[1]}, function(result)
        local characters = {}
        
        for i = 1, #result do
            table.insert(characters, {
                id = result[i].id,
                firstname = result[i].firstname,
                lastname = result[i].lastname,
                dateofbirth = result[i].dateofbirth,
                sex = result[i].sex,
                height = result[i].height
            })
        end
        
        cb(characters)
    end)
end)

FW.RegisterServerCallback('charcreator:loadCharacterById', function(src, cb, charId)
    MySQL.single('SELECT * FROM characters WHERE id = ?', {charId}, function(result)
        cb(result)
    end)
end)
FW = FW or {}
FW.Commands = FW.Commands or {}

RegisterCommand('additem', function(source, args, rawCommand)
    local src = source
    print('[FW Command] additem von source:', src)
    print('[FW Command] args[1]:', args[1], 'args[2]:', args[2])
    local itemName = tostring(args[1])
    local amount = tonumber(args[2])
    print('[FW Command] Rufe AddItem auf:', itemName, amount)
    FW.Inventory.AddItem(src, itemName, amount)
end, false)

RegisterCommand('removeitem', function(source, args, rawCommand)
    local src = source
    FW.Inventory.RemoveItem(src, args[1], args[2])
end, false)

RegisterCommand('loadItems', function (source)
    FW.Inventory.LoadItems()
end, false)

RegisterCommand('loadPlayer', function(source, args, rawCommand)
    FW.LoadPlayer(source)
end, false)

RegisterCommand('addmoney', function(source, args, rawCommand)
    if source == 0 then
        print('Benutze: /addmoney [id] [cash/bank] [amount]')
        return
    end

    local targetId = tonumber(args[1])
    local account  = args[2] or 'cash'
    local amount   = tonumber(args[3])

    if not targetId or not amount then
        TriggerClientEvent('chat:addMessage', source, {
            args = {'System', 'Benutzung: /addmoney [id] [cash/bank] [amount]'}
        })
        return
    end

    if account ~= 'cash' and account ~= 'bank' then
        TriggerClientEvent('chat:addMessage', source, {
            args = {'System', 'Account muss "cash" oder "bank" sein.'}
        })
        return
    end

    local xPlayer = FW.GetPlayer(targetId)
    if not xPlayer then
        TriggerClientEvent('chat:addMessage', source, {
            args = {'System', 'Spieler mit der ID: ' ..targetId.. ' nicht gefunden.'}
        })
        return
    end

    xPlayer.addMoney(account, amount)

    TriggerClientEvent('chat:addMessage', source, {
        args = {'System', ('Du hast %d$ auf %s von ID %d gegeben.'):format(amount, account, targetId)}
    })

    TriggerClientEvent('chat:addMessage', targetId, {
        args = {'System', ('Du hast %d$ auf %s erhalten.'):format(amount, account)}
    })
end, false)

-- Zurück zum Multichar Menü
RegisterCommand('logout', function(source, args, rawCommand)
    local src = source
    if src == 0 then return end
    
    -- Trigger client to open multichar
    TriggerClientEvent('fw:client:returnToMultichar', src)
end, false)

RegisterCommand('multichar', function(source, args, rawCommand)
    local src = source
    if src == 0 then return end
    
    TriggerClientEvent('fw:client:returnToMultichar', src)
end, false)

RegisterCommand('createJob', function(source)
    local src = source
    if src == 0 then return end

    TriggerClientEvent('openJobCreator', src)
end, false)


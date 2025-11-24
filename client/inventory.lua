-- Callback: Inventar an Client senden
FW.RegisterCallback('fw:inventory:getInventoryData', function(source, cb)
    local src = source

    FW.Inventory.GetInventory(src, function(inventory)
        -- Fallback, falls nil zurückkommt
        inventory = inventory or {}

        -- Hier könntest du ggf. schon filtern (z.B. versteckte Items entfernen)
        cb(inventory)
    end)
end)

-------------------------------------------------
-- Item benutzen
-------------------------------------------------
RegisterNetEvent('fw:inventory:useItem', function(itemName)
    local src = source
    if type(itemName) ~= "string" or itemName == "" then
        print(('[FW] useItem: ungültiger itemName von %s'):format(src))
        return
    end

    print(('[FW] Spieler %s benutzt Item: %s'):format(src, itemName))

    local itemDef = FW.Inventory.List[itemName]

    -- Item existiert nicht in der Definition
    if not itemDef then
        TriggerClientEvent('fw:client:notify', src, 'Unbekanntes Item.')
        return
    end

    -- Item ist laut Definition nicht nutzbar
    if not itemDef.canUse then
        TriggerClientEvent('fw:client:notify', src, 'Du kannst das nicht benutzen.')
        return
    end

    if not FW.Inventory.HasItem or not FW.Inventory.HasItem(src, itemName, 1) then
        TriggerClientEvent('fw:client:notify', src, 'Du besitzt dieses Item nicht.')
        return
    end

    -- Optional: Wenn canUse eine Funktion ist
    -- if type(itemDef.canUse) == 'function' then
    --     local ok, msg = pcall(itemDef.canUse, src, itemName, itemDef)
    --     if not ok then
    --         print('[FW] useItem Fehler:', msg)
    --     end
    -- end

    -- Default-Feedback
    TriggerClientEvent('fw:client:notify', src, 'Du benutzt ' .. (itemDef.label or itemName))

    -- Wenn es verbraucht wird:
    -- Du könntest hier z.B. itemDef.consumes = true verwenden
    FW.Inventory.RemoveItem(src, itemName, 1)

    -- Inventar beim Client aktualisieren
    FW.Inventory.GetInventory(src, function(inv)
        TriggerClientEvent('fw:inventory:refresh', src, inv or {})
    end)
end)

-------------------------------------------------
-- Item wegwerfen
-------------------------------------------------
RegisterNetEvent('fw:inventory:dropItem', function(itemName, amount)
    local src = source
    amount = tonumber(amount) or 1
    if amount <= 0 then amount = 1 end

    if type(itemName) ~= "string" or itemName == "" then
        print(('[FW] dropItem: ungültiger itemName von %s'):format(src))
        return
    end

    if FW.Inventory.GetItemCount and FW.Inventory.GetItemCount(src, itemName) < amount then
        print(('[FW] dropItem: Spieler %s versucht mehr zu droppen als er hat (%s, %s)'):format(src, itemName, amount))
        return
    end

    -- Item aus Inventar entfernen
    FW.Inventory.RemoveItem(src, itemName, amount)

    -- TODO: Hier könntest du einen "ground item" spawnen / Bodenloot
    -- z.B. TriggerEvent('fw:world:spawnDroppedItem', src, itemName, amount)

    -- Inventar beim Client aktualisieren
    FW.Inventory.GetInventory(src, function(inv)
        TriggerClientEvent('fw:inventory:refresh', src, inv or {})
    end)
end)

-------------------------------------------------
-- Item an einen anderen Spieler geben (Stub)
-------------------------------------------------
RegisterNetEvent('fw:inventory:giveItem', function(itemName, amount, targetId)
    local src = source
    amount = tonumber(amount) or 1
    if amount <= 0 then amount = 1 end

    if type(itemName) ~= "string" or itemName == "" then
        print(('[FW] giveItem: ungültiger itemName von %s'):format(src))
        return
    end

    -- Achtung: Im Moment schickt dein NUI nur name + amount, kein target.
    -- Du kannst targetId später vom Client mitgeben (z.B. nächsten Spieler,
    -- Spieler aus Dialog, etc.). Wenn targetId nil ist, brechen wir ab.
    if not targetId then
        TriggerClientEvent('fw:client:notify', src, 'Kein Zielspieler angegeben.')
        return
    end

    local target = tonumber(targetId)
    if not target or not GetPlayerName(target) then
        TriggerClientEvent('fw:client:notify', src, 'Zielspieler nicht gefunden.')
        return
    end

    if FW.Inventory.GetItemCount and FW.Inventory.GetItemCount(src, itemName) < amount then
        TriggerClientEvent('fw:client:notify', src, 'Du hast nicht genug davon.')
        return
    end

    -- Aus src Inventar entfernen
    FW.Inventory.RemoveItem(src, itemName, amount)
    -- Zu target Inventar hinzufügen
    FW.Inventory.AddItem(target, itemName, amount)

    TriggerClientEvent('fw:client:notify', src, ('Du gibst %d× %s an %s.'):format(
        amount, itemName, GetPlayerName(target)
    ))
    TriggerClientEvent('fw:client:notify', target, ('Du hast %d× %s erhalten.'):format(
        amount, itemName
    ))

    -- Beide Inventare aktualisieren
    FW.Inventory.GetInventory(src, function(invSrc)
        TriggerClientEvent('fw:inventory:refresh', src, invSrc or {})
    end)

    FW.Inventory.GetInventory(target, function(invTarget)
        TriggerClientEvent('fw:inventory:refresh', target, invTarget or {})
    end)
end)
-- ========================================
-- Inventory Callbacks für NUI Integration
-- ========================================

-- UseItem Callback
RegisterNUICallback('useItem', function(data, cb)
    local itemName = data.itemName
    local slot = data.slot or 0
    local zone = data.zone or 'main'
    local amount = data.amount or 1
    
    print(string.format('[FW Core] Player using item: %s (slot: %d, zone: %s)', itemName, slot, zone))
    
    -- Trigger Server Event zum Item verwenden
    TriggerServerEvent('fw:inventory:useItem', {
        itemName = itemName,
        slot = slot,
        zone = zone,
        amount = amount
    })
    
    -- Response zurück an NUI
    cb({
        success = true,
        consumed = false, -- Server wird später consumed=true senden wenn Item verbraucht
        message = 'Item wird verwendet...'
    })
end)

-- MoveItem Callback
RegisterNUICallback('moveItem', function(data, cb)
    local fromSlot = data.fromSlot
    local toSlot = data.toSlot
    
    print(string.format('[FW Core] Moving item from slot %d to slot %d', fromSlot, toSlot))
    
    -- Trigger Server Event zum Item verschieben
    TriggerServerEvent('fw:inventory:moveItem', {
        fromSlot = fromSlot,
        toSlot = toSlot
    })
    
    cb('ok')
end)

-- Server Event: Item wurde erfolgreich verwendet
RegisterNetEvent('fw:inventory:itemUsed', function(data)
    print('[FW Core] Item used:', data.itemName, 'consumed:', data.consumed)
    
    -- Optional: NUI benachrichtigen wenn Item verbraucht wurde
    if data.consumed then
        SendNUIMessage({
            action = 'itemConsumed',
            itemName = data.itemName,
            slot = data.slot
        })
    end
end)

-- Server Event: Inventar wurde aktualisiert (nach Move)
RegisterNetEvent('fw:inventory:refresh', function(inventoryData)
    print('[FW Core] Inventory refreshed from server')
    
    -- Sende aktualisiertes Inventar an NUI
    SendNUIMessage({
        action = 'updateInventory',
        inventory = inventoryData
    })
end)

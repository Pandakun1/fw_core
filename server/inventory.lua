FW = FW or {}
FW.Inventory = FW.Inventory or {}
FW.Inventory.List = FW.Inventory.List or {}

function LoadJsonFromResource(fileName)
    local resourceName = GetCurrentResourceName()
    local content = LoadResourceFile(resourceName, fileName)

    if not content then
        print(('[FW] Keine %s gefunden!'):format(fileName))
        return nil
    end

    local ok, data = pcall(json.decode, content)
    if not ok then
        print(('[FW] Fehler beim lesen der Datei: %s - %s'):format(fileName, data))
        return nil
    end

    return data

end

function FW.Inventory.LoadItems()
    local filename = "configs/itemlist.json"
    local items = LoadJsonFromResource(filename)

    for _, item in ipairs(items) do
        if item.name and item.label then
            FW.Inventory.List[item.name] = {
                name = item.name,
                label = item.label,
                itemweight = item.itemweight or 0,
                type = item.type or 'item',
                canUse = item.canUse or false
            }
            --print(('[FW] Item mit dem Label: %s erfolgreich registriert.'):format(item.label))
        else
            print('[FW] Ungltiger Item-Eintrag in der itemlist.json (kein name/label).')
        end
    end

    print(('[FW] %d Items aus itemlist.json geladen.'):format(#items))

end

function FW.Inventory.GetItemList(cb)
    cb(FW.Inventory.List)
end

function FW.Inventory.GetItemData(itemName, cb)
    if FW.Inventory.List[itemName] then
        cb(FW.Inventory.List[itemName])
    else
        cb(false)
    end

end

function FW.Inventory.GetInventory(src, cb)
    local identifier = GetIdentifier(src)
    MySQL.single(
        'SELECT inventory FROM players WHERE identifier = ?',
        { identifier},
        function(row)
            local inventory = {}
            if row and row.inventory and row.inventory ~= '' then
                local ok, decoded = pcall(json.decode, row.inventory)
                if ok and type(decoded) == 'table' then
                    inventory = decoded
                end
            end
            cb(inventory)
        end
    )
end

local function SaveInventory(src, inventory, cb)
    local identifier = GetIdentifier(src)
    local invJSON = json.encode(inventory or {})
    MySQL.query(
        'UPDATE players SET inventory = ? WHERE identifier = ?',
        { invJSON, identifier },
        function(affected)
            if cb then cb(affected) end
        end
    )
end

function FW.Inventory.AddItem(src, itemName, amount, metadata)
    local identifier = GetIdentifier(src)
    amount = tonumber(amount or 1)
    local itemDef = FW.Inventory.List[itemName]
    if not itemDef then
        print(('[FW] AddItem: Item "%s" existiert nicht in der itemlist.json!'):format(itemName))
    end

    FW.Inventory.GetInventory(src, function(inventory)
        if not inventory[itemName] then
            inventory[itemName] = {
                label = itemDef.label,
                itemweight = itemDef.itemweight * amount,
                type = itemDef.type,
                canUse = itemDef.canUse,
                amount = 0,
                metadata = {}
            }
        end
        inventory[itemName].amount = inventory[itemName].amount + amount
        if metadata then inventory[itemName].metadata = metadata end

        SaveInventory(src, inventory, function()
            print(('[FW] %dx %s (%s) zu %s hinzugefügt. Neue Menge: %d'):format(
                amount,
                itemDef.label,
                itemName,
                identifier,
                inventory[itemName].amount
            ))
        end)
    end)
end

function FW.Inventory.RemoveItem(src, itemName, amount)
    local identifier = GetIdentifier(src)
    amount = tonumber(amount) or 0
    FW.Inventory.GetInventory(src, function(inventory)

        if amount == 0 then amount = inventory[itemName].amount end
        if not inventory[itemName] then print(('[FW] %s nicht im Inventar gefunden.'):format(itemName)) end
        if inventory[itemName].amount < amount then
            print(('[FW] Zu wenig %s im Inventar, Aktuell: %d'):format(
                itemName,
                inventory[itemName].amount
            ))
        end
        if (inventory[itemName].amount - amount) < 0 then
            print('[FW] Menge darf nicht weniger als 0 sein')
        end
        inventory[itemName].amount = inventory[itemName].amount - amount
        if inventory[itemName].amount == 0 then inventory[itemName] = nil end

        SaveInventory(src, inventory, function()
            print(('[FW] %dx %s von %s entfernt.'):format(amount, itemName, identifier))
        end)
    end)
end

RegisterNetEvent('fw:inventory:LoadItemList', function()
    FW.Inventory.LoadItems()
end)

RegisterNetEvent('fw:inventory:AddItemSelf', function(itemName, amount, metadata)
    FW.Inventory.AddItem(source, itemName, amount, metadata)
end)

RegisterNetEvent('fw:inventory:RemoveItemSelf', function (itemName, amount)
    FW.Inventory.RemoveItem(source, itemName, amount)
end)
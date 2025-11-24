FW = FW or {}
FW.Admin = FW.Admin or {}

function FW.Admin.AddItemSelf(item, count)
    TriggerServerEvent('fw:inventory:AddItemSelf', item, count)
    FW.ClientNotify("Du hast dir selbst "..count.."x "..item.." hinzugefügt.", 5000)
end

function FW.Admin.RemoveItemSelf(item, count)
    local src = source
    TriggerServerEvent('fw:inventory:RemoveItemSelf', item, count)
    FW.ClientNotify("Du hast "..src.." selbst "..count.."x "..item.." entfernt.", 5000)
end

function FW.Admin.getPlayerWeapons(targetId, cb)
    local weaponTable = true
    FW.TriggerCallback("fw:getOtherInventory", function(inventory)
        if inventory then
            local weapons = {}
            for itemName, itemData in pairs(inventory) do
                if itemData.type == "weapon" and itemData.amount > 0 then
                    table.insert(weapons, {
                        name = itemName,
                        amount = itemData.amount,
                        metadata = itemData.metadata
                    })
                end
                if #weapons >= 1 then
                    weaponTable = false
                end
            end
            if weaponTable == false then
                cb(weaponTable)
            else
                cb(weapons)
            end
        else
            cb(false)
        end
    end, targetId)
end

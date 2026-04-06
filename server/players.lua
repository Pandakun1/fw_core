FW = FW or {}
FW.Players = FW.Players or {}

function FW.CreatePlayer(src, data)
    local self = {}

    self.id = src
    self.identifier = data.identifier or 'Unbekannt'
    self.license = data.license or ''
    self.firstname = data.firstname or 'John'
    self.lastname = data.lastname or 'Doe'
    self.name = (data.firstname or 'John') .. ' ' .. (data.lastname or 'Doe')
    self.money = {
        cash = data.money_cash or data.money or 0,
        bank = data.money_bank or data.bank or 0
    }

    self.job = {
        name = data.job_name or data.job or 'unemployed',
        grade = data.job_grade or 0
    }
    self.position = {
        x = data.position_x or 0.0,
        y = data.position_y or 0.0,
        z = data.position_z or 75.0
    }

    local sexValue = data.sex or data.gender or 'male'
    if sexValue == 'male' then sexValue = 'm' end
    if sexValue == 'female' then sexValue = 'f' end

    self.dateofbirth = data.dateofbirth or data.birthdate or '01.01.1990'
    self.sex = sexValue
    self.height = data.height or 180
    self.skin = type(data.skin) == 'table' and json.encode(data.skin) or data.skin or '{}'

    local daten = {}
    if data.daten and data.daten ~= '' and data.daten ~= 'filler' then
        if type(data.daten) == 'string' then
            local success, decoded = pcall(json.decode, data.daten)
            if success and decoded and type(decoded) == 'table' then
                daten = decoded
            else
                print(('[FW] WARNING: Failed to decode daten for player %s - invalid JSON, resetting to empty: %s'):format(src, tostring(data.daten)))
                daten = {}
            end
        elseif type(data.daten) == 'table' then
            daten = data.daten
        end
    end

    self.data = daten

    -- Slot-based inventory structure (Array von Slots)
    -- Lade inventory aus DB als Slot-Array
    self.inventory = {}
    if data.inventory and data.inventory ~= '' and data.inventory ~= '{}' and data.inventory ~= '[]' then
        local success, decoded = pcall(json.decode, data.inventory)
        if success and type(decoded) == 'table' then
            -- Check if old object format (migrate on the fly)
            local isOldFormat = false
            for key, value in pairs(decoded) do
                if type(key) == 'string' and type(value) == 'table' and value.amount then
                    isOldFormat = true
                    break
                end
            end
            
            if isOldFormat then
                print('[FW Player] Migrating old inventory format for', data.identifier)
                -- Convert old object format to slot array
                local slots = {}
                for i = 1, 50 do slots[i] = nil end
                
                local slotIndex = 1
                for itemName, itemData in pairs(decoded) do
                    if itemName ~= 'money' and slotIndex <= 50 then
                        slots[slotIndex] = {
                            name = itemName,
                            label = itemData.label or itemName,
                            quantity = itemData.amount or 1,
                            itemweight = itemData.itemweight or 0,
                            type = itemData.type or 'item',
                            canUse = itemData.canUse or false,
                            metadata = itemData.metadata or {}
                        }
                        slotIndex = slotIndex + 1
                    end
                end
                self.inventory = slots
            else
                -- New slot-array format: Clean up json.null() values
                local cleanSlots = {}
                for i = 1, 50 do
                    if decoded[i] and type(decoded[i]) == 'table' and decoded[i].name then
                        cleanSlots[i] = decoded[i]
                    else
                        cleanSlots[i] = nil
                    end
                end
                self.inventory = cleanSlots
            end
            
            -- Count items
            local itemCount = 0
            for i = 1, 50 do
                if self.inventory[i] and type(self.inventory[i]) == 'table' then
                    itemCount = itemCount + 1
                    print('[FW Player] Slot', i, ':', self.inventory[i].name, 'x', self.inventory[i].quantity or 1)
                end
            end
            print('[FW Player] Loaded', itemCount, 'items from DB for', data.identifier)
        else
            print('[FW Player] Failed to decode inventory for', data.identifier)
        end
    else
        print('[FW Player] No inventory data for', data.identifier, '- initializing empty')
    end
    
    -- Fallback: Initialize empty if needed
    if not self.inventory or type(self.inventory) ~= 'table' then
        print('[FW Player] Creating new empty inventory array')
        self.inventory = {}
        for i = 1, 50 do
            self.inventory[i] = nil
        end
    end

    self.metadata = self.data.metadata or {}
    self.ui_settings = data.ui_settings or '{}'

    -- Equipment Slots
    self.equipment = {
        vest = nil,
        weapon = nil,
        bag1 = nil,
        bag2 = nil
    }
    
    -- Load equipment from database
    if data.equipment_vest and data.equipment_vest ~= '' then
        local success, decoded = pcall(json.decode, data.equipment_vest)
        if success and type(decoded) == 'table' then
            self.equipment.vest = decoded
        end
    end
    if data.equipment_weapon and data.equipment_weapon ~= '' then
        local success, decoded = pcall(json.decode, data.equipment_weapon)
        if success and type(decoded) == 'table' then
            self.equipment.weapon = decoded
        end
    end
    if data.equipment_bag1 and data.equipment_bag1 ~= '' then
        local success, decoded = pcall(json.decode, data.equipment_bag1)
        if success and type(decoded) == 'table' then
            self.equipment.bag1 = decoded
        end
    end
    if data.equipment_bag2 and data.equipment_bag2 ~= '' then
        local success, decoded = pcall(json.decode, data.equipment_bag2)
        if success and type(decoded) == 'table' then
            self.equipment.bag2 = decoded
        end
    end

    self.unsaved = false

    local function triggerMoneyChange(account, oldAmount, newAmount)
        TriggerEvent('fw:playerMoneyChange', self.id, account, oldAmount, newAmount)
        TriggerClientEvent('fw:MoneyChange', self.id, account, oldAmount, newAmount)
    end

    function self.addMoney(type, amount)
        local oldAmount = self.money[type] or 0
        local newAmount = (self.money[type] or 0) + amount
        self.money[type] = newAmount
        self.unsaved = true

        triggerMoneyChange(type, oldAmount, newAmount)
    end

    function self.removeMoney(type, amount)
        local currentAmount = self.money[type] or 0
        if type ~= 'bank' then
            if currentAmount < amount then
                amount = currentAmount
                print('Nicht genügend Bargeld vorhanden, nur ' .. amount .. ' entfernt.')
            end
        end
        local oldAmount = currentAmount
        local newAmount = currentAmount - amount
        if newAmount < 0 then newAmount = 0 end
        self.money[type] = (self.money[type] or 0) - amount
        self.unsaved = true

        triggerMoneyChange(type, oldAmount, newAmount)
    end

    function self.setJob(jobName, grade)
        self.job.name = jobName
        self.job.grade = grade
        self.job.duty = 'on'
        self.unsaved = true
    end

    function self.removeJob()
        self.job.name = 'unemployed'
        self.job.grade = 0
        self.unsaved = true
    end

    function self.setPos(x, y, z)
        self.position.x = x
        self.position.y = y
        self.position.z = z
        self.unsaved = true
    end

    -- Inventory Slot Management
    function self.getInventory()
        -- Backwards compatibility: If old inventorySlots exists, use it
        if self.inventorySlots and not self.inventory then
            print('[FW Player] WARNING: Using legacy inventorySlots, migrating to inventory')
            self.inventory = self.inventorySlots
            self.inventorySlots = nil
        end
        return self.inventory or {}
    end
    
    -- Legacy alias for backwards compatibility
    function self.getInventorySlots()
        return self.getInventory()
    end

    function self.setInventory(slots)
        self.inventory = slots or {}
        self.inventorySlots = nil -- Clear old reference
        self.unsaved = true
    end
    
    -- Legacy alias
    function self.setInventorySlots(slots)
        self.setInventory(slots)
    end

    function self.getItemInSlot(slotIndex)
        return self.inventory[slotIndex]
    end

    function self.setItemInSlot(slotIndex, itemData)
        self.inventory[slotIndex] = itemData
        self.unsaved = true
    end

    function self.removeItemFromSlot(slotIndex)
        self.inventory[slotIndex] = nil
        self.unsaved = true
    end

    function self.hasItemInSlot(itemName, minQuantity)
        minQuantity = minQuantity or 1
        for slot, item in pairs(self.inventory) do
            if item and item.name == itemName and item.quantity >= minQuantity then
                return true, slot
            end
        end
        return false, nil
    end

    function self.countItem(itemName)
        local total = 0
        for _, item in pairs(self.inventory) do
            if item and item.name == itemName then
                total = total + (item.quantity or 1)
            end
        end
        return total
    end

    -- Equipment Management
    function self.getEquipment()
        return self.equipment or { vest = nil, weapon = nil, bag1 = nil, bag2 = nil }
    end

    function self.setEquipment(slot, itemData)
        if not self.equipment then
            self.equipment = { vest = nil, weapon = nil, bag1 = nil, bag2 = nil }
        end
        self.equipment[slot] = itemData
        self.unsaved = true
        print(('[FW Equipment] Set %s slot to %s'):format(slot, itemData and itemData.name or 'nil'))
    end

    function self.getEquipmentSlot(slot)
        if not self.equipment then return nil end
        return self.equipment[slot]
    end

    function self.removeEquipment(slot)
        if not self.equipment then return end
        self.equipment[slot] = nil
        self.unsaved = true
        print(('[FW Equipment] Removed item from %s slot'):format(slot))
    end

    function self.hasEquipped(itemName)
        if not self.equipment then return false, nil end
        for slot, item in pairs(self.equipment) do
            if item and item.name == itemName then
                return true, slot
            end
        end
        return false, nil
    end

    function self.saveClean()
        self.unsaved = false
    end

    function self.isUnsaved()
        return self.unsaved
    end

    function self.toRow()
        -- Ensure inventory is saved as clean array with json.null() for empty slots
        local cleanInventory = {}
        for i = 1, 50 do
            if self.inventory[i] and type(self.inventory[i]) == 'table' and self.inventory[i].name then
                cleanInventory[i] = self.inventory[i]
            else
                cleanInventory[i] = json.null()
            end
        end
        
        -- Serialize equipment slots
        local equipment = self.equipment or { vest = nil, weapon = nil, bag1 = nil, bag2 = nil }
        
        return {
            identifier = self.identifier,
            license = self.license,
            firstname = self.firstname,
            lastname = self.lastname,
            dateofbirth = self.dateofbirth,
            sex = self.sex,
            height = self.height,
            money_cash = self.money.cash,
            money_bank = self.money.bank,
            job_name = self.job.name,
            job_grade = self.job.grade,
            position_x = self.position.x,
            position_y = self.position.y,
            position_z = self.position.z,
            inventory = json.encode(cleanInventory),
            equipment_vest = equipment.vest and json.encode(equipment.vest) or nil,
            equipment_weapon = equipment.weapon and json.encode(equipment.weapon) or nil,
            equipment_bag1 = equipment.bag1 and json.encode(equipment.bag1) or nil,
            equipment_bag2 = equipment.bag2 and json.encode(equipment.bag2) or nil,
            ui_settings = self.ui_settings,
            daten = json.encode(self.data)
        }
    end

    function self.getData()
        return {
            identifier = self.identifier,
            name = self.name,
            money = self.money,
            cash = self.money.cash,
            bank = self.money.bank,
            job = self.job
        }
    end
    FW.Players[src] = self
    return self
end

function FW.GetPlayer(src)
    return FW.Players[src]
end

function FW.GetAllPlayers()
    return FW.Players
end
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

    self.inventory = self.data.inventory or {}
    self.metadata = self.data.metadata or {}

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

    function self.saveClean()
        self.unsaved = false
    end

    function self.isUnsaved()
        return self.unsaved
    end

    function self.toRow()
        return {
            identifier = self.identifier,
            license = self.license,
            firstname = self.firstname,
            lastname = self.lastname,
            money = self.money.cash,
            money_cash = self.money.cash,
            bank = self.money.bank,
            money_bank = self.money.bank,
            job = self.job.name,
            job_name = self.job.name,
            job_grade = self.job.grade,
            position_x = self.position.x,
            position_y = self.position.y,
            position_z = self.position.z,
            inventory = data.inventory or '{}',
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
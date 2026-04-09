FW = FW or {}
FW.Client = FW.Client or {}
local GRID_SIZE = 100
local worldGrid = {}
local lastHash = nil

FW.Client.OnNearbyTick = nil
FW.Client.NearbyTickHandlers = FW.Client.NearbyTickHandlers or {}

local function GetGridHash(coords)
    local x = math.floor(coords.x / GRID_SIZE)
    local y = math.floor(coords.y / GRID_SIZE)
    return ("x%sy%s"):format(x, y)
end

function FW.Client.RegisterGridModule(coords, data)
    local hash = GetGridHash(coords)
    if not worldGrid[hash] then
        worldGrid[hash] = {}
    end

    table.insert(worldGrid[hash], {
        pos = coords,
        render = data.onLoop,
        action = data.onInteract,
        distance = data.distance or 2.0,
        label = data.label or "Interagieren"
    })
end

function FW.Client.RegisterNearbyTick(id, handler)
    if not id or type(handler) ~= 'function' then
        return
    end

    FW.Client.NearbyTickHandlers[id] = handler
end

function FW.Client.UnregisterNearbyTick(id)
    FW.Client.NearbyTickHandlers[id] = nil
end

local currentGrids = {}

Citizen.CreateThread(function()
    while true do
        local ped = PlayerPedId()
        local coords = GetEntityCoords(ped)
        local hash = GetGridHash(coords)
        local sleep = 1000

        if lastHash ~= hash then
            currentGrids = {}
            local gx = math.floor(coords.x / GRID_SIZE)
            local gy = math.floor(coords.y / GRID_SIZE)

            for x = -1, 1 do
                for y = -1, 1 do
                    local h = ("x%sy%s"):format(gx + x, gy + y)
                    if worldGrid[h] then
                        table.insert(currentGrids, worldGrid[h])
                    end
                end
            end
            lastHash = hash
        end

        for i=1, #currentGrids do
            for j=1, #currentGrids[i] do
                local item = currentGrids[i][j]
                local dist = #(coords - item.pos)

                if dist < 15.0 then
                    sleep = 0

                    if item.render then
                        item.render(item.pos)
                    end

                    if dist < item.distance then
                        -- InteraktionsText einfügen

                        if IsControlJustReleased(0, 38) then
                            if item.action then
                                item.action()
                            end
                        end
                    end
                end
            end
        end

        for _, handler in pairs(FW.Client.NearbyTickHandlers) do
            local overrideSleep = handler(coords, sleep)
            if type(overrideSleep) == 'number' then
                sleep = math.min(sleep, overrideSleep)
            end
        end

        if FW.Client.OnNearbyTick then
            local overrideSleep = FW.Client.OnNearbyTick(coords, sleep)
            if type(overrideSleep) == 'number' then
                sleep = math.min(sleep, overrideSleep)
            end
        end

        Wait(sleep)
    end
end)

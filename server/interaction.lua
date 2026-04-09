FW = FW or {}
FW.Interaction = FW.Interaction or {}

local pauseStates = {}

local function BuildPauseStateList()
    local states = {}

    for id, paused in pairs(pauseStates) do
        states[#states + 1] = {
            id = id,
            paused = paused == true,
        }
    end

    return states
end

RegisterNetEvent('fw:interaction:requestPauseStates', function()
    TriggerClientEvent('fw:interaction:syncPauseStates', source, BuildPauseStateList())
end)

RegisterNetEvent('fw:interaction:setPaused', function(targetId, paused)
    if targetId == nil then
        return
    end

    local syncId = tostring(targetId)
    pauseStates[syncId] = paused == true
    TriggerClientEvent('fw:interaction:setPaused', -1, syncId, paused == true)
end)

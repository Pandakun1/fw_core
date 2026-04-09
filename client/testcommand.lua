FW = FW or {}
FW.TestInteraction = FW.TestInteraction or {}

local testTargets = {
    list = nil,
    radial = nil,
}

local function Notify(message)
    print(message)
    -- if FW.ClientNotify then
    --     FW.ClientNotify(message)
    --     return
    -- end

    print(('[FW.TestInteraction] %s'):format(message))
end

local function GetPointInFront(distance)
    local ped = PlayerPedId()
    local pedCoords = GetEntityCoords(ped)
    local camRot = GetGameplayCamRot(2)
    local rotZ = math.rad(camRot.z)
    local forward = vector3(
        -math.sin(rotZ),
        math.cos(rotZ),
        0.0
    )
    local forwardLen = math.sqrt((forward.x * forward.x) + (forward.y * forward.y))
    if forwardLen <= 0.001 then
        forward = vector3(0.0, 1.0, 0.0)
    else
        forward = vector3(forward.x / forwardLen, forward.y / forwardLen, 0.0)
    end

    local midHeightZ = pedCoords.z + 0.72

    return vector3(
        pedCoords.x + (forward.x * distance),
        pedCoords.y + (forward.y * distance),
        midHeightZ
    )
end

local function ClearTarget(mode)
    local targetId = testTargets[mode]
    if not targetId then
        return
    end

    FW.Interaction.Unregister(targetId)
    testTargets[mode] = nil
end

local function ClearAllTargets()
    ClearTarget('list')
    ClearTarget('radial')
    Notify('Alle Interaction-Testpunkte wurden entfernt.')
end

local function BuildOptions(mode)
    if mode == 'radial' then
        return {
            {
                label = 'Debug Info',
                action = function()
                    Notify('Radial-Test: Debug Info ausgewaehlt.')
                end
            },
            {
                label = 'Animation',
                action = function()
                    Notify('Radial-Test: Animation ausgewaehlt.')
                end
            },
            {
                label = 'Klingeln',
                action = function()
                    Notify('Radial-Test: Klingeln ausgewaehlt.')
                end
            },
            {
                label = 'Abbrechen',
                action = function()
                    Notify('Radial-Test: Abbrechen ausgewaehlt.')
                end
            }
        }
    end

    return {
        {
            label = 'Benutzen',
            action = function()
                Notify('Listen-Test: Benutzen ausgewaehlt.')
            end
        },
        {
            label = 'Untersuchen',
            action = function()
                Notify('Listen-Test: Untersuchen ausgewaehlt.')
            end
        },
        {
            label = 'Status pruefen',
            action = function()
                Notify('Listen-Test: Status pruefen ausgewaehlt.')
            end
        }
    }
end

local function RegisterTestPoint(mode)
    if not FW.Interaction or not FW.Interaction.RegisterCoords then
        Notify('Interaction-System ist noch nicht verfuegbar.')
        return
    end

    ClearTarget(mode)

    local coords = GetPointInFront(2.0)
    local id = FW.Interaction.RegisterCoords(coords, {
        id = ('test:%s'):format(mode),
        mode = mode,
        distance = 6.0,
        viewDistance = 20.0,
        listPosition = 'right',
        key = 38,
        keyLabel = 'E',
        heightOffset = 0.0,
        options = BuildOptions(mode),
    })

    testTargets[mode] = id
    Notify(('Testpunkt fuer %s erstellt. Punkt liegt vor deiner Kamera. Geh in die Naehe und druecke E.'):format(mode))
end

RegisterCommand('testinteraction_list', function()
    RegisterTestPoint('list')
end, false)

RegisterCommand('testinteraction_radial', function()
    RegisterTestPoint('radial')
end, false)

RegisterCommand('testinteraction_clear', function()
    ClearAllTargets()
end, false)

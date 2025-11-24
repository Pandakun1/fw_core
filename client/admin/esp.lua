local espEnabled = false

local Config = {
    range        = 500.0,   -- maximale Distanz für ALLES (Linien + Info)
    infoRange    = 150.0,   -- maximale Distanz für HUD-Info (Name, HP, Skeleton, etc.)
    showNames    = true,
    showHealth   = true,
    showWeapon   = true,
    showWeaponStats = true,
    showSkeleton = true,
    showVehicles = true,
    showNPCs     = true,
    onlyOnScreen = true,
}

local WEAPON_GXT_MAP = {
    [GetHashKey("WEAPON_UNARMED")]              = "WT_UNARMED",
    [GetHashKey("WEAPON_ANIMAL")]               = "WT_INVALID",
    [GetHashKey("WEAPON_COUGAR")]               = "WT_RAGE",

    -- Melee
    [GetHashKey("WEAPON_KNIFE")]                = "WT_KNIFE",
    [GetHashKey("WEAPON_NIGHTSTICK")]           = "WT_NGTSTK",
    [GetHashKey("WEAPON_HAMMER")]               = "WT_HAMMER",
    [GetHashKey("WEAPON_BAT")]                  = "WT_BAT",
    [GetHashKey("WEAPON_GOLFCLUB")]             = "WT_GOLFCLUB",
    [GetHashKey("WEAPON_CROWBAR")]              = "WT_CROWBAR",
    [GetHashKey("WEAPON_BOTTLE")]               = "WT_BOTTLE",
    [GetHashKey("WEAPON_DAGGER")]               = "WT_DAGGER",
    [GetHashKey("WEAPON_HATCHET")]              = "WT_HATCHET",
    [GetHashKey("WEAPON_KNUCKLE")]              = "WT_KNUCKLE",
    [GetHashKey("WEAPON_MACHETE")]              = "WT_MACHETE",
    [GetHashKey("WEAPON_SWITCHBLADE")]          = "WT_SWBLADE",

    -- Pistolen
    [GetHashKey("WEAPON_PISTOL")]               = "WT_PIST",
    [GetHashKey("WEAPON_COMBATPISTOL")]         = "WT_PIST_CBT",
    [GetHashKey("WEAPON_APPISTOL")]             = "WT_PIST_AP",
    [GetHashKey("WEAPON_PISTOL50")]             = "WT_PIST_50",
    [GetHashKey("WEAPON_SNSPISTOL")]            = "WT_SNSPISTOL",
    [GetHashKey("WEAPON_HEAVYPISTOL")]          = "WT_HEAVYPSTL",
    [GetHashKey("WEAPON_VINTAGEPISTOL")]        = "WT_VPISTOL",
    [GetHashKey("WEAPON_MARKSMANPISTOL")]       = "WT_MKPISTOL",
    [GetHashKey("WEAPON_MACHINEPISTOL")]        = "WT_MCHPIST",
    [GetHashKey("WEAPON_FLAREGUN")]             = "WT_FLAREGUN",

    -- SMGs
    [GetHashKey("WEAPON_MICROSMG")]             = "WT_SMG_MCR",
    [GetHashKey("WEAPON_SMG")]                  = "WT_SMG",
    [GetHashKey("WEAPON_ASSAULTSMG")]           = "WT_SMG_ASL",
    [GetHashKey("WEAPON_COMBATPDW")]            = "WT_COMBATPDW",
    [GetHashKey("WEAPON_GUSENBERG")]            = "WT_GUSENBERG",

    -- Sturmgewehre
    [GetHashKey("WEAPON_ASSAULTRIFLE")]         = "WT_RIFLE_ASL",
    [GetHashKey("WEAPON_CARBINERIFLE")]         = "WT_RIFLE_CBN",
    [GetHashKey("WEAPON_ADVANCEDRIFLE")]        = "WT_RIFLE_ADV",
    [GetHashKey("WEAPON_SPECIALCARBINE")]       = "WT_RIFLE_SCBN",
    [GetHashKey("WEAPON_COMPACTRIFLE")]         = "WT_CMPRIFLE",

    -- MGs
    [GetHashKey("WEAPON_MG")]                   = "WT_MG",
    [GetHashKey("WEAPON_COMBATMG")]             = "WT_MG_CBT",

    -- Schrotflinten
    [GetHashKey("WEAPON_PUMPSHOTGUN")]          = "WT_SG_PMP",
    [GetHashKey("WEAPON_SAWNOFFSHOTGUN")]       = "WT_SG_SOF",
    [GetHashKey("WEAPON_ASSAULTSHOTGUN")]       = "WT_SG_ASL",
    [GetHashKey("WEAPON_BULLPUPSHOTGUN")]       = "WT_SG_BLP",
    [GetHashKey("WEAPON_HEAVYSHOTGUN")]         = "WT_HVYSHOT",
    [GetHashKey("WEAPON_DBSHOTGUN")]            = "WT_DBSHGN",

    -- Sniper
    [GetHashKey("WEAPON_SNIPERRIFLE")]          = "WT_SNIP_RIF",
    [GetHashKey("WEAPON_HEAVYSNIPER")]          = "WT_SNIP_HVY",
    [GetHashKey("WEAPON_REMOTESNIPER")]         = "WT_SNIP_RMT",
    [GetHashKey("WEAPON_MARKSMANRIFLE")]        = "WT_MKRIFLE",

    -- Schwer / Explosiv
    [GetHashKey("WEAPON_GRENADELAUNCHER")]      = "WT_GL",
    [GetHashKey("WEAPON_GRENADELAUNCHER_SMOKE")]= "WT_GL_SMOKE",
    [GetHashKey("WEAPON_RPG")]                  = "WT_RPG",
    [GetHashKey("WEAPON_STINGER")]              = "WT_RPG",
    [GetHashKey("WEAPON_MINIGUN")]              = "WT_MINIGUN",
    [GetHashKey("WEAPON_HOMINGLAUNCHER")]       = "WT_HOMLNCH",
    [GetHashKey("WEAPON_FIREWORK")]             = "WT_FWRKLNCHR",

    -- Throwable / Misc
    [GetHashKey("WEAPON_GRENADE")]              = "WT_GNADE",
    [GetHashKey("WEAPON_STICKYBOMB")]           = "WT_GNADE_STK",
    [GetHashKey("WEAPON_SMOKEGRENADE")]         = "WT_GNADE_SMK",
    [GetHashKey("WEAPON_BZGAS")]                = "WT_BZGAS",
    [GetHashKey("WEAPON_MOLOTOV")]              = "WT_MOLOTOV",
    [GetHashKey("WEAPON_PROXMINE")]             = "WT_PRXMINE",
    [GetHashKey("WEAPON_BALL")]                 = "WT_BALL",
    [GetHashKey("WEAPON_FLARE")]                = "WT_FLARE",

    -- Tools / Gadgets
    [GetHashKey("WEAPON_STUNGUN")]              = "WT_STUN",
    [GetHashKey("WEAPON_FIREEXTINGUISHER")]     = "WT_FIRE",
    [GetHashKey("WEAPON_PETROLCAN")]            = "WT_PETROL",
    [GetHashKey("WEAPON_DIGISCANNER")]          = "WT_DIGI",
    [GetHashKey("WEAPON_FLASHLIGHT")]           = "WT_FLASHLIGHT",
    [GetHashKey("GADGET_NIGHTVISION")]          = "WT_NV",
    [GetHashKey("GADGET_PARACHUTE")]            = "WT_PARA",

    -- “Damage Types” / Sonstiges (für Logs trotzdem nützlich)
    [GetHashKey("OBJECT")]                      = "WT_OBJECT",
    [GetHashKey("WEAPON_BRIEFCASE")]           = "WT_INVALID",
    [GetHashKey("WEAPON_BRIEFCASE_02")]        = "WT_INVALID",
    [GetHashKey("WEAPON_ELECTRIC_FENCE")]      = "WT_ELCFEN",
    [GetHashKey("VEHICLE_WEAPON_TANK")]        = "WT_V_TANK",
    [GetHashKey("VEHICLE_WEAPON_SPACE_ROCKET")]= "WT_V_SPACERKT",
    [GetHashKey("VEHICLE_WEAPON_PLAYER_LASER")] = "WT_V_PLRLSR",
    [GetHashKey("AMMO_RPG")]                    = "WT_A_RPG",
    [GetHashKey("AMMO_TANK")]                   = "WT_A_TANK",
    [GetHashKey("AMMO_SPACE_ROCKET")]           = "WT_A_SPACERKT",
    [GetHashKey("AMMO_PLAYER_LASER")]           = "WT_A_PLRLSR",
    [GetHashKey("AMMO_ENEMY_LASER")]            = "WT_A_ENMYLSR",

    [GetHashKey("WEAPON_RAMMED_BY_CAR")]        = "WT_PIST",      -- Rockstar-Meme
    [GetHashKey("WEAPON_FIRE")]                 = "WT_INVALID",
    [GetHashKey("WEAPON_HELI_CRASH")]           = "WT_INVALID",
    [GetHashKey("WEAPON_RUN_OVER_BY_CAR")]      = "WT_INVALID",
    [GetHashKey("WEAPON_HIT_BY_WATER_CANNON")]  = "WT_INVALID",
    [GetHashKey("WEAPON_EXHAUSTION")]           = "WT_INVALID",
    [GetHashKey("WEAPON_FALL")]                 = "WT_INVALID",
    [GetHashKey("WEAPON_EXPLOSION")]            = "WT_INVALID",
    [GetHashKey("WEAPON_BLEEDING")]             = "WT_INVALID",
    [GetHashKey("WEAPON_DROWNING_IN_VEHICLE")]  = "WT_INVALID",
    [GetHashKey("WEAPON_DROWNING")]             = "WT_INVALID",
    [GetHashKey("WEAPON_BARBED_WIRE")]          = "WT_INVALID",
    [GetHashKey("WEAPON_VEHICLE_ROCKET")]       = "WT_INVALID",
}

-----------------------------
-- BONES (GTA V Ped Bones)
-----------------------------
local Bones = {
    Pelvis      = 0x2E28, -- SKEL_Pelvis
    Spine0      = 0x5C01, -- SKEL_Spine0
    Spine1      = 0x60F0, -- SKEL_Spine1
    Spine2      = 0x60F1, -- SKEL_Spine2
    Spine3      = 0x60F2, -- SKEL_Spine3
    Neck        = 0x9995, -- SKEL_Neck_1
    Head        = 0x796E, -- SKEL_Head

    L_Clavicle  = 0xFCD9, -- SKEL_L_Clavicle
    L_UpperArm  = 0xB1C5, -- SKEL_L_UpperArm
    L_Forearm   = 0xEEEB, -- SKEL_L_Forearm
    L_Hand      = 0x49D9, -- SKEL_L_Hand

    R_Clavicle  = 0x29D2, -- SKEL_R_Clavicle
    R_UpperArm  = 0x9D4D, -- SKEL_R_UpperArm
    R_Forearm   = 0x6E5C, -- SKEL_R_Forearm
    R_Hand      = 0xDEAD, -- SKEL_R_Hand (57005)
    
    L_Thigh     = 0xE39F, -- SKEL_L_Thigh
    L_Calf      = 0xF9BB, -- SKEL_L_Calf
    L_Foot      = 0x3779, -- SKEL_L_Foot

    R_Thigh     = 0xCA72, -- SKEL_R_Thigh
    R_Calf      = 0x9000, -- SKEL_R_Calf
    R_Foot      = 0xCC4D, -- SKEL_R_Foot
}

local SkeletonLines = {
    -- Spine
    {"Pelvis",   "Spine0"},
    {"Spine0",   "Spine1"},
    {"Spine1",   "Spine2"},
    {"Spine2",   "Spine3"},
    {"Spine3",   "Neck"},
    {"Neck",     "Head"},

    -- Left Arm
    {"Spine3",     "L_Clavicle"},
    {"L_Clavicle", "L_UpperArm"},
    {"L_UpperArm", "L_Forearm"},
    {"L_Forearm",  "L_Hand"},

    -- Right Arm
    {"Spine3",     "R_Clavicle"},
    {"R_Clavicle", "R_UpperArm"},
    {"R_UpperArm", "R_Forearm"},
    {"R_Forearm",  "R_Hand"},

    -- Left Leg
    {"Pelvis",   "L_Thigh"},
    {"L_Thigh",  "L_Calf"},
    {"L_Calf",   "L_Foot"},

    -- Right Leg
    {"Pelvis",   "R_Thigh"},
    {"R_Thigh",  "R_Calf"},
    {"R_Calf",   "R_Foot"},
}

-----------------------------
-- /adminesp togglen
-----------------------------
RegisterCommand("adminesp", function()
    espEnabled = not espEnabled
    if espEnabled then
        print("^2[AdminESP]^7 aktiviert")
    else
        print("^1[AdminESP]^7 deaktiviert")
    end
end, false)

RegisterKeyMapping("adminesp", "Admin ESP umschalten", "keyboard", "F7")

-----------------------------
-- HELFER
-----------------------------
local function Distance(a, b)
    local dx = a.x - b.x
    local dy = a.y - b.y
    local dz = a.z - b.z
    return math.sqrt(dx * dx + dy * dy + dz * dz)
end

local function DrawText2D(x, y, text, scale, r, g, b, a)
    scale = scale or 0.30
    r, g, b, a = r or 255, g or 255, b or 255, a or 255
    SetTextFont(0)
    SetTextScale(scale, scale)
    SetTextColour(r, g, b, a)
    SetTextOutline()
    SetTextCentre(true)
    BeginTextCommandDisplayText("STRING")
    AddTextComponentSubstringPlayerName(text)
    EndTextCommandDisplayText(x, y)
end

local function Draw2DSegment(x, y, w, h, r, g, b, a)
    DrawRect(x, y, w, h, r, g, b, a)
end

local function Draw2DLine(x1, y1, x2, y2, width, r, g, b, a)
    local dx = x2 - x1
    local dy = y2 - y1
    local len = math.sqrt(dx * dx + dy * dy)

    if len <= 0.0001 then
        Draw2DSegment(x1, y1, width, 0.002, r, g, b, a)
        return
    end

    local steps = math.floor(len / 0.002)
    if steps < 1 then steps = 1 end
    if steps > 40 then steps = 40 end

    for i = 0, steps do
        local t = i / steps
        local x = x1 + dx * t
        local y = y1 + dy * t
        Draw2DSegment(x, y, width, 0.002, r, g, b, a)
    end
end

local function DrawTable2D(x, y, tbl, scale)
    scale = scale or 0.30
    local text = ""
    for k, v in pairs(tbl) do
        text = text .. tostring(k) .. ": " .. tostring(v) .. " "
    end
    DrawText2D(x, y, text, scale)
end

local function DrawBar2D(x, y, width, height, percent, r, g, b, a)
    DrawRect(x, y, width, height, 0, 0, 0, 150)
    local w = width * math.max(0.0, math.min(1.0, percent))
    DrawRect(x - (width - w) / 2.0, y, w, height - 0.002, r, g, b, a)
end

local function GetThreatLevel(ped)
    if not DoesEntityExist(ped) or IsEntityDead(ped) then
        return 0
    end

    local armed    = IsPedArmed(ped, 4)
    local shooting = IsPedShooting(ped)
    local melee    = IsPedInMeleeCombat(ped)

    if shooting or melee then
        return 2
    end

    if armed then
        return 1
    end

    return 0
end

local function ThreatColor(threatLevel, dist, maxRange)
    if threatLevel == 2 then
        return 255, 50, 50
    elseif threatLevel == 1 then
        return 255, 140, 0
    else
        local t = math.min(dist / maxRange, 1.0)
        local g = 255
        local r = 255 * t
        return r, g, 50
    end
end

local function GetBoneWorldPos(ped, boneId)
    local idx = GetPedBoneIndex(ped, boneId)
    if not idx or idx == -1 then return nil end

    local x, y, z = table.unpack(GetWorldPositionOfEntityBone(ped, idx))
    return { x = x, y = y, z = z }
end

local function DrawSkeletonForPed(ped, dist, threatLevel)
    if not Config.showSkeleton then return end
    if not DoesEntityExist(ped) then return end

    local r, g, b = ThreatColor(threatLevel or 0, dist, Config.range)

    -- Alle Bones einmal abfragen
    local boneWorld = {}
    for name, id in pairs(Bones) do
        boneWorld[name] = GetBoneWorldPos(ped, id)
    end

    -- Skeleton-Linien
    for _, pair in ipairs(SkeletonLines) do
        local aName, bName = pair[1], pair[2]
        local aPos = boneWorld[aName]
        local bPos = boneWorld[bName]

        if aPos and bPos then
            DrawLine(
                aPos.x, aPos.y, aPos.z,
                bPos.x, bPos.y, bPos.z,
                r, g, b, 255
            )

            -- DEBUG: kleine Marker auf jedem Gelenk (kannst du später rauswerfen)
            -- DrawMarker(2, aPos.x, aPos.y, aPos.z, 0.0,0.0,0.0, 0.0,0.0,0.0, 0.05,0.05,0.05, r,g,b,200, false,true,2,false,nil,nil,false)
            -- DrawMarker(2, bPos.x, bPos.y, bPos.z, 0.0,0.0,0.0, 0.0,0.0,0.0, 0.05,0.05,0.05, r,g,b,200, false,true,2,false,nil,nil,false)
        end
    end
end

local function DrawSkeleton2DForPed(ped, dist, threatLevel)
    if not Config.showSkeleton then return end
    if not DoesEntityExist(ped) then return end

    local r, g, b = ThreatColor(threatLevel or 0, dist, Config.range)

    -- World-Positionen holen
    local boneWorld = {}
    for name, id in pairs(Bones) do
        boneWorld[name] = GetBoneWorldPos(ped, id)
    end

    -- Erst alle Bones in Screen-Koordinaten projezieren
    local boneScreen = {}
    for name, pos in pairs(boneWorld) do
        if pos then
            local onScreen, sx, sy = World3dToScreen2d(pos.x, pos.y, pos.z)
            if onScreen then
                boneScreen[name] = { x = sx, y = sy }
            end
        end
    end

    -- Linien nur zeichnen, wenn BEIDE Punkte im Screen sind
    for _, pair in ipairs(SkeletonLines) do
        local aName, bName = pair[1], pair[2]
        local a2d = boneScreen[aName]
        local b2d = boneScreen[bName]

        if a2d and b2d then
            Draw2DLine(a2d.x, a2d.y, b2d.x, b2d.y, 0.0018, r, g, b, 255)
        end
    end
end

local function DrawVehicleInfo(vehicle, driverPed, dist, driverThreat)
    if not Config.showVehicles then return end
    if not DoesEntityExist(vehicle) then return end

    local vehPos = GetEntityCoords(vehicle)
    local onScreen, sx, sy = World3dToScreen2d(vehPos.x, vehPos.y, vehPos.z + 0.5)
    if Config.onlyOnScreen and not onScreen then return end

    local modelHash = GetEntityModel(vehicle)
    local nameLabel = GetDisplayNameFromVehicleModel(modelHash)
    local name = (nameLabel and nameLabel ~= "") and nameLabel or "VEHICLE"
    local nameText = GetLabelText(name)
    if nameText and nameText ~= "NULL" then
        name = nameText
    end

    local speed = GetEntitySpeed(vehicle) * 3.6
    local plate = GetVehicleNumberPlateText(vehicle) or ""

    local baseY = sy + 0.02
    local r, g, b = 255, 255, 255

    if driverThreat == 2 then
        r, g, b = 255, 50, 50
    elseif driverThreat == 1 then
        r, g, b = 255, 140, 0
    end

    DrawText2D(sx, baseY, string.format("%s [%.0f km/h]", name, speed),
               0.28, r, g, b, 255)
    DrawText2D(sx, baseY + 0.020, string.format("Plate: %s", plate),
               0.24, 200, 200, 200, 255)

    DrawLine(
        vehPos.x, vehPos.y, vehPos.z + 0.0,
        vehPos.x, vehPos.y, vehPos.z + 1.5,
        r, g, b, 200
    )
end

function GetLocalizedWeaponName(weaponHash)
    local weaponName = WEAPON_GXT_MAP[weaponHash]
    if weaponName then
        local label = GetLabelText(weaponName)
        if label and label ~= "NULL" then
            return label
        else
            return "Unbekannte Waffe: " ..weaponName
        end
    else
        return "Unbekannter Hash: ".. tostring(weaponHash)
    end
end

function GetWeaponStats(weaponHash, ped)
    local stats = {
        name = GetLocalizedWeaponName(weaponHash),
        currentAmmo = 0,
        maxAmmo = 0,
        hash = weaponHash,
    }
    if GetSelectedPedWeapon(ped) then
        stats.currentAmmo = GetAmmoInPedWeapon(ped, weaponHash)
        local success, max = GetMaxAmmo(ped, weaponHash)
        stats.maxAmmo = max or 0
    end
    return stats
end
-----------------------------
-- HAUPT-LOOP
-----------------------------
CreateThread(function()
    while true do
        if espEnabled then
            local myPed   = PlayerPedId()
            local myCoords = GetEntityCoords(myPed)
            local myHead   = GetBoneWorldPos(myPed, Bones.Head) or myCoords

            -- 1) Spieler
            for _, player in ipairs(GetActivePlayers()) do
                if player ~= PlayerId() then
                    local ped = GetPlayerPed(player)
                    if DoesEntityExist(ped) and not IsEntityDead(ped) then
                        local targetCoords = GetEntityCoords(ped)
                        local dist = Distance(targetCoords, myCoords)

                        if dist <= Config.range then
                            local threatLevel = GetThreatLevel(ped)

                            -- 🔹 Linie zu Spielern: IMMER innerhalb Config.range
                            local headPos = GetBoneWorldPos(ped, Bones.Head) or targetCoords
                            local lr, lg, lb = ThreatColor(threatLevel, dist, Config.range)
                            DrawLine(
                                myHead.x, myHead.y, myHead.z,
                                headPos.x, headPos.y, headPos.z,
                                lr, lg, lb, 180
                            )

                            -- 🔹 HUD-Zeug NUR, wenn dist <= infoRange
                            if dist <= Config.infoRange then
                                -- Skeleton (HUD)
                                DrawSkeleton2DForPed(ped, dist, threatLevel)

                                local onScreen, sx, sy = World3dToScreen2d(headPos.x, headPos.y, headPos.z + 0.2)
                                if (not Config.onlyOnScreen) or onScreen then
                                    if Config.showNames then
                                        local name = GetPlayerName(player) or "Unknown"
                                        local nameColorR, nameColorG, nameColorB =
                                            ThreatColor(threatLevel, dist, Config.range)
                                        local tag = string.format("[P] %s [%.1fm]", name, dist)
                                        DrawText2D(sx, sy - 0.040, tag, 0.30,
                                                nameColorR, nameColorG, nameColorB, 255)
                                    end

                                    if Config.showHealth then
                                        local hp    = GetEntityHealth(ped) - 100.0
                                        local armor = GetPedArmour(ped) * 1.0
                                        hp    = math.max(0.0, math.min(100.0, hp))
                                        armor = math.max(0.0, math.min(100.0, armor))

                                        local barWidth  = 0.06
                                        local barHeight = 0.008

                                        DrawBar2D(sx, sy - 0.015, barWidth, barHeight,
                                                hp / 100.0, 0, 255, 0, 220)
                                        if armor > 0 then
                                            DrawBar2D(sx, sy - 0.003, barWidth, barHeight,
                                                    armor / 100.0, 0, 150, 255, 220)
                                        end
                                    end

                                    if Config.showWeapon then
                                        local weaponName = "Unarmed"
                                        local weaponHash = GetSelectedPedWeapon(ped)
                                        if weaponHash then
                                            weaponName = GetLocalizedWeaponName(weaponHash)
                                            print("Waffenname: "..weaponName)
                                        else
                                            weaponName = "Unarmed"
                                        end
                                        DrawText2D(sx, sy + 0.020, weaponName, 0.26,
                                                230, 230, 230, 255)
                                    end

                                    if Config.showWeaponStats then
                                        local weaponHash = GetSelectedPedWeapon(ped)
                                        local stats = GetWeaponStats(weaponHash, ped)
                                        local statsText = string.format("Ammo: %d / %d", stats.currentAmmo, stats.maxAmmo)
                                        DrawText2D(sx, sy + 0.040, statsText, 0.22,
                                                200, 200, 200, 255)
                                    end
                                end

                                -- Vehicle-Overlay auch nur im Info-Bereich
                                if Config.showVehicles and IsPedInAnyVehicle(ped, false) then
                                    local veh = GetVehiclePedIsIn(ped, false)
                                    DrawVehicleInfo(veh, ped, dist, threatLevel)
                                end
                            end
                        end
                    end
                end
            end

            -- 2) NPCs
            if Config.showNPCs and GetGamePool then
                local peds = GetGamePool("CPed")
                for _, ped in ipairs(peds) do
                    if DoesEntityExist(ped)
                       and not IsEntityDead(ped)
                       and ped ~= myPed
                       and not IsPedAPlayer(ped) then

                        local targetCoords = GetEntityCoords(ped)
                        local dist = Distance(targetCoords, myCoords)

                        if dist <= Config.infoRange then
                            local threatLevel = GetThreatLevel(ped)

                            DrawSkeleton2DForPed(ped, dist, threatLevel)

                            local headPos = GetBoneWorldPos(ped, Bones.Head) or targetCoords
                            local onScreen, sx, sy = World3dToScreen2d(headPos.x, headPos.y, headPos.z + 0.2)

                            if (not Config.onlyOnScreen) or onScreen then
                                if Config.showNames then
                                    local nameColorR, nameColorG, nameColorB =
                                        ThreatColor(threatLevel, dist, Config.range)
                                    local tag = string.format("[NPC] [%.1fm]", dist)
                                    DrawText2D(sx, sy - 0.040, tag, 0.28,
                                            nameColorR, nameColorG, nameColorB, 255)
                                end

                                if Config.showHealth then
                                    local hp = GetEntityHealth(ped) - 100.0
                                    hp = math.max(0.0, math.min(100.0, hp))
                                    local barWidth  = 0.05
                                    local barHeight = 0.007
                                    DrawBar2D(sx, sy - 0.015, barWidth, barHeight,
                                            hp / 100.0, 0, 255, 0, 220)
                                end

                                if Config.showWeapon then
                                    local weaponName = "Unarmed"
                                    local weaponHash = GetSelectedPedWeapon(ped)
                                    if weaponHash then
                                        weaponName = GetLocalizedWeaponName(weaponHash)
                                        print("Waffenname: "..weaponName)
                                    else
                                        weaponName = "Unarmed"
                                    end
                                    DrawText2D(sx, sy + 0.020, weaponName, 0.26,
                                            230, 230, 230, 255)
                                end

                                if Config.showWeaponStats then
                                        local weaponHash = GetSelectedPedWeapon(ped)
                                        local stats = GetWeaponStats(weaponHash, ped)
                                        local statsText = string.format("Ammo: %d / %d", stats.currentAmmo, stats.maxAmmo)
                                        DrawText2D(sx, sy + 0.040, statsText, 0.22,
                                                200, 200, 200, 255)
                                    end
                            end

                            if Config.showVehicles and IsPedInAnyVehicle(ped, false) then
                                local veh = GetVehiclePedIsIn(ped, false)
                                DrawVehicleInfo(veh, ped, dist, threatLevel)
                            end
                        end

                    end
                end
            end

            Wait(0)
        else
            Wait(250)
        end
    end
end)

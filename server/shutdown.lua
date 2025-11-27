-- server.lua

-- Command: /serverstop [Minuten] (z.B. /serverstop 5)
RegisterCommand('serverstop', function(source, args, rawCommand)
    local time = tonumber(args[1]) or 0.1 -- Standard: 1 Minute
    local seconds = time * 60

    -- 1. Ankündigung
    TriggerClientEvent('chat:addMessage', -1, {
        args = {"SERVER", "Der Server fährt in " .. time .. " Minute(n) herunter! Bitte ausloggen."}
    })

    print("^3[Shutdown]^7 Initiated sequence: " .. time .. " minutes.")

    -- Countdown Loop
    Citizen.CreateThread(function()
        while seconds > 0 do
            seconds = seconds - 1
            Citizen.Wait(1000)

            -- Warnungen bei bestimmten Zeiten
            if seconds == 30 or seconds == 10 or seconds <= 5 then
                TriggerClientEvent('chat:addMessage', -1, {
                    args = {"SERVER", "Shutdown in " .. seconds .. " Sekunden!"}
                })
            end
        end

        -- 2. "Graceful" Phase: Speichern & Kicken
        print("^3[Shutdown]^7 Saving all players...")

        -- Speichere alle Spieler-Inventare
        print("^3[Shutdown]^7 Saving all player inventories...")
        
        local players = GetPlayers()
        for _, playerId in ipairs(players) do
            local playerSrc = tonumber(playerId)
            
            -- Inventar speichern via Export
            if GetResourceState('fw_core') == 'started' then
                TriggerEvent('fw:server:savePlayerInventory', playerSrc)
            end
            
            -- Spieler kicken
            DropPlayer(playerSrc, "🔄 Server Neustart\n\nDer Server wird neu gestartet.\nDeine Daten wurden sicher gespeichert.\n\nKomme in ca. 2 Minuten wieder!")
        end
        
        Citizen.Wait(2000) -- Gib der DB Zeit zum Speichern

        -- 3. Server stoppen
        print("^1[Shutdown]^7 Shutting down now.")
        Citizen.Wait(1000) -- Kurz warten, damit Kicks durchgehen
        ExecuteCommand('quit') -- Beendet den Server-Prozess hart, aber nach dem Cleanup
    end)

end, true) -- "true" bedeutet: Nur Admins (ACE Perms) dürfen das
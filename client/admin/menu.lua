local menuOpen = false

RegisterCommand('admin', function()
    ToggleAdminMenu()
end, false)

RegisterKeyMapping("admin", "AdminMenu an/aus", "keyboard", "F9")

function ToggleAdminMenu()
    menuOpen = not menuOpen

    SetNuiFocus(menuOpen, menuOpen)
    -- SetNuiFocusKeepInput(menuOpen)

    if menuOpen then
        local menuData = {
            categories = {
                {
                    id = "players",
                    label = "Spieler",
                    items = {
                        { id = "identifier", label = "Eigene FiveM License anzeigen und kopieren" },
                        { id = "heal_self", label = "Selbst heilen" },
                        { id = "revive_self", label = "Selbst wiederbeleben" },
                        { id = "tp_to_waypoint", label = "Zu Wegpunkt teleportieren" },
                        { id = "get_coords", label = "Eigene Koordinaten anzeigen und kopieren" },
                        { id = "get_heading", label = "Eigenes Heading anzeigen und kopieren"},
                        { id = "get_coords4", label = "Eigene Koordinaten (inkl. Heading) anzeigen und kopieren" },
                        { id = "noclip", label = "Noclip an/aus" },
                        { id = "additem", label = "Item zu Spieler hinzufügen" },
                        { id = "remitem", label = "Item von Spieler entfernen" },
                        { id = "testnachricht", label = "Testnachricht" },
                        }
                },
                {
                    id = "vehicles",
                    label = "Fahrzeuge",
                    items = {
                        { id = "spawn_car", label = "Fahrzeug spawnen" },
                        { id = "fix_car", label = "Fahrzeug reparieren" },
                        { id = "delete_car", label = "Fahrzeug löschen" },
                    }
                },
                {
                    id = "server",
                    label = "Server",
                    items = {
                        { id = "reload_itemlist", label = "Itemliste neu laden" },
                        { id = "announce", label = "Servernachricht senden" },

                    }
                },
            }
        }

        SendNUIMessage({
            action = "open",
            data   = menuData
        })
    else
        SendNUIMessage({ action = "close" })
    end
end

RegisterNUICallback('closeMenu', function(_, cb)
    menuOpen = false
    SetNuiFocus(false, false)
    -- SetNuiFocusKeepInput(false)
    cb({})
end)

RegisterNUICallback('adminAction', function(data, cb)
    local cat = data.category
    local item = data.item

    local requiresInput = {
        additem =           { placeholder = "Item-Name & Menge (item 5)", label = "Item zu Spieler hinzufügen" },
        remitem =           { placeholder = "Item-Name & Menge (item 5)", label = "Item von Spieler entfernen" },
        spawn_car =         { placeholder = "Fahrzeug-Model (adder)", label = "Fahrzeug spawnen" },
        announce =          { placeholder = "Nachricht eingeben...", label = "Servernachricht senden" },
        testnachricht =     { placeholder = "Testnachricht eingeben...", label = "Testnachricht" },
    }

    if requiresInput[item] then
        SendNUIMessage({
            action = "showInput",
            title = requiresInput[item].label,
            placeholder = requiresInput[item].placeholder,
            callbackId = item,
        })

    elseif cat == "players" and item == "heal_self" then
        local ped = PlayerPedId()
        SetEntityHealth(ped, 200)
    elseif cat == "players" and item == "tp_to_waypoint" then
        FW.Admin.TeleportToWaypoint()
    elseif cat == "players" and item == "get_coords" then
        FW.Admin.coords3()
    elseif cat == "players" and item == "get_heading" then
        FW.Admin.heading()
    elseif cat == "players" and item == "get_coords4" then
        FW.Admin.coords4()
    elseif cat == "players" and item == "revive_self" then
        FW.Admin.RevivePlayer()
    elseif cat == "players" and item == "noclip" then
        FW.Admin.toggleNoClip()
    elseif cat == "players" and item == "identifier" then
        FW.Admin.identifier()
    elseif cat == "vehicles" and item == "fix_car" then
        FW.Admin.FixCurrentVehicle()
    elseif cat == "vehicles" and item == "delete_car" then
        FW.Admin.DeleteVehicle()
    elseif cat == "server" and item == "reload_itemlist" then
        FW.Admin.ReloadItemList()
    end

    cb({})
end)

RegisterNUICallback('inputAction', function(data, cb)
    local action = data.action
    local input = data.input
    if action == "additem" then
        local item, count = input:match("^(%S+)%s+(%d+)$")
        if item and count then
            count = tonumber(count)
            FW.Admin.AddItemSelf(item, count)
        else
            FW.ClientNotify("[FW] Ungültige Eingabe. Benutze das Format: itemName menge (z.B. bread 5)", 5000)
        end
    elseif action == "remitem" then
        local item, count = input:match("^(%S+)%s+(%d+)$")
        if item and count then
            count = tonumber(count)
            FW.Admin.RemoveItemSelf(item, count)
            FW.ClientNotify("[FW] Item "..item..", Menge"..count.." entfernt.")
        else
            local onlyItem = input:match("^(%S+)$")
            if onlyItem then
                FW.Admin.RemoveItemSelf(onlyItem, nil)
                FW.ClientNotify("[FW] Item "..onlyItem.." komplett entfernt.")
            else
                FW.ClientNotify("[FW] Falsches Format! Erwartet: item_name anzahl (z.B. bread 5) oder nur item_name um alle zu entfernen.", 5000)
            end
        end
    elseif action == "spawn_car" then
        FW.Admin.SpawnAdminVehicle(input)
    elseif action == "announce" then
        TriggerServerEvent('fw:admin:sendAnnouncement', input)
    elseif action == "testnachricht" then
        FW.ClientNotify("Testnachricht vom Admin-Menü: "..input, 5000)
    end
    cb({})
end)
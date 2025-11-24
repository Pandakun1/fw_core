FW = FW or {}
FW.Admin = FW.Admin or {}

function FW.Admin.identifier()
    FW.TriggerCallback("fw:getPlayerIdentifiers", function(identifiers)
        if #identifiers == 0 then
            FW.ClientNotify("Keine Identifiers gefunden!")
            return
        end
        if identifiers then
            local cut = (identifiers):gsub("license:", "")
            FW.ClientNotify("Deine FiveM License ist: " .. cut)
            FW.CopyToClipboard(cut)
        else
            FW.ClientNotify("Fehler beim Abrufen der Identifiers!")
        end
    end)
end

function FW.Admin.ReloadItemList()
    TriggerServerEvent('fw:inventory:LoadItemList')
    FW.ClientNotify("Itemliste wird neu geladen...")
end

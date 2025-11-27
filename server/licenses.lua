-- Lizenzen System
-- Erstellt Datenbanktabellen für Lizenzen und Spieler-Lizenzen

local function CreateLicenseTables()
    -- Tabelle für verfügbare Lizenzen
    exports.oxmysql:execute([[
        CREATE TABLE IF NOT EXISTS `licenses` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `name` VARCHAR(50) NOT NULL UNIQUE,
            `label` VARCHAR(100) NOT NULL,
            `description` TEXT NULL,
            `icon` VARCHAR(10) NULL DEFAULT '📄',
            `price` INT NOT NULL DEFAULT 0,
            `required_level` INT NOT NULL DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            INDEX `idx_name` (`name`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]])

    -- Tabelle für Spieler-Lizenzen
    exports.oxmysql:execute([[
        CREATE TABLE IF NOT EXISTS `player_licenses` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `identifier` VARCHAR(100) NOT NULL,
            `license_name` VARCHAR(50) NOT NULL,
            `obtained_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `expires_at` TIMESTAMP NULL,
            `issuer` VARCHAR(100) NULL,
            `status` ENUM('active', 'suspended', 'revoked', 'expired') DEFAULT 'active',
            PRIMARY KEY (`id`),
            UNIQUE KEY `unique_player_license` (`identifier`, `license_name`),
            INDEX `idx_identifier` (`identifier`),
            INDEX `idx_license` (`license_name`),
            INDEX `idx_status` (`status`),
            FOREIGN KEY (`license_name`) REFERENCES `licenses`(`name`) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]])

    print('^2[Lizenzen] Datenbanktabellen erstellt/geprüft^0')
end

-- Standardlizenzen einfügen
local function InsertDefaultLicenses()
    local defaultLicenses = {
        {
            name = 'driver_license',
            label = 'Führerschein Klasse B',
            description = 'Berechtigung zum Führen von PKWs bis 3.5t',
            icon = '🚗',
            price = 5000,
            required_level = 0
        },
        {
            name = 'driver_license_truck',
            label = 'Führerschein Klasse C',
            description = 'Berechtigung zum Führen von LKWs',
            icon = '🚚',
            price = 15000,
            required_level = 5
        },
        {
            name = 'driver_license_bike',
            label = 'Führerschein Klasse A',
            description = 'Berechtigung zum Führen von Motorrädern',
            icon = '🏍️',
            price = 3000,
            required_level = 0
        },
        {
            name = 'weapon_license',
            label = 'Waffenschein',
            description = 'Berechtigung zum Führen von Schusswaffen',
            icon = '🔫',
            price = 50000,
            required_level = 10
        },
        {
            name = 'hunting_license',
            label = 'Jagdschein',
            description = 'Berechtigung zur Jagd',
            icon = '🦌',
            price = 25000,
            required_level = 5
        },
        {
            name = 'fishing_license',
            label = 'Angelschein',
            description = 'Berechtigung zum Angeln',
            icon = '🎣',
            price = 1000,
            required_level = 0
        },
        {
            name = 'boat_license',
            label = 'Bootsführerschein',
            description = 'Berechtigung zum Führen von Booten',
            icon = '⛵',
            price = 8000,
            required_level = 0
        },
        {
            name = 'aircraft_license',
            label = 'Flugschein',
            description = 'Berechtigung zum Führen von Flugzeugen',
            icon = '✈️',
            price = 100000,
            required_level = 15
        },
        {
            name = 'helicopter_license',
            label = 'Helikopterschein',
            description = 'Berechtigung zum Führen von Helikoptern',
            icon = '🚁',
            price = 150000,
            required_level = 20
        },
        {
            name = 'business_license',
            label = 'Gewerbeschein',
            description = 'Berechtigung zum Betreiben eines Geschäfts',
            icon = '💼',
            price = 10000,
            required_level = 0
        }
    }

    for _, license in ipairs(defaultLicenses) do
        exports.oxmysql:execute(
            'INSERT INTO licenses (name, label, description, icon, price, required_level) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description), icon = VALUES(icon), price = VALUES(price), required_level = VALUES(required_level)',
            {license.name, license.label, license.description, license.icon, license.price, license.required_level}
        )
    end

    print('^2[Lizenzen] Standard-Lizenzen eingefügt/aktualisiert^0')
end

-- Beim Serverstart ausführen
CreateThread(function()
    Wait(1000) -- Warte bis oxmysql geladen ist
    CreateLicenseTables()
    Wait(500)
    InsertDefaultLicenses()
end)

-- Funktionen für Lizenzverwaltung
FW = FW or {}
FW.Licenses = {}

-- Lizenz an Spieler geben
function FW.Licenses.GiveLicense(identifier, licenseName, issuer, expiresAt)
    local result = exports.oxmysql:executeSync(
        'INSERT INTO player_licenses (identifier, license_name, issuer, expires_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = "active", obtained_at = CURRENT_TIMESTAMP, issuer = VALUES(issuer), expires_at = VALUES(expires_at)',
        {identifier, licenseName, issuer, expiresAt}
    )
    return result and result.affectedRows > 0
end

-- Lizenz von Spieler entfernen
function FW.Licenses.RevokeLicense(identifier, licenseName)
    local result = exports.oxmysql:executeSync(
        'UPDATE player_licenses SET status = "revoked" WHERE identifier = ? AND license_name = ?',
        {identifier, licenseName}
    )
    return result and result.affectedRows > 0
end

-- Lizenz suspendieren
function FW.Licenses.SuspendLicense(identifier, licenseName)
    local result = exports.oxmysql:executeSync(
        'UPDATE player_licenses SET status = "suspended" WHERE identifier = ? AND license_name = ?',
        {identifier, licenseName}
    )
    return result and result.affectedRows > 0
end

-- Alle Lizenzen eines Spielers abrufen
function FW.Licenses.GetPlayerLicenses(identifier)
    local licenses = exports.oxmysql:executeSync([[
        SELECT 
            pl.license_name,
            l.label,
            l.description,
            l.icon,
            pl.obtained_at,
            pl.expires_at,
            pl.issuer,
            pl.status
        FROM player_licenses pl
        JOIN licenses l ON pl.license_name = l.name
        WHERE pl.identifier = ? AND pl.status = 'active'
        AND (pl.expires_at IS NULL OR pl.expires_at > NOW())
    ]], {identifier})
    return licenses or {}
end

-- Prüfen ob Spieler eine Lizenz hat
function FW.Licenses.HasLicense(identifier, licenseName)
    local result = exports.oxmysql:executeSync([[
        SELECT COUNT(*) as count
        FROM player_licenses
        WHERE identifier = ? AND license_name = ? AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
    ]], {identifier, licenseName})
    return result and result[1] and result[1].count > 0
end

-- Alle verfügbaren Lizenzen abrufen
function FW.Licenses.GetAllLicenses()
    local licenses = exports.oxmysql:executeSync('SELECT * FROM licenses ORDER BY label ASC', {})
    return licenses or {}
end

-- Lizenz-Info abrufen
function FW.Licenses.GetLicenseInfo(licenseName)
    local result = exports.oxmysql:executeSync('SELECT * FROM licenses WHERE name = ? LIMIT 1', {licenseName})
    return result and result[1]
end

-- Events
RegisterNetEvent('fw:licenses:give', function(targetId, licenseName)
    local src = source
    -- Hier Admin-Check einfügen
    
    local target = tonumber(targetId)
    if not target then return end
    
    local Player = FW.GetPlayer(target)
    if not Player then return end
    
    local success = FW.Licenses.GiveLicense(Player.identifier, licenseName, GetPlayerName(src), nil)
    if success then
        TriggerClientEvent('FW:Notify', src, 'Lizenz erfolgreich vergeben', 'success')
        TriggerClientEvent('FW:Notify', target, 'Du hast eine neue Lizenz erhalten: ' .. licenseName, 'success')
    else
        TriggerClientEvent('FW:Notify', src, 'Fehler beim Vergeben der Lizenz', 'error')
    end
end)

RegisterNetEvent('fw:licenses:revoke', function(targetId, licenseName)
    local src = source
    -- Hier Admin-Check einfügen
    
    local target = tonumber(targetId)
    if not target then return end
    
    local Player = FW.GetPlayer(target)
    if not Player then return end
    
    local success = FW.Licenses.RevokeLicense(Player.identifier, licenseName)
    if success then
        TriggerClientEvent('FW:Notify', src, 'Lizenz erfolgreich entzogen', 'success')
        TriggerClientEvent('FW:Notify', target, 'Eine deiner Lizenzen wurde entzogen: ' .. licenseName, 'error')
    else
        TriggerClientEvent('FW:Notify', src, 'Fehler beim Entziehen der Lizenz', 'error')
    end
end)

-- Callback für Client (von Inventar)
RegisterNetEvent('fw:licenses:requestLicenses', function()
    local src = source
    local Player = FW.GetPlayer(src)
    if not Player then return end
    
    local licenses = FW.Licenses.GetPlayerLicenses(Player.identifier)
    TriggerClientEvent('fw:licenses:sendLicenses', src, licenses)
end)

-- Admin Events
RegisterNetEvent('fw:admin:giveLicense', function(targetId, licenseName)
    local src = source
    -- TODO: Admin-Check hier einfügen
    -- if not FW.IsAdmin(src) then return end
    
    local target = tonumber(targetId)
    if not target then 
        TriggerClientEvent('FW:Notify', src, 'Ungültige Spieler-ID', 'error')
        return 
    end
    
    local Player = FW.GetPlayer(target)
    if not Player then 
        TriggerClientEvent('FW:Notify', src, 'Spieler nicht gefunden', 'error')
        return 
    end
    
    local licenseInfo = FW.Licenses.GetLicenseInfo(licenseName)
    if not licenseInfo then
        TriggerClientEvent('FW:Notify', src, 'Lizenz nicht gefunden: ' .. licenseName, 'error')
        return
    end
    
    local success = FW.Licenses.GiveLicense(Player.identifier, licenseName, GetPlayerName(src), nil)
    if success then
        TriggerClientEvent('FW:Notify', src, 'Lizenz "' .. licenseInfo.label .. '" an ' .. GetPlayerName(target) .. ' vergeben', 'success')
        TriggerClientEvent('FW:Notify', target, 'Du hast eine neue Lizenz erhalten: ' .. licenseInfo.label, 'success')
    else
        TriggerClientEvent('FW:Notify', src, 'Fehler beim Vergeben der Lizenz', 'error')
    end
end)

RegisterNetEvent('fw:admin:revokeLicense', function(targetId, licenseName)
    local src = source
    -- TODO: Admin-Check hier einfügen
    
    local target = tonumber(targetId)
    if not target then 
        TriggerClientEvent('FW:Notify', src, 'Ungültige Spieler-ID', 'error')
        return 
    end
    
    local Player = FW.GetPlayer(target)
    if not Player then 
        TriggerClientEvent('FW:Notify', src, 'Spieler nicht gefunden', 'error')
        return 
    end
    
    local licenseInfo = FW.Licenses.GetLicenseInfo(licenseName)
    if not licenseInfo then
        TriggerClientEvent('FW:Notify', src, 'Lizenz nicht gefunden: ' .. licenseName, 'error')
        return
    end
    
    local success = FW.Licenses.RevokeLicense(Player.identifier, licenseName)
    if success then
        TriggerClientEvent('FW:Notify', src, 'Lizenz "' .. licenseInfo.label .. '" von ' .. GetPlayerName(target) .. ' entzogen', 'success')
        TriggerClientEvent('FW:Notify', target, 'Deine Lizenz wurde entzogen: ' .. licenseInfo.label, 'error')
    else
        TriggerClientEvent('FW:Notify', src, 'Fehler beim Entziehen der Lizenz oder Lizenz nicht vorhanden', 'error')
    end
end)

RegisterNetEvent('fw:admin:listAllLicenses', function()
    local src = source
    -- TODO: Admin-Check hier einfügen
    
    local licenses = FW.Licenses.GetAllLicenses()
    if not licenses or #licenses == 0 then
        TriggerClientEvent('FW:Notify', src, 'Keine Lizenzen gefunden', 'error')
        return
    end
    
    TriggerClientEvent('FW:Notify', src, '=== Verfügbare Lizenzen ===', 'info')
    for _, license in ipairs(licenses) do
        local msg = string.format('%s %s - Name: %s (Preis: $%d)', 
            license.icon or '📄', 
            license.label, 
            license.name,
            license.price
        )
        TriggerClientEvent('FW:Notify', src, msg, 'info')
        Wait(100) -- Verhindere Spam
    end
end)

RegisterNetEvent('fw:admin:getPlayerLicenses', function(targetId)
    local src = source
    -- TODO: Admin-Check hier einfügen
    
    local target = tonumber(targetId)
    if not target then 
        TriggerClientEvent('FW:Notify', src, 'Ungültige Spieler-ID', 'error')
        return 
    end
    
    local Player = FW.GetPlayer(target)
    if not Player then 
        TriggerClientEvent('FW:Notify', src, 'Spieler nicht gefunden', 'error')
        return 
    end
    
    local licenses = FW.Licenses.GetPlayerLicenses(Player.identifier)
    if not licenses or #licenses == 0 then
        TriggerClientEvent('FW:Notify', src, GetPlayerName(target) .. ' hat keine Lizenzen', 'info')
        return
    end
    
    TriggerClientEvent('FW:Notify', src, '=== Lizenzen von ' .. GetPlayerName(target) .. ' ===', 'info')
    for _, license in ipairs(licenses) do
        local msg = string.format('%s %s (Status: %s)', 
            license.icon or '📄', 
            license.label,
            license.status
        )
        TriggerClientEvent('FW:Notify', src, msg, 'info')
        Wait(100)
    end
end)

-- Lizenz zeigen Event
-- ID Card Zeigen Event (an spezifischen Spieler)
RegisterNetEvent('fw:idcard:showToPlayer')
AddEventHandler('fw:idcard:showToPlayer', function(targetServerId)
    local src = source
    local playerName = GetPlayerName(src)
    
    -- Sende Benachrichtigung an Ziel-Spieler
    TriggerClientEvent('FW:Notify', targetServerId, 
        playerName .. ' zeigt dir seinen Personalausweis 🆔', 
        'info'
    )
    
    TriggerClientEvent('FW:Notify', src, 'Personalausweis gezeigt', 'success')
end)

-- Lizenz Zeigen Event (an spezifischen Spieler)
RegisterNetEvent('fw:licenses:showToPlayer')
AddEventHandler('fw:licenses:showToPlayer', function(targetServerId, licenseName, label)
    local src = source
    local playerName = GetPlayerName(src)
    
    -- Sende Benachrichtigung an Ziel-Spieler
    TriggerClientEvent('FW:Notify', targetServerId, 
        playerName .. ' zeigt dir: ' .. label, 
        'info'
    )
    
    TriggerClientEvent('FW:Notify', src, label .. ' gezeigt', 'success')
end)

-- Export Funktionen
exports('GiveLicense', FW.Licenses.GiveLicense)
exports('RevokeLicense', FW.Licenses.RevokeLicense)
exports('SuspendLicense', FW.Licenses.SuspendLicense)
exports('HasLicense', FW.Licenses.HasLicense)
exports('GetPlayerLicenses', FW.Licenses.GetPlayerLicenses)
exports('GetAllLicenses', FW.Licenses.GetAllLicenses)
exports('GetLicenseInfo', FW.Licenses.GetLicenseInfo)

print('^2[Lizenzen] System geladen^0')

FW = FW or {}
FW.DB = FW.DB or {}

function FW.DB.SetupTables()
    local createPlayersTableQuery = [[
        CREATE TABLE IF NOT EXISTS players (
            identifier      VARCHAR(64) NOT NULL PRIMARY KEY,
            name            VARCHAR(100) NOT NULL,
            money_cash      INT NOT NULL DEFAULT 0,
            money_bank      INT NOT NULL DEFAULT 0,
            inventory       LONGTEXT NOT NULL,
            job_name        VARCHAR(50) NOT NULL DEFAULT 'unemployed',
            job_grade       INT NOT NULL DEFAULT 0,
            position_x      DOUBLE NOT NULL DEFAULT 0,
            position_y      DOUBLE NOT NULL DEFAULT 0,
            position_z      DOUBLE NOT NULL DEFAULT 0,
            daten           LONGTEXT NOT NULL,
            last_seen       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ]]

    local createJobsTableQuery = [[
        CREATE TABLE IF NOT EXISTS jobs (
            identifier      VARCHAR(64) NOT NULL,
            job_name        VARCHAR(50) NOT NULL,
            label           VARCHAR(50) NOT NULL,
            grade           INT NOT NULL DEFAULT 0,
            PRIMARY KEY (identifier, job_name),
            FOREIGN KEY (identifier) REFERENCES players(identifier) ON DELETE CASCADE
        ) ENGINE=InnoDB
    ]]

    MySQL.query(createPlayersTableQuery, {}, function(result)
        print('[FW] - Spieler Tabelle wurde erstellt oder existiert bereits.')
    end)

    MySQL.query(createJobsTableQuery, {}, function(result)
        print('[FW] - Jobs Tabelle wurde erstellt oder existiert bereits.')
    end)
end


AddEventHandler('onResourceStart', function(resourceName)
    if (GetCurrentResourceName() ~= resourceName) then
        return
    end
    FW.DB.SetupTables()
end)

function FW.DB.LoadPlayer(source, identifier, cb)
    MySQL.single(
        'SELECT * FROM players where identifier = ?',
        {identifier},
        function(row)
            cb(row)
        end
    )
    TriggerClientEvent('fw:updateHud', source)
end

function FW.DB.InsertPlayer(row, cb)
    MySQL.insert(
        [[
            INSERT INTO players
                (identifier, name, money_cash, money_bank, job_name, job_grade, position_x, position_y, position_z, daten)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)        
        ]],
        {
            row.identifier,
            row.name,
            row.money_cash or row.money or 0,
            row.money_bank or row.bank or 0,
            row.job_name or row.job or 'unemployed',
            row.job_grade or 0,
            row.position_x or 0,
            row.position_y or 0,
            row.position_z or 75,
            row.daten or '{}'
        },
        function(insertId)
            if cb then cb(insertId) end
        end
    )
end

function FW.DB.SavePlayer(row, cb)
    print('Speichere Spieler: ' .. json.encode(row))
    MySQL.query(
        [[
            INSERT INTO players
                (identifier, name, money_cash, money_bank, job_name, job_grade, position_x, position_y, position_z, daten)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                money_cash = VALUES(money_cash),
                money_bank = VALUES(money_bank),
                job_name = VALUES(job_name),
                job_grade = VALUES(job_grade),
                position_x = VALUES(position_x),
                position_y = VALUES(position_y),
                position_z = VALUES(position_z),
                daten = VALUES(daten),
                last_seen = CURRENT_TIMESTAMP
        ]],
        {
            row.identifier,
            row.name,
            row.money or 0,
            row.bank or 0,
            row.job or 'unemployed',
            row.job_grade or 0,
            row.position_x or 0,
            row.position_y or 0,
            row.position_z or 75,
            row.daten or '{}'
        },
        function(affectedRows)
            if cb then cb(affectedRows) end
        end
        )
end

function FW.DB.UpdateInventory(identifier, inventory, cb)
    MySQL.query(
        'UPDATE players SET inventory = ? WHERE identifier = ?',
        { inventory, identifier },
        function(affectedRows)
            if cb then cb(affectedRows) end
        end
    )
end

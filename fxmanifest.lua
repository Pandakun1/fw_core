fx_version 'cerulean'
game 'gta5'

author 'Pandakun'
description 'Core resource für PandaSpielplatz server (Vue3 UI)'
version '1.0.0'

shared_scripts {
    'configs/*.lua',
    --'shared/*.lua',
    'handler/*.lua'
}

client_scripts {
    'client/**/*.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/main.lua',
    'server/callbacks.lua',
    'server/players.lua',
    'server/inventory.lua',
    'server/inventory_secondary.lua',  -- Secondary Inventory System (5 Modi)
    'server/inventory_equipment.lua',  -- Equipment Storage System (Rucksäcke/Taschen)
    'server/inventory_items.lua',
    'server/commands.lua',
    'server/licenses.lua',
    'server/ui_settings.lua',          -- UI Settings System (spielerabhängig)
    'server/shutdown.lua',
    'server/spawnlogik.lua',
    'server/Abfragepunkte.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/app.js',
    -- Lade alle Module und Core-Systeme rekursiv
    'html/core/**/*.js',
    'html/modules/**/*.js',
    'html/shared/**/*.js',
    'html/styles/*.css', -- Falls vorhanden, oder tailwind output
    -- Bilder
    --'html/img/*.png',
    --'html/img/*.jpg',
    'html/img/*.webp',
    --'html/img/*.svg'
}

provides {
    'es_extended',
    'qb-core'
}

dependency 'oxmysql'
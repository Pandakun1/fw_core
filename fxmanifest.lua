fx_version 'cerulean'
game 'gta5'

author 'Pandakun'
description 'Core resource für PandaSpielplatz server'
version '0.0.01'

-- Shared, client and server entry points
shared_scripts {
    'configs/*.lua',
    'shared/*.lua',
    'handler/*.lua'
}

client_scripts {
    'client/**/*.lua'
}

server_scripts {
    'server/**/*.lua',
    '@oxmysql/lib/MySQL.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/hud/app.js',
    'html/admin/menu.js',
    'html/admin/app.js',
    'html/hud/notify.js',
}

provides {
    'es_extended',
    'qb-core'
}

dependency 'oxmysql'
-- Exports and dependencies (uncomment/use as needed)
-- exports { 'SomeFunction' }
-- dependency 'essentialmode'  -- example dependency

-- Supported languages/locales (optional)
-- files { 'locales/en.json', 'locales/de.json' }
-- data_file 'LOCALE_FILE' 'locales/en.json'
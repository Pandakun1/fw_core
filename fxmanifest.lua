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
    'server/**/*.lua',
    '@oxmysql/lib/MySQL.lua'
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
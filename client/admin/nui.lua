-- Command - calls ToggleAdminMenu from menu.lua
RegisterCommand('admin', function()
    ToggleAdminMenu()
end, false)
RegisterKeyMapping('admin', 'Admin Menü', 'keyboard', 'F9')
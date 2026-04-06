Config = {}

-- Debug Modus (lädt aus main.json)
Config.Debug = false -- Wird beim Resource-Start aus main.json geladen

Config.AutoSaveInterval = 1 -- in Minuten

Config.AppearanceSpawn = vector4(-811.89, 175.12, 75.75, 119.41)

Config.Firstspawn = vector4(-610.40, -713.61, 874.97, 274.17)

Config.Resetspawn = vector4(-183.0, -498.0, 35.0, 70.0)

Config.MaxCharacters = 5 -- Maximum number of characters per player

-- Inventar Konfiguration
Config.Inventory = {
    MaxSlots = 50,           -- Player Haupt-Inventar
    MaxWeight = 50,          -- kg
    TrunkMaxSlots = 100,     -- Kofferraum Slots (erhöht von 50)
    GloveboxMaxSlots = 30,   -- Handschuhfach Slots (erhöht von 50)
    StashMaxSlots = 100,     -- Lager Standard Slots (erhöht von 50)
}
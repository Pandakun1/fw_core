# FW Core - Inventory Slots Migration Script
# Führt die SQL Migration aus um die inventory_slots Spalte hinzuzufügen

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FW CORE - INVENTORY SLOTS MIGRATION  " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# MySQL Credentials - ANPASSEN!
$mysqlHost = "localhost"
$mysqlUser = "fivem"
$mysqlPassword = "testabc"  # ANPASSEN!
$mysqlDatabase = "spielplatz"  # ANPASSEN!

Write-Host "Konfiguration:" -ForegroundColor Yellow
Write-Host "  Host: $mysqlHost" -ForegroundColor White
Write-Host "  User: $mysqlUser" -ForegroundColor White
Write-Host "  Database: $mysqlDatabase" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Fortfahren? (j/n)"
if ($confirm -ne "j" -and $confirm -ne "J") {
    Write-Host "Abgebrochen." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Führe Migration aus..." -ForegroundColor Yellow

# Prüfe ob mariadb.exe oder mysql.exe verfügbar ist
$mysqlPath = $null
if (Get-Command "mariadb" -ErrorAction SilentlyContinue) {
    $mysqlPath = "mariadb"
    Write-Host "MariaDB Client gefunden!" -ForegroundColor Green
} elseif (Get-Command "mysql" -ErrorAction SilentlyContinue) {
    $mysqlPath = "mysql"
    Write-Host "MySQL Client gefunden!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Weder mariadb.exe noch mysql.exe gefunden!" -ForegroundColor Red
    Write-Host "Bitte installiere MariaDB/MySQL Client oder füge es zum PATH hinzu." -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Führe die SQL-Datei manuell aus:" -ForegroundColor Yellow
    Write-Host "  mariadb -u $mysqlUser -p $mysqlDatabase < migration_inventory_slots.sql" -ForegroundColor Cyan
    Write-Host "  ODER" -ForegroundColor Yellow
    Write-Host "  mysql -u $mysqlUser -p $mysqlDatabase < migration_inventory_slots.sql" -ForegroundColor Cyan
    exit 1
}

# Führe SQL Script aus
$scriptPath = Join-Path $PSScriptRoot "migration_inventory_slots.sql"
$env:MYSQL_PWD = $mysqlPassword

Write-Host "Führe SQL Script aus mit $mysqlPath..." -ForegroundColor Yellow
& $mysqlPath -h $mysqlHost -u $mysqlUser $mysqlDatabase -e "source $scriptPath" 2>&1 | ForEach-Object {
    if ($_ -match "error") {
        Write-Host $_ -ForegroundColor Red
    } else {
        Write-Host $_ -ForegroundColor Green
    }
}
$env:MYSQL_PWD = $null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRATION ABGESCHLOSSEN!              " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nächste Schritte:" -ForegroundColor Yellow
Write-Host "  1. Server neu starten: restart fw_core" -ForegroundColor White
Write-Host "  2. Einloggen -> Auto-Migration läuft beim Login" -ForegroundColor White
Write-Host "  3. Inventar öffnen -> Items sollten sichtbar sein" -ForegroundColor White
Write-Host ""
Write-Host "Bei Problemen:" -ForegroundColor Yellow
Write-Host "  - Check F8 Console für '[FW] Auto-migrating inventory'" -ForegroundColor White
Write-Host "  - Check DB: SELECT inventory_slots FROM players;" -ForegroundColor White
Write-Host ""

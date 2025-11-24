AddEventHandler('fw:playerMoneyChange', function (src, account, oldAmmount, newAmount)
    local player = FW.GetPlayer(src)
    Wait(50)
    if not player then return end
    local row = player.toRow()
    FW.DB.SavePlayer(row, function()
        print(('[FW] %s | %s: %d -> %d'):format(src, account, oldAmmount, newAmount))
    end)
end)
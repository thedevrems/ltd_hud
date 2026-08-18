GetUserWallets = function(source)
    local xPlayer = LTL and LTL.GetPlayerFromId(source)
    if not xPlayer then return end

    return {
        cash = {
            type = 'cash',
            label = 'Cash',
            text = xPlayer.getAccount('money').money,
            icon = 'fas fa-wallet',
        },
        bank = {
            type = 'bank',
            label = 'Bank',
            text = xPlayer.getAccount('bank').money,
            icon = 'fas fa-credit-card'
        },
    }
end

GetBaseRows = function(source)
    local xPlayer = LTL and LTL.GetPlayerFromId(source)
    if not xPlayer then return end

    return {
        job = {
            type = 'job',
            text = xPlayer.job.name ~= 'unemployed' and (xPlayer.job.label..' - '..xPlayer.job.grade_label) or xPlayer.job.label,
            icon = 'fas fa-briefcase',
            name = xPlayer.job.name,
            label = xPlayer.job.label,
            grade = xPlayer.job.name == 'unemployed' and '' or xPlayer.job.grade_label
        },
    }
end

while not FrameworkSelected do
    Wait(100)
end

-- Ces quatre évènements sont émis localement par ltl_core (TriggerEvent, pas
-- TriggerClientEvent) : les déclarer en net event permettrait à un client de falsifier
-- son propre solde affiché.
AddEventHandler('ltl:addAccountMoney', function(source, account, money)
    if not source or not Player(source).state['UI_UserData'] then return end

    account = account == 'money' and 'cash' or account
    if Player(source).state['UI_UserData'].wallets[account] then
        local object = Player(source).state['UI_UserData']
        object.wallets[account].text = object.wallets[account].text + money
        Player(source).state:set('UI_UserData', object, true)
    end
end)

AddEventHandler('ltl:removeAccountMoney', function(source, account, money)
    if not source or not Player(source).state['UI_UserData'] then return end

    account = account == 'money' and 'cash' or account
    if Player(source).state['UI_UserData'].wallets[account] then
        local object = Player(source).state['UI_UserData']
        object.wallets[account].text = object.wallets[account].text - money
        Player(source).state:set('UI_UserData', object, true)
    end
end)

AddEventHandler('ltl:setAccountMoney', function(source, account, money)
    if not source or not Player(source).state['UI_UserData'] then return end

    account = account == 'money' and 'cash' or account
    if Player(source).state['UI_UserData'].wallets[account] then
        local object = Player(source).state['UI_UserData']
        object.wallets[account].text = money
        Player(source).state:set('UI_UserData', object, true)
    end
end)

AddEventHandler('ltl:setJob', function(source, job, lastJob)
    if not source or not Player(source).state['UI_UserData'] then return end

    if Player(source).state['UI_UserData'].base.job then
        local object = Player(source).state['UI_UserData']
        object.base.job.text = job.name ~= 'unemployed' and (job.label..' - '..job.grade_label) or job.label
        object.base.job.label = job.label
        object.base.job.grade = job.name ~= 'unemployed' and job.grade_label or ''
        Player(source).state:set('UI_UserData', object, true)
    end
end)

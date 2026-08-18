-- Nom de compte côté ltl_core -> clé de portefeuille côté interface. La clé est
-- aussi ce que le menu pause traduit (`Translations.UI.pause_menu.<clé>`) : en
-- renommer une sans ajouter sa ligne de traduction laisse un intitulé vide
-- au-dessus du montant.
local WalletAccounts <const> = {
    ['money']       = 'cash',
    ['bank']        = 'bank',
    ['black_money'] = 'black',
}

-- `getAccount` renvoie nil pour un compte absent de Config.Accounts. Un serveur
-- qui retire l'argent sale de sa config voit alors 0 plutôt qu'une erreur au
-- premier spawn.
local function accountMoney(xPlayer, account)
    local entry = xPlayer.getAccount(account)
    return entry and entry.money or 0
end

GetUserWallets = function(source)
    local xPlayer = LTL and LTL.GetPlayerFromId(source)
    if not xPlayer then return end

    return {
        cash = {
            type = 'cash',
            label = 'Liquide',
            text = accountMoney(xPlayer, 'money'),
            icon = 'fas fa-wallet',
        },
        bank = {
            type = 'bank',
            label = 'Banque',
            text = accountMoney(xPlayer, 'bank'),
            icon = 'fas fa-credit-card'
        },
        black = {
            type = 'black',
            label = 'Argent sale',
            text = accountMoney(xPlayer, 'black_money'),
            icon = 'fas fa-money-bill-wave'
        },
    }
end

-- Le gang `none` de ltl_core est un gang comme les autres, libellé « Aucun », et
-- non une absence de valeur. La ligne est donc toujours présente : la faire
-- apparaître et disparaître au fil des affectations ferait sauter le bandeau.
BuildGangRow = function(gang)
    local labels = Translations.UI.player_info
    gang = type(gang) == 'table' and gang or {}

    local inGang = gang.name ~= nil and gang.name ~= 'none'
    local label  = inGang and gang.label or labels.no_gang
    local grade  = inGang and (gang.grade_label or '') or ''

    return {
        type  = 'gang',
        text  = (inGang and grade ~= '') and (label .. ' - ' .. grade) or label,
        icon  = 'fas fa-users',
        name  = gang.name or 'none',
        label = label,
        grade = grade,
    }
end

-- « Petite frappe » est un drapeau porté par le personnage, indépendant du gang :
-- on peut l'être sans gang, être dans un gang sans l'être, ou les deux. Les deux
-- états sont écrits en toutes lettres parce qu'une puce qui disparaît ne dit pas
-- « non », elle ne dit rien.
BuildThugRow = function(state)
    local labels = Translations.UI.player_info
    local isThug = state == true

    return {
        type  = 'thug',
        text  = ('%s : %s'):format(labels.thug, isThug and labels.yes or labels.no),
        icon  = 'fas fa-user-secret',
        label = labels.thug,
        grade = isThug and labels.yes or labels.no,
        value = isThug,
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
        gang = BuildGangRow(xPlayer.getGang()),
        thug = BuildThugRow(xPlayer.isThug()),
    }
end

while not FrameworkSelected do
    Wait(100)
end

---Relit le bandeau du joueur pour le modifier, ou nil quand il n'y en a pas
---encore un — ce qui arrive pour tout évènement reçu avant `ltl:playerLoaded`.
---@param source number
---@return table?
local function userData(source)
    if not source then return nil end
    return Player(source).state['UI_UserData']
end

-- Ces six évènements sont émis localement par ltl_core (TriggerEvent, pas
-- TriggerClientEvent) : les déclarer en net event permettrait à un client de
-- falsifier son propre solde, son gang ou son statut affichés.
AddEventHandler('ltl:addAccountMoney', function(source, account, money)
    local object = userData(source)
    if not object then return end

    local wallet = WalletAccounts[account] or account
    if object.wallets[wallet] then
        object.wallets[wallet].text = object.wallets[wallet].text + money
        Player(source).state:set('UI_UserData', object, true)
    end
end)

AddEventHandler('ltl:removeAccountMoney', function(source, account, money)
    local object = userData(source)
    if not object then return end

    local wallet = WalletAccounts[account] or account
    if object.wallets[wallet] then
        object.wallets[wallet].text = object.wallets[wallet].text - money
        Player(source).state:set('UI_UserData', object, true)
    end
end)

AddEventHandler('ltl:setAccountMoney', function(source, account, money)
    local object = userData(source)
    if not object then return end

    local wallet = WalletAccounts[account] or account
    if object.wallets[wallet] then
        object.wallets[wallet].text = money
        Player(source).state:set('UI_UserData', object, true)
    end
end)

AddEventHandler('ltl:setJob', function(source, job, lastJob)
    local object = userData(source)
    if not object or not object.base or not object.base.job then return end

    object.base.job.text = job.name ~= 'unemployed' and (job.label..' - '..job.grade_label) or job.label
    object.base.job.label = job.label
    object.base.job.grade = job.name ~= 'unemployed' and job.grade_label or ''
    Player(source).state:set('UI_UserData', object, true)
end)

AddEventHandler('ltl:setGang', function(source, gang)
    local object = userData(source)
    if not object or not object.base then return end

    object.base.gang = BuildGangRow(gang)
    Player(source).state:set('UI_UserData', object, true)
end)

AddEventHandler('ltl:setThug', function(source, state)
    local object = userData(source)
    if not object or not object.base then return end

    object.base.thug = BuildThugRow(state)
    Player(source).state:set('UI_UserData', object, true)
end)

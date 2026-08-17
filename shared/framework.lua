Dependencies = {
    { resource = 'es_extended', label = 'ESX (es_extended)' },
    { resource = 'pma-voice',   label = 'pma-voice' },
}

FrameworkSelected = false
ESX = false
DependenciesReady = false

local resourceName = GetCurrentResourceName()

local function fatalPrint(reasons)
    print('^1' .. string.rep('=', 60) .. '^7')
    print('^1[' .. resourceName .. '] DEMARRAGE ANNULE^7')
    for _, reason in ipairs(reasons) do
        print('^1  - ' .. reason .. '^7')
    end
    print('^1  Cette version fonctionne uniquement avec ESX + pma-voice.^7')
    print('^1' .. string.rep('=', 60) .. '^7')
end

local function awaitStarted(resource, timeoutMs)
    local deadline = GetGameTimer() + timeoutMs
    local state = GetResourceState(resource)
    while state ~= 'started' do
        if state == 'missing' or GetGameTimer() > deadline then return false end
        Wait(100)
        state = GetResourceState(resource)
    end
    return true
end

Citizen.CreateThread(function()
    local failures = {}

    for _, dep in ipairs(Dependencies) do
        if GetResourceState(dep.resource) == 'missing' then
            failures[#failures + 1] = dep.label .. ' est introuvable sur ce serveur'
        end
    end

    if #failures == 0 then
        for _, dep in ipairs(Dependencies) do
            if not awaitStarted(dep.resource, 60000) then
                failures[#failures + 1] = dep.label .. " n'a pas démarré (état: " .. GetResourceState(dep.resource) .. ')'
            end
        end
    end

    if #failures > 0 then
        fatalPrint(failures)

        if IsDuplicityVersion() then
            StopResource(resourceName)
        end
        return
    end

    ESX = exports['es_extended']:getSharedObject()
    FrameworkSelected = 'ESX'
    DependenciesReady = true

    debugPrint('[^2FRAMEWORK^7] ESX + pma-voice détectés, interface prête.')

    ZSX_Multicharacter = 'ZSX_Multicharacter'
    ZSX_Loading = 'ZSX_LoadingScreen'
end)

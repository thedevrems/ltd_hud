Dependencies = {
    { resource = 'ltl_core',  label = 'LTL Framework (ltl_core)' },
    { resource = 'pma-voice', label = 'pma-voice' },
}

FrameworkSelected = false
---@type any # objet partagé de ltl_core, résolu à la fin du thread de démarrage
LTL = false
DependenciesReady = false

local resourceName = GetCurrentResourceName()

local function fatalPrint(reasons)
    print('^1' .. string.rep('=', 60) .. '^7')
    print('^1[' .. resourceName .. '] DEMARRAGE ANNULE^7')
    for _, reason in ipairs(reasons) do
        print('^1  - ' .. reason .. '^7')
    end
    print('^1  Cette version fonctionne uniquement avec ltl_core + pma-voice.^7')
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

CreateThread(function()
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

    -- ltl_core expose getSharedObject côté client comme côté serveur (shared/main.lua),
    -- donc ce même fichier partagé suffit aux deux runtimes.
    LTL = exports['ltl_core']:getSharedObject()
    FrameworkSelected = 'LTL'
    DependenciesReady = true

    debugPrint('[^2FRAMEWORK^7] ltl_core + pma-voice détectés, interface prête.')

    ZSX_Multicharacter = 'ZSX_Multicharacter'
    ZSX_Loading = 'ZSX_LoadingScreen'
end)

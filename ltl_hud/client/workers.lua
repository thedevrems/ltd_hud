Workers = {}
Workers.PauseMenu = {}

Workers.PauseMenu.PreventOpen = function()
    -- Filet générique placé avant la liste d'exports ci-dessous : celle-ci ne
    -- couvre que les ressources connues, alors qu'un focus NUI trahit n'importe
    -- quelle interface déjà ouverte. On refuse alors en silence, sans notif.
    if IsNuiFocused() then return true end

    local isOxInventoryOpen = LocalPlayer.state.invOpen
    local isSettingsOpen = LocalPlayer.state['UI_InSettings']
    local isAiming = IsAimCamActive() == 1
    if GetResourceState('ox_lib') == 'started' then
        lib = exports['ox_lib']
    end
    if GetResourceState('ZSX_Garages') == 'started' then
        ZSXGarages = exports['ZSX_Garages']
    end

    if GetResourceState('qs-smartphone-pro') == 'started' then
        qsSmartphone = exports['qs-smartphone-pro']
    end

    if GetResourceState('qs-housing') == 'started' then
        qsHousing = exports['qs-housing']
    end

    if GetResourceState('yseries') == 'started' then
        ySeriesPhone = exports['yseries']
    end

    if GetResourceState('vms_anims') == 'started' then
        vmsAnims = exports['vms_anims']
    end
    if GetResourceState('origen_inventory') == 'started' then
        origenInventory = exports['origen_inventory']
    end
    if GetResourceState('lb-phone') == 'started' then
        lbPhone = exports["lb-phone"]
    end

    local isContextMenuOpen = lib and lib.getOpenMenu() or false
    local isQSPhoneOpen = qsSmartphone and qsSmartphone:InPhone() or false
    local isLBPhoneOpen = lbPhone and lbPhone:IsOpen() or false
    local isYSeriesPhoneOpen = ySeriesPhone and ySeriesPhone:IsOpen() or false
    local isVmsAnimOpen = vmsAnims and vmsAnims:isMenuOpened() or false
    local isOrigenInventoryOpen = origenInventory and origenInventory:IsInventoryOpen() or false
    local isInGarageCreator = ZSXGarages and ZSXGarages:IsInCreator() or false
    return MapIsOpen or isAiming or isOxInventoryOpen or isSettingsOpen or isContextMenuOpen or isQSPhoneOpen or isYSeriesPhoneOpen or isLBPhoneOpen or isVmsAnimOpen or isOrigenInventoryOpen or isInGarageCreator
end

AddStateBagChangeHandler('invOpen', nil, function(bag, key, val)
    if bag ~= ('player:%s'):format(GetPlayerServerId(PlayerId())) then return end
    NUI.SetUIVisible(not val)
end)

Workers.MainMenu = {}

Workers.MainMenu.InitializeAfterConfigurationEnd = function()
    DoScreenFadeIn(1000)
end

Workers.Seatbelts = {}

Workers.Seatbelts.OnCrash = function(vehicleEntity, playerEntity)

end

Workers.Minimap = {}

Workers.Minimap.BeforePrepare = function()

end

Workers.Minimap.AfterPrepare = function()

end

Workers.Minimap.OnVisibilityStateChange = function(state)
    if state then

        SetRadarZoom(1100)
    else

    end
end

Workers.Chat = {}

Workers.Chat.PreventInput = function()

    local shouldBePrevented = false

    return shouldBePrevented
end

Threads.GameplayCam = {}
Threads.GameplayCam.Id = -1

function Threads.GameplayCam.Init()
    Citizen.CreateThread(function()
        while true do
            if not DoesCamExist(Threads.GameplayCam.Id) then
                FindGameplayCameraID()
            end
            Wait(5000)
        end
    end)
end

function FindGameplayCameraID()
    local gameplayCamCoord = GetGameplayCamCoord()
    local storedCoord      = GetCamCoord(Threads.GameplayCam.Id)

    if storedCoord == gameplayCamCoord then return end
    if GetCamCoord(Threads.GameplayCam.Id) == vector3(0, 0, 0) then return end

    for id = 1, 10000 do
        if DoesCamExist(id) and GetCamCoord(id) == gameplayCamCoord then
            Threads.GameplayCam.Id = id
            debugPrint("[^4CAMERA^7] Restored Gameplay Camera ID.")
            break
        end
    end
end

function GetGameplayCameraID()
    return Threads.GameplayCam.Id
end

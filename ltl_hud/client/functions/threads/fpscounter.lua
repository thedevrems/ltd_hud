Threads.FPSCount = {}

Threads.FPSCount.Data = {
    last               = GetFrameCount(),
    current            = GetFrameCount(),
    fps                = 0,
    lowestRecordedFPS  = 99999,
    startTime          = GetGameTimer(),
    notificationSerial = false,
}

CreateThread(function()
    LocalPlayer.state:set("LowFPSDetected", false)
end)

function Threads.FPSCount.Init()
    if not Config.UseAutomaticOptimizationCheck then return end
    debugPrint("[^6FPS COUNTER^7] Started calculating FPS [/]")

    CreateThread(function()
        local data      = Threads.FPSCount.Data
        data.startTime  = GetGameTimer()
        local warmupEnd = data.startTime + 5000

        while "current" do
            local now = GetGameTimer()
            data.current = GetFrameCount()

            local fps = (data.current - data.last - 1) * 2
            data.last = data.current

            if fps < data.lowestRecordedFPS then
                data.lowestRecordedFPS = fps
            end
            data.fps = fps

            if now > warmupEnd then
                if fps < 60 and not LocalPlayer.state.LowFPSDetected then
                    LocalPlayer.state:set("LowFPSDetected", true)
                elseif fps > 60 and LocalPlayer.state.LowFPSDetected then
                    LocalPlayer.state:set("LowFPSDetected", false)
                end
            end

            Wait(500)
        end
    end)
end

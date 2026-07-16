param(
  [Parameter(Mandatory = $true)][string]$Executable,
  [ValidateSet("Hourly", "Daily")][string]$Frequency = "Daily"
)
$ErrorActionPreference = "Stop"
$resolved = (Resolve-Path -LiteralPath $Executable).Path
$action = New-ScheduledTaskAction -Execute $resolved -Argument "--run-scheduled-workflows"
$trigger = if ($Frequency -eq "Hourly") {
  New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval (New-TimeSpan -Hours 1)
} else {
  New-ScheduledTaskTrigger -Daily -At "09:00"
}
Register-ScheduledTask -TaskName "OpenJobAgent" -Description "Run local opportunity, Gmail and reminder workflows" -Action $action -Trigger $trigger -RunLevel Limited

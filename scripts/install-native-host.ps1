param(
  [Parameter(Mandatory = $true)][string]$ExtensionId,
  [string]$HostExe = (Join-Path $PSScriptRoot "..\target\release\open-job-agent-native-host.exe")
)
$ErrorActionPreference = "Stop"
$hostPath = (Resolve-Path -LiteralPath $HostExe).Path
$manifestDir = Join-Path $env:LOCALAPPDATA "OpenJobAgent\native-host"
New-Item -ItemType Directory -Force -Path $manifestDir | Out-Null
$manifestPath = Join-Path $manifestDir "dev.openjobagent.native.json"
$manifest = @{
  name = "dev.openjobagent.native"
  description = "OpenJobAgent authenticated native host"
  path = $hostPath
  type = "stdio"
  allowed_origins = @("chrome-extension://$ExtensionId/")
} | ConvertTo-Json -Depth 3
Set-Content -LiteralPath $manifestPath -Value $manifest -Encoding UTF8
$registries = @(
  "HKCU:\Software\Google\Chrome\NativeMessagingHosts\dev.openjobagent.native",
  "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\dev.openjobagent.native"
)
foreach ($registry in $registries) {
  New-Item -Force -Path $registry | Out-Null
  Set-Item -LiteralPath $registry -Value $manifestPath
}
Write-Host "Registered native host for Chrome and Edge: $manifestPath"

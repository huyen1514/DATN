param(
  [string]$ApiBase = "http://localhost:5135/api"
)

$ErrorActionPreference = "Stop"

$jsonPath = Join-Path $PSScriptRoot "..\\SeedData\\jlpt-n5-2018.json"
if (!(Test-Path $jsonPath)) {
  throw "Không tìm thấy file JSON: $jsonPath"
}

$body = Get-Content -Raw -Encoding UTF8 $jsonPath

Write-Host "Importing JLPT N5 2018 from $jsonPath"
$res = Invoke-RestMethod -Method Post -Uri "$ApiBase/exams/import" -ContentType "application/json; charset=utf-8" -Body $body

Write-Host "Done."
$res | ConvertTo-Json -Depth 10


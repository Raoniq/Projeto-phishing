$headers = @{
    "Authorization" = "Bearer sbp_64ddb7cc36273caa068dfc7be6c23fcdf84fc2bd"
    "Content-Type" = "application/json"
}
$body = '{"query": "SELECT id, email FROM auth.users LIMIT 5;"}'
try {
    $response = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/dqalvguekknmwrrkeibx/database/query" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "Success:"
    $response | ConvertTo-Json -Depth 10
} catch {
    $err = $_.Exception.Response
    $stream = $err.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $statusCode = $err.StatusCode
    $statusDescription = $err.StatusDescription
    $bodyResponse = $reader.ReadToEnd()
    Write-Host "Status: $statusCode $statusDescription"
    Write-Host "Body: $bodyResponse"
}
$headers = @{
    "Authorization" = "Bearer sbp_64ddb7cc36273caa068dfc7be6c23fcdf84fc2bd"
    "Content-Type" = "application/json"
}
$body = '{"query": "SELECT id, email FROM auth.users LIMIT 5;"}'
$response = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/dqalvguekknmwrrkeibx/database/query" -Method Post -Headers $headers -Body $body
$response | ConvertTo-Json
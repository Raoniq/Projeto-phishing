$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxYWx2Z3Vla2tubXdycmtlaWJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU0ODE4NiwiZXhwIjoyMDkyMTI0MTg2fQ._H3JPCTJqyzvTm0uK5DyyRlFMfwYiL0a0vRJLJVJ0b8"
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxYWx2Z3Vla2tubXdycmtlaWJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU0ODE4NiwiZXhwIjoyMDkyMTI0MTg2fQ._H3JPCTJqyzvTm0uK5DyyRlFMfwYiL0a0vRJLJVJ0b8"
}
$response = Invoke-RestMethod -Uri "https://dqalvguekknmwrrkeibx.supabase.co/auth/v1/users" -Method Get -Headers $headers
$response | ConvertTo-Json -Depth 10
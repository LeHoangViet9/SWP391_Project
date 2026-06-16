try {
    $response = Invoke-WebRequest -Uri "http://localhost:9999/api/v1/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"admin","password":"Admin@123"}' -ErrorAction Stop
    Write-Host "Success! Response: $($response.Content)"
} catch {
    Write-Host "Error status code: $($_.Exception.Response.StatusCode)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Host "Response body: $body"
}

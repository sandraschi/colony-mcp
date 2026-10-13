# Per-repo fleet start config for colony-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'colony-mcp'
    BackendPort  = 10970
    FrontendPort = 10971
    HealthPath   = '/api/health'
    WebRoot      = 'web_sota'
    Backend = @{
        Kind          = 'uvicorn'
        UvicornTarget = 'colony_mcp.app:app'
        SyncExtras    = @('dev')
        SyncOnStart  = $true
        Env           = @{ WEB_PORT = '10970' }
    }
    Frontend = @{
        Kind           = 'vite-npm'
        PackageManager = 'npm'
        PortEnvVar     = 'VITE_PORT'
        ApiTargetEnv   = 'VITE_API_TARGET'
    }
}

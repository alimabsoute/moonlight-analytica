@echo off
echo Applying standardized logo fixes to all articles...

set "articles=amazon-shadow-workforce-purge-10000-contractors.html big-tech-50m-lobbying-california-ai-bill.html iphone-17-ai-demo-failure-analysis.html meta-google-apple-twitter-killers-march-2026.html nvidia-blackwell-chips-sold-out-2027.html vision-pro-2-ditching-500-feature-wanted.html"

for %%f in (%articles%) do (
    echo Fixing %%f...
    
    REM Fix company-logo-section
    powershell -Command "(Get-Content '%%f') -replace '        \.company-logo-section \{[^}]*\}', '        .company-logo-section {`n            display: flex;`n            justify-content: center;`n            align-items: center;`n            margin: 2.4rem 0;`n            padding: 1.6rem;`n            background: #fafafa;`n            border-radius: 8px;`n        }' | Set-Content '%%f'"
    
    REM Fix company-logo-image  
    powershell -Command "(Get-Content '%%f') -replace '        \.company-logo-image \{[^}]*\}', '        .company-logo-image {`n            width: 280px;`n            height: auto;`n            max-width: 350px;`n            min-width: 245px;`n            object-fit: contain;`n            filter: `n                drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))`n                saturate(1.1)`n                contrast(1.02);`n            transition: all 0.3s ease;`n        }' | Set-Content '%%f'"
)

echo All articles fixed!
pause
# ==============================================================================
# ShareCLIP - Multi-Platform Distribution & Promotion Status Dashboard
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " 🚀 ShareCLIP Global Promotion & Distribution Status Dashboard" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Official Core Repositories & Store Channels
Write-Host "[1/4] Core Ecosystem & Official Channels:" -ForegroundColor Yellow

$coreChannels = @(
    @{
        Platform = "Microsoft Store"
        Url = "https://apps.microsoft.com/detail/XP8JZTVS6KRX72"
        Status = "[LIVE / Published]"
        Note = "Product ID: XP8JZTVS6KRX72 (Available via Store & Winget msstore)"
        Color = "Green"
    },
    @{
        Platform = "AlternativeTo.net"
        Url = "https://alternativeto.net/software/shareclip/about/"
        Status = "[LIVE / Listed]"
        Note = "Listed as Open Source AirDrop & Google Photos alternative"
        Color = "Green"
    },
    @{
        Platform = "GitHub Discussions"
        Url = "https://github.com/NovaMindLab/AIShare-Grabber/discussions"
        Status = "[LIVE / Active]"
        Note = "Community forum enabled with official Welcome discussion #1"
        Color = "Green"
    },
    @{
        Platform = "WinGet Official PR"
        Url = "https://github.com/microsoft/winget-pkgs/pull/451411"
        Status = "[CLA SIGNED / Awaiting Moderator Merge]"
        Note = "microsoft/winget-pkgs PR #451411 (Validation passed, CLA signed, awaiting moderator review)"
        Color = "Green"
    }
)

foreach ($c in $coreChannels) {
    Write-Host "  $($c.Status) $($c.Platform)" -ForegroundColor $c.Color
    Write-Host "    URL: $($c.Url)" -ForegroundColor Gray
    Write-Host "    Note: $($c.Note)" -ForegroundColor DarkGray
}

Write-Host ""

# 2. Third-Party Download Portals Check
Write-Host "[2/4] Third-Party Software Portals Audit (Live HTTP & Content Check):" -ForegroundColor Yellow

$targetEndpoints = @(
    @{
        Platform = "Uptodown (Android)"
        Url = "https://shareclip.en.uptodown.com/android"
    },
    @{
        Platform = "Uptodown (Windows)"
        Url = "https://shareclip.en.uptodown.com/windows"
    },
    @{
        Platform = "Uptodown (Mac)"
        Url = "https://shareclip.en.uptodown.com/mac"
    },
    @{
        Platform = "FileHorse (Windows)"
        Url = "https://www.filehorse.com/download-shareclip/"
    },
    @{
        Platform = "FileHorse (Mac)"
        Url = "https://mac.filehorse.com/download-shareclip/"
    },
    @{
        Platform = "MajorGeeks"
        Url = "https://www.majorgeeks.com/files/details/shareclip.html"
    },
    @{
        Platform = "Softonic"
        Url = "https://shareclip.en.softonic.com/"
    },
    @{
        Platform = "FileHippo"
        Url = "https://filehippo.com/download_shareclip/"
    }
)

foreach ($ep in $targetEndpoints) {
    try {
        $resp = Invoke-WebRequest -Uri $ep.Url -Method Get -TimeoutSec 6 -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -ErrorAction Stop
        $content = $resp.Content
        $titleMatch = [regex]::Match($content, "<title>(.*?)</title>", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        $title = if ($titleMatch.Success) { $titleMatch.Groups[1].Value } else { "" }

        if ($content -match "404" -or $content -match "Not Found" -or $title -match "Error" -or $title -match "Download MajorGeeks") {
            Write-Host "  [Pending / Not Yet Listed] $($ep.Platform)" -ForegroundColor DarkGray
        } elseif ($content -match "ShareCLIP" -or $title -match "ShareCLIP") {
            Write-Host "  [LIVE / Published] $($ep.Platform): $($ep.Url)" -ForegroundColor Green
        } else {
            Write-Host "  [Pending / Under Review] $($ep.Platform)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  [Pending / Unlisted] $($ep.Platform)" -ForegroundColor DarkGray
    }
}

Write-Host ""

# 3. Community Marketing Kit Availability
Write-Host "[3/4] Ready-to-Post Community Marketing Kits:" -ForegroundColor Yellow
$kits = @(
    @{ Name = "V2EX (分享创造)"; File = "marketing/v2ex_release_post.md"; Priority = "P0 - Ready" },
    @{ Name = "Reddit (r/selfhosted, r/privacy)"; File = "marketing/reddit_showcase_posts.md"; Priority = "P0 - Ready" },
    @{ Name = "Hacker News (Show HN)"; File = "marketing/hacker_news_show_hn.md"; Priority = "P0 - Ready" },
    @{ Name = "Product Hunt Launch Package"; File = "marketing/product_hunt_launch.md"; Priority = "P1 - Ready" },
    @{ Name = "IzzyOnDroid (F-Droid Source)"; File = "marketing/izzyondroid_submission.md"; Priority = "P0 - Ready" },
    @{ Name = "Homebrew Cask PR Script"; File = "marketing/homebrew_cask_submission.md"; Priority = "P1 - Ready" }
)

foreach ($k in $kits) {
    $exists = Test-Path $k.File
    $statusText = if ($exists) { "Ready to Submit" } else { "Missing" }
    Write-Host "  * $($k.Name): $statusText ($($k.Priority))" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Dashboard check completed." -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

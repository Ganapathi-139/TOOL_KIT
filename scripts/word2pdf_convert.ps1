param(
    [Parameter(Mandatory=$true)][string]$InputPath,
    [Parameter(Mandatory=$true)][string]$OutputPath
)

$ErrorActionPreference = "Stop"

try {
    $fullInput  = (Resolve-Path $InputPath).Path
    $fullOutput = [System.IO.Path]::GetFullPath($OutputPath)

    $outDir = [System.IO.Path]::GetDirectoryName($fullOutput)
    if (-not (Test-Path $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }

    $word = New-Object -ComObject Word.Application
    $word.Visible = $false

    # Open(FileName, ConfirmConversions, ReadOnly, AddToRecentFiles, PasswordDocument, PasswordTemplate, Revert, WritePasswordDocument, WritePasswordTemplate, Format)
    $doc = $word.Documents.Open($fullInput, $false, $true, $false)

    # 17 = wdFormatPDF
    $doc.SaveAs([ref]$fullOutput, [ref]17)
    $doc.Close($false)
    $word.Quit()

    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc)  | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()

    if (Test-Path $fullOutput) {
        Write-Output "OK: Converted successfully"
        exit 0
    } else {
        Write-Error "Output PDF was not created"
        exit 1
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1
}

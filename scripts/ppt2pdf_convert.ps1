param(
    [Parameter(Mandatory=$true)][string]$InputPath,
    [Parameter(Mandatory=$true)][string]$OutputPath
)

$ErrorActionPreference = "Stop"

try {
    $fullInput = (Resolve-Path $InputPath).Path
    $fullOutput = [System.IO.Path]::GetFullPath($OutputPath)

    $outDir = [System.IO.Path]::GetDirectoryName($fullOutput)
    if (-not (Test-Path $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }

    $ppt = New-Object -ComObject PowerPoint.Application
    # Open(FileName, ReadOnly, Untitled, WithWindow)
    $presentation = $ppt.Presentations.Open($fullInput, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    
    # 32 = ppSaveAsPDF
    $presentation.SaveAs($fullOutput, 32)
    $presentation.Close()
    $ppt.Quit()

    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
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

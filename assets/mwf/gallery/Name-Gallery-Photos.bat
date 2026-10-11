@echo off
title FLM TV - Name Gallery Photos
echo ======================================================
echo  FLM TV - Gallery Photo Namer
echo  Renames every picture in this folder to
echo  page1, page2, page3 ... with no gaps.
echo ======================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$f='%~f0'; $code=(Get-Content -LiteralPath $f -Raw) -split ('#PS'+'-START#'); iex $code[1]"
echo.
pause
exit /b

#PS-START#
$dir  = Split-Path -Parent $f
$exts = '.jpg', '.jpeg', '.png', '.webp', '.gif'
$files = @(Get-ChildItem -LiteralPath $dir -File | Where-Object { $exts -contains $_.Extension.ToLower() })
if ($files.Count -eq 0) { Write-Host " No pictures found in $dir"; return }

# Photos already named page1, page 1 or page (1) keep their order; new photos go after them (oldest first).
$items = foreach ($x in $files) {
    $num = [int]::MaxValue
    if ($x.BaseName -match '^\s*page\s*\(?\s*(\d+)\s*\)?\s*$') { $num = [int]$Matches[1] }
    [pscustomobject]@{ File = $x; Num = $num; Time = $x.LastWriteTime; Name = $x.Name }
}
$sorted = @($items | Sort-Object Num, Time, Name)

# Step 1: give everything a temporary name (so no two files ever clash)
$temp = @()
$i = 0
foreach ($it in $sorted) {
    $i++
    $ext = $it.File.Extension.ToLower()
    if ($ext -eq '.jpeg') { $ext = '.jpg' }
    $t = "__flm_tmp_$i$ext"
    Rename-Item -LiteralPath $it.File.FullName -NewName $t
    $temp += ,@($t, $ext)
}

# Step 2: final names, page1, page2, ...
$n = 0
foreach ($t in $temp) {
    $n++
    Rename-Item -LiteralPath (Join-Path $dir $t[0]) -NewName ("page$n" + $t[1])
}
Write-Host " Done! $n pictures are now named page1 to page$n."
Write-Host " Next: open GitHub Desktop, Commit, then Push."

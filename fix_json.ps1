$jsonContent = Get-Content "d:\DATN\JapaneseLearning\original_exam.json" -Raw | ConvertFrom-Json -AsHashtable

foreach ($section in $jsonContent.sections) {
    foreach ($mondai in $section.mondai_list) {
        foreach ($question in $mondai.questions) {
            # Fix options
            if ($question.ContainsKey("options") -and $question.options.Count -gt 0 -and $question.options[0] -is [string]) {
                $newOptions = @()
                for ($i = 0; $i -lt $question.options.Count; $i++) {
                    $optObj = @{
                        "option_id" = $i + 1
                        "text" = $question.options[$i]
                    }
                    $newOptions += $optObj
                }
                $question.options = $newOptions
            }
            
            # Fix reading_passage
            if ($question.ContainsKey("reading_passage")) {
                $passage = $question.reading_passage
                $question.Remove("reading_passage")
                $question.content = $passage + "`n`n" + $question.content
            }
        }
    }
}

$jsonContent | ConvertTo-Json -Depth 10 | Set-Content "d:\DATN\JapaneseLearning\fixed_exam.json" -Encoding UTF8
Write-Host "FIXED"

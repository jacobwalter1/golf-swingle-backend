# Load environment variables from .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$name" -Value $value
    }
}

#Create videos with masked faces and upload to S3
.\venv\Scripts\python.exe .\generateMaskedVideos.py   

# 1. Upload new videos to S3
$bucketName = $env:S3_BUCKET
aws s3 sync videos s3://$bucketName/videos/

# 2. Run sync script
Set-Location scripts
npm run sync
Set-Location ..

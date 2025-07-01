#!/bin/bash

echo "🚀 백엔드 배포 시작..."

# 1. Git push
git add .
git commit -m "feat: 백엔드 업데이트"
git push origin main

# 2. EC2에 배포
ssh -i ~/Downloads/mooda-key-pair.pem ec2-user@52.221.217.142 << 'EOF'
  cd ~/mooda_fe
  git pull origin main
  cd server
  npm install
  pm2 restart mooda-backend
  echo "✅ 백엔드 배포 완료!"
EOF

echo "🎉 배포 완료!" 
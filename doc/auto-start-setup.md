# EC2 서버 자동 시작 설정 가이드

## 🚀 서버 자동 시작 설정

현재 배포된 상태에서는 EC2 인스턴스를 재시작할 때마다 수동으로 서버를 시작해야 합니다.  
다음 방법으로 자동 시작을 설정할 수 있습니다:

### 방법 1: PM2 사용 (권장)

```bash
# 1. 서버 접속
ssh -i ~/.ssh/mooda-key-pair.pem ec2-user@15.165.246.12

# 2. PM2 설치
npm install -g pm2

# 3. 서버 디렉토리로 이동
cd mooda_fe/server

# 4. PM2로 서버 시작
pm2 start npm --name "mooda-server" -- start

# 5. 부팅 시 자동 시작 설정
pm2 startup
pm2 save
```

### 방법 2: systemd 서비스 사용

```bash
# 1. 서비스 파일 생성
sudo nano /etc/systemd/system/mooda-server.service
```

```ini
[Unit]
Description=Mooda Server
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/mooda_fe/server
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# 2. 서비스 활성화
sudo systemctl enable mooda-server
sudo systemctl start mooda-server

# 3. 상태 확인
sudo systemctl status mooda-server
```

## 📊 현재 상태별 대처 방법

### Case 1: EC2 인스턴스가 중지된 경우
1. AWS 콘솔에서 인스턴스 시작
2. 서버 수동 시작 필요

### Case 2: 인스턴스는 실행 중이지만 서버만 중지된 경우
```bash
# 서버 접속 후 수동 시작
ssh -i ~/.ssh/mooda-key-pair.pem ec2-user@15.165.246.12
cd mooda_fe/server
nohup npm start > server.log 2>&1 &
```

### Case 3: 자동 시작이 설정된 경우
- 인스턴스 재시작 시 자동으로 서버 시작됨
- 별도 작업 불필요

## 🔧 서버 상태 확인 명령어

```bash
# 외부에서 서버 상태 확인
curl http://15.165.246.12:3000/

# 서버 내부에서 프로세스 확인
ps aux | grep node

# PM2 사용 시 상태 확인
pm2 status

# systemd 사용 시 상태 확인
sudo systemctl status mooda-server
```

## ⚠️ 주의사항

1. **현재는 수동 시작 필요**: 자동 시작 설정 전까지는 인스턴스 재시작 시마다 서버 수동 시작 필요
2. **인스턴스 비용**: EC2 인스턴스는 실행 중일 때만 과금됨
3. **정기적인 모니터링**: 서버 상태를 주기적으로 확인하는 것이 좋음

## 🎯 권장사항

**PM2 사용을 권장**합니다:
- 프로세스 관리가 쉬움
- 자동 재시작 기능
- 로그 관리 편리
- 무중단 배포 가능 
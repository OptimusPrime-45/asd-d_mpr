#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# AWS EC2 Automated Provisioning Script for FleetOps
# Deploys Docker, Docker Compose, Caddy Reverse Proxy, and FleetOps
# ==============================================================================

REGION="${AWS_REGION:-us-east-1}"
INSTANCE_TYPE="${EC2_INSTANCE_TYPE:-t3.medium}"
KEY_NAME="${1:-fleetops-key}"
SECURITY_GROUP_NAME="fleetops-production-sg"

echo "=========================================================="
echo "🚀 FleetOps EC2 Provisioner"
echo "Region:        $REGION"
echo "Instance Type: $INSTANCE_TYPE"
echo "Key Pair:      $KEY_NAME"
echo "=========================================================="

# 1. Verify AWS Identity
echo "🔍 Checking AWS authentication..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ Authenticated as AWS Account: $ACCOUNT_ID"

# 2. Check or Create Key Pair
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "🔑 Key pair '$KEY_NAME' does not exist in AWS. Creating it..."
  aws ec2 create-key-pair --key-name "$KEY_NAME" --query 'KeyMaterial' --output text --region "$REGION" > "${KEY_NAME}.pem"
  chmod 400 "${KEY_NAME}.pem"
  echo "✅ Private key saved to: $(pwd)/${KEY_NAME}.pem"
else
  echo "✅ Key pair '$KEY_NAME' exists in AWS."
fi

# 3. Find default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region "$REGION")
if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
  VPC_ID=$(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text --region "$REGION")
fi
echo "✅ Target VPC: $VPC_ID"

# 4. Check or Create Security Group
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" "Name=vpc-id,Values=$VPC_ID" --query "SecurityGroups[0].GroupId" --output text --region "$REGION")
if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
  echo "🛡️ Creating Security Group '$SECURITY_GROUP_NAME'..."
  SG_ID=$(aws ec2 create-security-group --group-name "$SECURITY_GROUP_NAME" --description "Security group for FleetOps production" --vpc-id "$VPC_ID" --query "GroupId" --output text --region "$REGION")
  
  # Allow SSH (22), HTTP (80), HTTPS (443), Grafana (3002)
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0 --region "$REGION"
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$REGION"
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$REGION"
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 3002 --cidr 0.0.0.0/0 --region "$REGION"
  echo "✅ Security Group configured with ports 22, 80, 443, 3002: $SG_ID"
else
  echo "✅ Security Group exists: $SG_ID"
fi

# 5. Resolve Ubuntu 24.04 LTS AMI
echo "🔍 Resolving latest Ubuntu 24.04 AMI..."
AMI_ID=$(aws ssm get-parameter --name "/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id" --query "Parameter.Value" --output text --region "$REGION")
echo "✅ AMI ID: $AMI_ID"

# 6. Prepare Cloud-Init User Data Script
USER_DATA=$(cat << 'EOF' | base64 -w 0
#!/usr/bin/env bash
set -euo pipefail

# Update packages
apt-get update -y
apt-get install -y ca-certificates curl gnupg git

# Install Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable docker for ubuntu user
usermod -aG docker ubuntu

# Clone FleetOps repository
cd /home/ubuntu
git clone https://github.com/Thundercloud12/asd-d_mpr.git odoo-hackathon
chown -R ubuntu:ubuntu /home/ubuntu/odoo-hackathon

# Launch application with production compose
cd /home/ubuntu/odoo-hackathon
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations and seed
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec -T backend npx tsx prisma/seed.ts || true

echo "FleetOps production stack initialized successfully!"
EOF
)

# 7. Launch EC2 Instance
echo "🚀 Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --user-data "$USER_DATA" \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=fleetops-production}]" \
  --query "Instances[0].InstanceId" \
  --output text \
  --region "$REGION")

echo "⏳ Waiting for instance $INSTANCE_ID to initialize..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"

PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --query "Reservations[0].Instances[0].PublicIpAddress" --output text --region "$REGION")

echo "=========================================================="
echo "🎉 EC2 Instance is Running!"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP:   $PUBLIC_IP"
echo ""
echo "Access URLs (allow 1-2 minutes for Docker initialization):"
echo "  Frontend Web UI:   http://$PUBLIC_IP"
echo "  Backend API:       http://$PUBLIC_IP/api/v1"
echo "  Backend Health:    http://$PUBLIC_IP/health"
echo "  Swagger Docs:      http://$PUBLIC_IP/docs"
echo "  Grafana Dashboard: http://$PUBLIC_IP:3002 (admin / admin)"
echo ""
echo "To enable GitHub Actions Auto-Deployment on push to 'main':"
echo "  Add these 2 Secrets to your GitHub Repository:"
echo "    1. EC2_HOST:    $PUBLIC_IP"
echo "    2. EC2_SSH_KEY: (Contents of $(pwd)/${KEY_NAME}.pem)"
echo "=========================================================="

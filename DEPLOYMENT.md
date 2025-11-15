# BrigadníkOS - Deployment Guide

## 🚀 Production Deployment

### Option 1: Kubernetes (Recommended for Production)

Create the following manifests in `docker/k8s/`:

#### 1. Namespace
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: brigadnikos
```

#### 2. Secrets
```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: brigadnikos-secrets
  namespace: brigadnikos
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:password@postgres:5432/brigadnikos"
  JWT_SECRET: "your-super-secret-jwt-key-change-in-production"
  JWT_REFRESH_SECRET: "your-super-secret-refresh-key"
  ENCRYPTION_KEY: "32-character-aes-encryption-key"
  SENDGRID_API_KEY: "your-sendgrid-api-key"
  TWILIO_ACCOUNT_SID: "your-twilio-sid"
  TWILIO_AUTH_TOKEN: "your-twilio-token"
  AWS_ACCESS_KEY_ID: "your-aws-key"
  AWS_SECRET_ACCESS_KEY: "your-aws-secret"
```

#### 3. PostgreSQL StatefulSet
```yaml
# postgres-statefulset.yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: brigadnikos
spec:
  ports:
  - port: 5432
  clusterIP: None
  selector:
    app: postgres
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: brigadnikos
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: brigadnikos
        - name: POSTGRES_USER
          value: brigadnikos
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: brigadnikos-secrets
              key: POSTGRES_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 20Gi
```

#### 4. Redis Deployment
```yaml
# redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: brigadnikos
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: brigadnikos
spec:
  ports:
  - port: 6379
  selector:
    app: redis
```

#### 5. Backend Deployment
```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brigadnikos-backend
  namespace: brigadnikos
spec:
  replicas: 3
  selector:
    matchLabels:
      app: brigadnikos-backend
  template:
    metadata:
      labels:
        app: brigadnikos-backend
    spec:
      containers:
      - name: backend
        image: your-registry/brigadnikos-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: brigadnikos-secrets
              key: DATABASE_URL
        - name: REDIS_URL
          value: "redis://redis:6379"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: brigadnikos-secrets
              key: JWT_SECRET
        - name: JWT_REFRESH_SECRET
          valueFrom:
            secretKeyRef:
              name: brigadnikos-secrets
              key: JWT_REFRESH_SECRET
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: brigadnikos-secrets
              key: ENCRYPTION_KEY
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: brigadnikos-backend
  namespace: brigadnikos
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: brigadnikos-backend
```

#### 6. Ingress (HTTPS)
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: brigadnikos-ingress
  namespace: brigadnikos
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.brigadnikos.cz
    secretName: brigadnikos-tls
  rules:
  - host: api.brigadnikos.cz
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: brigadnikos-backend
            port:
              number: 80
```

### Deploy to Kubernetes:

```bash
# Build and push Docker image
docker build -t your-registry/brigadnikos-backend:latest ./backend
docker push your-registry/brigadnikos-backend:latest

# Apply Kubernetes manifests
kubectl apply -f docker/k8s/namespace.yaml
kubectl apply -f docker/k8s/secrets.yaml
kubectl apply -f docker/k8s/postgres-statefulset.yaml
kubectl apply -f docker/k8s/redis-deployment.yaml
kubectl apply -f docker/k8s/backend-deployment.yaml
kubectl apply -f docker/k8s/ingress.yaml

# Run database migrations
kubectl exec -it -n brigadnikos deployment/brigadnikos-backend -- npm run migration:run

# Check status
kubectl get pods -n brigadnikos
kubectl get services -n brigadnikos
kubectl get ingress -n brigadnikos
```

---

## Option 2: AWS ECS/Fargate

### 1. Create ECR Repository
```bash
aws ecr create-repository --repository-name brigadnikos-backend

# Build and push
docker build -t brigadnikos-backend ./backend
docker tag brigadnikos-backend:latest 123456789.dkr.ecr.eu-central-1.amazonaws.com/brigadnikos-backend:latest
docker push 123456789.dkr.ecr.eu-central-1.amazonaws.com/brigadnikos-backend:latest
```

### 2. Create RDS PostgreSQL
```bash
aws rds create-db-instance \
  --db-instance-identifier brigadnikos-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username brigadnikos \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --publicly-accessible false
```

### 3. Create ElastiCache Redis
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id brigadnikos-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

### 4. Create ECS Task Definition (task-definition.json)
```json
{
  "family": "brigadnikos-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "brigadnikos-backend",
      "image": "123456789.dkr.ecr.eu-central-1.amazonaws.com/brigadnikos-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:eu-central-1:123456789:secret:brigadnikos/db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:eu-central-1:123456789:secret:brigadnikos/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/brigadnikos-backend",
          "awslogs-region": "eu-central-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 5. Create ECS Service
```bash
aws ecs create-service \
  --cluster brigadnikos-cluster \
  --service-name brigadnikos-backend \
  --task-definition brigadnikos-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=brigadnikos-backend,containerPort=3000 \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-zzz],assignPublicIp=ENABLED}"
```

---

## Option 3: Heroku (Quickest for MVP)

```bash
# Login to Heroku
heroku login

# Create app
heroku create brigadnikos-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set ENCRYPTION_KEY=your-key

# Deploy
cd backend
git push heroku main

# Run migrations
heroku run npm run migration:run

# Scale
heroku ps:scale web=2:standard-2x
```

---

## Option 4: DigitalOcean App Platform

```yaml
# .do/app.yaml
name: brigadnikos
region: fra
services:
- name: api
  github:
    repo: your-org/brigadnikos
    branch: main
    deploy_on_push: true
  source_dir: /backend
  build_command: npm run build
  run_command: npm run start:prod
  http_port: 3000
  instance_count: 2
  instance_size_slug: professional-xs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    type: SECRET
  - key: JWT_SECRET
    type: SECRET

databases:
- name: db
  engine: PG
  version: "15"
  size: db-s-1vcpu-1gb

- name: redis
  engine: REDIS
  version: "7"
  size: db-s-1vcpu-1gb
```

Deploy:
```bash
doctl apps create --spec .do/app.yaml
```

---

## SSL/TLS Certificate

### Using Let's Encrypt with Cert-Manager (K8s):

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@brigadnikos.cz
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

---

## Monitoring & Logging

### Sentry for Error Tracking:
```bash
npm install @sentry/node

# In main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: process.env.NODE_ENV,
});
```

### CloudWatch/DataDog for Metrics:
```bash
npm install dd-trace

# In main.ts (before any other imports)
import tracer from 'dd-trace';
tracer.init();
```

---

## Backup Strategy

### PostgreSQL Automated Backups:
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

pg_dump -h localhost -U brigadnikos -d brigadnikos | gzip > $BACKUP_DIR/brigadnikos_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp $BACKUP_DIR/brigadnikos_$TIMESTAMP.sql.gz s3://brigadnikos-backups/
```

### Schedule with Cron:
```bash
0 2 * * * /usr/local/bin/backup-db.sh
```

---

## Performance Optimization

1. **Enable Compression**:
   - Already enabled in `main.ts` with `compression()`

2. **Database Connection Pooling**:
   - Configure in TypeORM config: `extra: { max: 20 }`

3. **Redis Caching**:
   - Cache frequently accessed data (tenant settings, user sessions)

4. **CDN for Static Assets**:
   - Use CloudFront or CloudFlare

5. **Database Indexing**:
   - Already defined in `schema.sql`

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Set strong JWT secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up DDoS protection (CloudFlare)
- [ ] Regular security audits: `npm audit`
- [ ] Enable database encryption at rest
- [ ] Set up VPC/private subnets
- [ ] Configure security groups/firewalls
- [ ] Enable MFA for admin accounts
- [ ] Regular backups tested

---

**🎉 You're ready to deploy BrigadníkOS to production!**

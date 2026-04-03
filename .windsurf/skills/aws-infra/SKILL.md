---
name: aws-infra
description: >
  AWS infrastructure conventions for Vera Sesiom. Service selection, naming, IaC, and deployment patterns.
  Trigger: When provisioning AWS resources, writing IaC, configuring deployments, or choosing AWS services.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Provisioning AWS resources for a project
- Writing Infrastructure as Code (CDK/Terraform)
- Choosing between AWS services
- Configuring CI/CD deployment pipelines
- Setting up environments (dev, staging, prod)

---

## Critical Rules

1. **Infrastructure as Code (IaC) ALWAYS** — no manual console changes in staging/prod
2. **AWS CDK (TypeScript) as default IaC** — unless team has strong Terraform preference
3. **Least privilege IAM** — no wildcard `*` permissions in production
4. **Multi-environment setup** — dev, staging, production minimum
5. **Secrets in SSM Parameter Store or Secrets Manager** — NEVER in code or env files
6. **Tagging everything** — `project`, `environment`, `team`, `cost-center`
7. **All resources in a VPC** — no public-facing resources without explicit justification

---

## Default Service Selection

### Compute

| Need | Service | When |
|------|---------|------|
| API backend | **Lambda + API Gateway** | Default for new APIs |
| Long-running process | **ECS Fargate** | When Lambda limits apply (15min, 10GB) |
| Full server control | **EC2** | Only for specific requirements (GPU, etc.) |
| Background jobs | **Lambda + SQS** | Event-driven processing |

### Database

| Need | Service | When |
|------|---------|------|
| Relational (default) | **RDS PostgreSQL** | Default for most projects |
| NoSQL / key-value | **DynamoDB** | High-throughput, simple access patterns |
| Cache | **ElastiCache Redis** | Session storage, caching |
| Search | **OpenSearch** | Full-text search requirements |

### Storage

| Need | Service | When |
|------|---------|------|
| File storage | **S3** | Always |
| CDN | **CloudFront** | Frontend hosting, media delivery |

### Messaging

| Need | Service | When |
|------|---------|------|
| Queue (default) | **SQS** | Async processing, decoupling |
| Pub/Sub | **SNS** | Fan-out, notifications |
| Event bus | **EventBridge** | Cross-service event routing |

---

## Naming Convention

### Pattern

```
{project}-{environment}-{service}-{descriptor}
```

### Examples

| Resource | Name |
|----------|------|
| S3 bucket | `myapp-prod-s3-uploads` |
| Lambda | `myapp-prod-lambda-create-user` |
| RDS | `myapp-prod-rds-main` |
| SQS queue | `myapp-prod-sqs-email-notifications` |
| ECR repo | `myapp-api` |
| VPC | `myapp-prod-vpc` |
| Security Group | `myapp-prod-sg-api` |

### Tagging

```json
{
  "project": "myapp",
  "environment": "production",
  "team": "backend",
  "cost-center": "engineering",
  "managed-by": "cdk"
}
```

---

## Environment Strategy

| Environment | Purpose | Data | Access |
|------------|---------|------|--------|
| `dev` | Development/testing | Synthetic/seed | All developers |
| `staging` | Pre-production validation | Anonymized copy of prod | Team leads + QA |
| `production` | Live users | Real data | Limited access |

### Environment Parity

- Same IaC templates across environments (parameterized)
- Different instance sizes/counts allowed
- Same security controls in staging and production
- Dev can have relaxed networking for convenience

---

## CDK Structure

```
infra/
├── bin/
│   └── app.ts                    # CDK app entry point
├── lib/
│   ├── stacks/
│   │   ├── network.stack.ts      # VPC, subnets, security groups
│   │   ├── database.stack.ts     # RDS, DynamoDB
│   │   ├── compute.stack.ts      # Lambda, ECS, API Gateway
│   │   ├── storage.stack.ts      # S3, CloudFront
│   │   └── monitoring.stack.ts   # CloudWatch, alarms
│   └── constructs/
│       ├── lambda-function.ts    # Reusable Lambda construct
│       └── api-endpoint.ts       # Reusable API construct
├── config/
│   ├── dev.ts
│   ├── staging.ts
│   └── production.ts
├── cdk.json
├── package.json
└── tsconfig.json
```

---

## Deployment Pipeline

```
Code Push → GitHub Actions → Build → Test → Deploy CDK
                                              ↓
                           dev (auto) → staging (auto) → prod (manual approval)
```

### Deployment Rules

- **dev**: Auto-deploy on push to `develop`
- **staging**: Auto-deploy on push to `release/*`
- **production**: Manual approval required after staging validation
- **Rollback**: Automated on health check failure

---

## Security Baseline

- All data at rest encrypted (S3, RDS, DynamoDB)
- All data in transit encrypted (TLS 1.2+)
- VPC Flow Logs enabled
- CloudTrail enabled for all regions
- GuardDuty enabled
- No public S3 buckets (unless static hosting with CloudFront)
- RDS not publicly accessible
- Lambda functions in VPC when accessing private resources

---

## Cost Optimization

- Use Reserved Instances for predictable RDS/ElastiCache workloads
- Lambda: right-size memory (more memory = more CPU = faster = cheaper sometimes)
- S3: lifecycle policies for old objects (move to Glacier)
- CloudWatch: set up billing alarms per project
- Tag everything for cost allocation reports

---

## Commands

```bash
# CDK commands
cdk synth                          # Synthesize CloudFormation
cdk diff                           # Show pending changes
cdk deploy --all                   # Deploy all stacks
cdk deploy NetworkStack            # Deploy specific stack
cdk destroy --all                  # Tear down (dev only!)

# Useful AWS CLI
aws s3 ls s3://myapp-dev-s3-uploads/
aws logs tail /aws/lambda/myapp-dev-lambda-create-user --follow
aws ssm get-parameter --name /myapp/dev/database-url --with-decryption
```

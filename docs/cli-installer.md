# CLI Installer

A single CLI that sets up Gremlin from scratch and lets users add optional features incrementally.

## Install

```
npm install -g @gremlin/cli
```

## Commands

| Command | What it does |
|---------|-------------|
| `gremlin init` | First-run setup: AWS infra + admin account |
| `gremlin setup domain` | Add a custom domain with HTTPS |
| `gremlin setup gmail` | Add Gmail event source (deploys GCP infra) |
| `gremlin setup slack` | Add Slack event source |
| `gremlin status` | Show what's configured and what's not |
| `gremlin remove gmail` | Remove Gmail event source (GCP + AWS cleanup) |
| `gremlin remove domain` | Remove custom domain |
| `gremlin update` | Update deployment after pulling new repo version |
| `gremlin destroy` | Tear down everything (requires confirmation) |

Every command is idempotent — safe to re-run if something failed halfway. `gremlin init` is the only required step. Everything else can be done later via `gremlin setup <thing>`.

## `gremlin init`

```
$ gremlin init

Welcome to Gremlin

Checking AWS credentials...

? AWS profile:
  ❯ default
    personal
    work-prod
    work-dev

Using profile: work-dev
  Account:  123456789012
  Identity: arn:aws:iam::123456789012:user/marvin

? AWS region: us-east-1

Checking permissions...
  ✓ DynamoDB
  ✓ SQS
  ✓ EC2
  ✓ IAM
  ✓ CloudFormation

? Custom domain name (enter to skip): gremlin.mycompany.com

  Providing a domain here runs the same steps as `gremlin setup domain`
  (certificate request, DNS validation, CloudFront alias). Enter to skip
  and add one later.

? Create your admin account
  Email: me@example.com
  Password: ********

Setting up AWS infrastructure...
  ✓ DynamoDB tables
  ✓ SQS queues
  ✓ EC2 sandbox stack
  ✓ CloudFront distribution

✓ Gremlin is running at https://d1234abcd.cloudfront.net

Next steps:
  gremlin setup domain    Add a custom domain with HTTPS
  gremlin setup gmail     Connect Gmail event source
  gremlin status          See what's configured

Docs: https://opengremlin.com/docs/getting-started
```

### Permission check failure

```
Checking permissions...
  ✓ DynamoDB
  ✓ SQS
  ✗ EC2 — cannot describe/run instances
  ✓ IAM
  ✓ CloudFormation

Missing required permissions. Recommended: use the Gremlin setup policy
(least-privilege, scoped to what the installer needs):
  https://opengremlin.com/docs/setup/aws-permissions

Or for quick-start, these AWS managed policies cover it (broader than needed):
  - AmazonDynamoDBFullAccess
  - AmazonSQSFullAccess
  - AmazonEC2FullAccess
  - IAMFullAccess
  - AWSCloudFormationFullAccess

Cannot proceed without required permissions.
```

### No AWS credentials

```
Checking AWS credentials...
  ✗ No AWS credentials found

  Configure credentials with:
    aws configure

  Or set environment variables:
    export AWS_ACCESS_KEY_ID=...
    export AWS_SECRET_ACCESS_KEY=...

  Guide: https://opengremlin.com/docs/setup/aws-credentials
```

## `gremlin setup domain`

```
$ gremlin setup domain

? Domain name: gremlin.mycompany.com

Note: CloudFront certificates must be in us-east-1.
Your other infrastructure stays in eu-west-1.

Creating ACM certificate in us-east-1...
✓ Certificate requested

Add this CNAME to your DNS for validation:
  _abc123.gremlin.mycompany.com → _def456.acm-validations.aws

Not sure how? https://opengremlin.com/docs/setup/custom-domain#dns

Waiting for certificate validation... (this can take a few minutes)
✓ Certificate validated

Adding custom domain to CloudFront...
✓ CloudFront alias configured

Add this CNAME to your DNS:
  gremlin.mycompany.com → d1234abcd.cloudfront.net

Waiting for DNS propagation...
✓ Domain verified

✓ Gremlin is now at https://gremlin.mycompany.com
```

### Already configured

```
$ gremlin setup domain

Custom domain already configured: gremlin.mycompany.com
  CloudFront: d1234abcd.cloudfront.net
  Certificate: ✓ valid, expires 2027-03-30

? Change domain? (y/N)
```

## `gremlin setup gmail`

### Prerequisites check

```
$ gremlin setup gmail

Checking prerequisites...
  ✗ gcloud CLI not found

Install it: https://cloud.google.com/sdk/docs/install
Then run: gcloud auth login

After that, re-run: gremlin setup gmail

Troubleshooting: https://opengremlin.com/docs/setup/gmail-prereqs
```

### Happy path

```
$ gremlin setup gmail

Checking GCP credentials...
  ✓ gcloud CLI found

? GCP project:
  ❯ my-project-123 (My Project)
    other-project-456 (Other Project)

Using project: my-project-123
  Account: marvin@gmail.com

Checking permissions...
  ✓ Pub/Sub Admin
  ✓ Cloud Functions Developer
  ✓ Service Account Admin
  ✓ IAM Workload Identity Pool Admin

Setting up Gmail event source...
  ✓ Service account created
  ✓ Pub/Sub topic created
  ✓ Cloud Function deployed
  ✓ Workload Identity Federation configured
  ✓ AWS IAM role updated

Opening browser for Google OAuth...
  ✓ Connected as me@example.com
  ✓ Gmail watch enabled

? Which agent should handle emails for me@example.com?
  ❯ support-agent
    negotiator
    personal-assistant
    Create new agent...

✓ Gmail event source active
  Account: me@example.com → agent: support-agent

Add another Gmail account? (y/N)
```

### Re-authentication

If a Gmail watch expires or OAuth token is revoked, `--reauth` re-runs the OAuth flow and re-enables the watch without redeploying GCP infrastructure:

```
$ gremlin setup gmail --reauth

Opening browser for Google OAuth...
  ✓ Re-authenticated as me@example.com
  ✓ Gmail watch renewed (expires in 7 days)

✓ Gmail event source restored
```

### Missing GCP permissions

```
Checking permissions...
  ✓ Pub/Sub Admin
  ✓ Cloud Functions Developer
  ✗ Service Account Admin
  ✗ IAM Workload Identity Pool Admin

Missing permissions. Run these to grant them:

  gcloud projects add-iam-policy-binding my-project-123 \
    --member="user:marvin@gmail.com" \
    --role="roles/iam.serviceAccountAdmin"

  gcloud projects add-iam-policy-binding my-project-123 \
    --member="user:marvin@gmail.com" \
    --role="roles/iam.workloadIdentityPoolAdmin"

Why are these needed? https://opengremlin.com/docs/setup/gmail-permissions

Then re-run: gremlin setup gmail
```

## `gremlin status`

```
$ gremlin status

Gremlin v0.1.0

AWS Infrastructure     ✓  us-east-1 (account 123456789012)
Server                 ✓  https://d1234abcd.cloudfront.net
Custom domain          ✗  run: gremlin setup domain
Gmail event source     ✓  1 account connected
  me@example.com       ✓  → agent: support-agent (watch expires in 5 days)
Slack event source     ✗  run: gremlin setup slack

Docs: https://opengremlin.com/docs
```

### Unhealthy state

```
$ gremlin status

Gremlin v0.1.0

AWS Infrastructure     ✓  us-east-1 (account 123456789012)
Server                 ✓  https://gremlin.mycompany.com
Custom domain          ✓  gremlin.mycompany.com
Gmail event source     ⚠  1 account, 1 issue
  me@example.com       ✗  watch expired — OAuth token may be revoked
                          Fix: gremlin setup gmail --reauth
                          Help: https://opengremlin.com/docs/troubleshooting/gmail-watch
Slack event source     ✗  run: gremlin setup slack
```

## `gremlin update`

After pulling a new version of the repo, re-deploys everything that's configured:

```
$ gremlin update

Gremlin v0.1.0 → v0.2.0

Updating AWS infrastructure...
  ✓ CDK deploy complete (2 resources updated)

Updating Gmail event source...
  ✓ Cloud Function redeployed

✓ Gremlin updated to v0.2.0
```

Only redeploys what's configured — skips Gmail if it was never set up. Safe to run on every pull; CDK and Terraform are no-ops if nothing changed.

## `gremlin remove <thing>`

Reverses a specific `setup` step. Leaves everything else intact.

```
$ gremlin remove gmail

This will:
  - Delete GCP Cloud Function
  - Delete Pub/Sub topic and subscription
  - Delete GCP service account
  - Remove Workload Identity Federation config
  - Revoke Gmail watch for all connected accounts
  - Remove account bindings from Gremlin

Connected accounts:
  me@example.com → agent: support-agent

? Proceed? (y/N) y

Tearing down Gmail event source...
  ✓ Gmail watch revoked for me@example.com
  ✓ Account bindings removed
  ✓ Cloud Function deleted
  ✓ Pub/Sub topic deleted
  ✓ Service account deleted
  ✓ Workload Identity Federation removed
  ✓ AWS IAM role updated

✓ Gmail event source removed

Note: Your Google OAuth connection is still active.
Agents can still call Gmail APIs — only the event source was removed.
To disconnect Google entirely, use the Gremlin UI.
```

```
$ gremlin remove domain

This will:
  - Remove custom domain alias from CloudFront
  - Delete ACM certificate

Gremlin will still be accessible at https://d1234abcd.cloudfront.net

? Proceed? (y/N) y

Removing custom domain...
  ✓ CloudFront alias removed
  ✓ ACM certificate deleted

✓ Custom domain removed

You can remove this DNS record:
  gremlin.mycompany.com → d1234abcd.cloudfront.net

✓ Gremlin is at https://d1234abcd.cloudfront.net
```

## `gremlin destroy`

Tears down everything. Nuclear option.

```
$ gremlin destroy

⚠ This will permanently destroy your Gremlin installation.
  Consider exporting your data first: gremlin export --out ./backup

Resources to be deleted:

  AWS Infrastructure (us-east-1, account 123456789012):
    - DynamoDB tables (all agent data, tasks, conversations)
    - SQS queues
    - EC2 sandbox instances
    - CloudFront distribution
    - IAM roles

  GCP Infrastructure (my-project-123):
    - Gmail event source (Cloud Function, Pub/Sub, service account, WIF)

  This action cannot be undone.

? Type "destroy my-gremlin" to confirm:
```

### Safeguards

- Requires typing a confirmation phrase, not just `y`
- Shows exactly what will be deleted, including account IDs and regions
- Event sources are torn down first (cleanest order — dependents before dependencies)
- If any step fails, stops and shows what was deleted and what remains
- Suggests `gremlin remove <thing>` if they only want to remove one piece

```
? Are you sure you want to destroy everything?
  Tip: To remove just one part, use:
    gremlin remove gmail
    gremlin remove domain
```

## Design Principles

- **Check before acting** — verify credentials and permissions upfront, not halfway through a deploy
- **Show what identity you're using** — account ID, IAM user, GCP project. Avoid deploying to the wrong account.
- **Every dead end gets a link** — missing permission, missing CLI tool, DNS confusion. The happy path stays clean.
- **Actionable errors** — show the exact command to fix the problem, not just "permission denied"
- **Idempotent** — every command picks up where it left off. Safe to re-run.
- **Optional means optional** — `gremlin init` gets you running. Everything else is `gremlin setup <thing>` whenever you're ready.
- **No hidden state** — `gremlin status` shows everything at a glance

## Implementation

The CLI is a thin orchestrator. Under the hood:

| Step | Tool |
|------|------|
| AWS infra | CDK (`cdk deploy`) |
| Permission checks | AWS STS + IAM simulation (`SimulatePrincipalPolicy`) |
| GCP infra | Terraform or `gcloud` commands |
| GCP permission checks | `gcloud projects get-iam-policy` |
| OAuth flow | Opens browser, local callback server |
| Account binding | Gremlin GraphQL API |
| Watch renewal | Gremlin API (calls `users.watch`) |

### Custom domain

The CloudFront distribution always exists. Custom domain is stored in SSM Parameter Store so it persists across deploys — the CDK stack reads it at deploy time:

```typescript
// CLI writes to SSM before deploying
// aws ssm put-parameter --name /gremlin/custom-domain --value gremlin.mycompany.com

const customDomain = ssm.StringParameter.valueFromLookup(
  this, "/gremlin/custom-domain"
) || undefined;

const certificate = customDomain
  ? new acm.Certificate(this, "Cert", {
      domainName: customDomain,
      validation: acm.CertificateValidation.fromDns(),
    })
  : undefined;

const distribution = new cloudfront.Distribution(this, "Cdn", {
  defaultBehavior: { origin },
  domainNames: customDomain ? [customDomain] : undefined,
  certificate,
});
```

CLI commands:

| Command | What runs |
|---------|-----------|
| `gremlin init` | `cdk deploy` |
| `gremlin setup domain` | write domain to SSM → `cdk deploy` |
| `gremlin remove domain` | delete SSM param → `cdk deploy` |
| `gremlin update` | `cdk deploy` (domain persists in SSM, no need to re-specify) |

Storing in SSM means `gremlin update` and any future `cdk deploy` preserves the domain automatically. No risk of accidentally removing the domain by forgetting a context flag.

ACM certs for CloudFront must be in `us-east-1` regardless of the primary region. CDK handles this with `crossRegionReferences`.

For external DNS (not Route 53), the CLI pauses after requesting the certificate and prompts the user to add the validation CNAME manually, then waits for validation before proceeding.

### State management

Two layers — CloudFormation stack outputs are the source of truth, local config is a cache.

**Stack outputs** (`CfnOutput`):

```
GremlinServerUrl:       https://d1234abcd.cloudfront.net
GremlinCustomDomain:    gremlin.mycompany.com  (if set)
WebhookApiUrl:          https://xyz789.execute-api.us-east-1.amazonaws.com
WebhookIamRoleArn:      arn:aws:iam::123456789012:role/gremlin-webhook-pusher
```

The CLI reads these via `aws cloudformation describe-stacks` and caches locally.

**Local config** (`~/.gremlin/config.json`):

```json
{
  "version": "0.1.0",
  "aws": {
    "profile": "work-dev",
    "region": "us-east-1",
    "accountId": "123456789012",
    "stackName": "GremlinStack"
  },
  "server": {
    "url": "https://gremlin.mycompany.com"
  },
  "eventSources": {
    "gmail": {
      "gcpProject": "my-project-123",
      "accounts": ["me@example.com"]
    }
  }
}
```

This config is read by `gremlin status` and subsequent `gremlin setup` commands so the user doesn't re-enter information.

If the local config is missing or stale (e.g., running from a different machine), the CLI recovers from the stack:

```
$ gremlin init

Found existing Gremlin deployment in us-east-1 (account 123456789012)
  Server: https://gremlin.mycompany.com

? Resume using this deployment? (Y/n)
```

The CLI detects existing deployments by looking for the Gremlin CloudFormation stack in the selected region/profile. This makes the setup portable — clone the repo on a new machine, `gremlin init` picks up where you left off.

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as efs from "aws-cdk-lib/aws-efs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class DatabaseStack extends cdk.Stack {
  readonly table: dynamodb.ITable;
  readonly tableName: string;
  readonly secretsTable: dynamodb.ITable;
  readonly secretsTableName: string;
  readonly fileSystem: efs.IFileSystem;
  readonly accessPoint: efs.IAccessPoint;
  readonly uploadsBucket: s3.IBucket;
  readonly uploadsBucketName: string;
  readonly skillsBucket: s3.IBucket;
  readonly skillsBucketName: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // ── DynamoDB ─────────────────────────────────────────────
    this.tableName = "gremlin";

    const table = new dynamodb.Table(this, "Table", {
      tableName: this.tableName,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: "ttl",
    });

    table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    table.addGlobalSecondaryIndex({
      indexName: "gsi2",
      partitionKey: { name: "gsi2pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi2sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.table = table;

    this.secretsTableName = "gremlin-secrets";

    const secretsTable = new dynamodb.Table(this, "SecretsTable", {
      tableName: this.secretsTableName,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.secretsTable = secretsTable;

    // ── EFS for shared /workspace ────────────────────────────
    const efsSg = new ec2.SecurityGroup(this, "EfsSg", {
      vpc: props.vpc,
      description: "Gremlin EFS",
    });
    efsSg.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(2049),
      "NFS from VPC",
    );

    const fileSystem = new efs.FileSystem(this, "WorkspaceFs", {
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: efsSg,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const accessPoint = fileSystem.addAccessPoint("WorkspaceAp", {
      path: "/workspace",
      createAcl: { ownerGid: "1000", ownerUid: "1000", permissions: "755" },
      posixUser: { gid: "1000", uid: "1000" },
    });

    this.fileSystem = fileSystem;
    this.accessPoint = accessPoint;

    // ── S3 uploads staging bucket ─────────────────────────────
    const uploadsBucket = new s3.Bucket(this, "UploadsBucket", {
      bucketName: `gremlin-uploads-staging-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(1),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ["*"],
          allowedHeaders: ["Content-Type", "Content-Disposition", "x-amz-*"],
          maxAge: 3600,
        },
      ],
    });

    this.uploadsBucket = uploadsBucket;
    this.uploadsBucketName = uploadsBucket.bucketName;

    // ── S3 skills bucket ─────────────────────────────────────
    const skillsBucket = new s3.Bucket(this, "SkillsBucket", {
      bucketName: `gremlin-skills-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Deploy core skills from packages/lib/skills/ to core/ prefix
    new s3deploy.BucketDeployment(this, "CoreSkills", {
      sources: [
        s3deploy.Source.asset(path.resolve(__dirname, "../../lib/skills")),
      ],
      destinationBucket: skillsBucket,
      destinationKeyPrefix: "core/",
      prune: true,
    });

    this.skillsBucket = skillsBucket;
    this.skillsBucketName = skillsBucket.bucketName;
  }
}

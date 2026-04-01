export function getAwsTrustPolicy(): string {
  const roleArn = process.env.SERVER_ROLE_ARN;
  if (!roleArn) {
    throw new Error(
      "SERVER_ROLE_ARN environment variable is not set. Cannot generate trust policy.",
    );
  }

  return JSON.stringify(
    {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: roleArn },
          Action: "sts:AssumeRole",
        },
      ],
    },
    null,
    2,
  );
}

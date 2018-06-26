This is a node.js script for doing a bare-bones check of permissions on AWS S3 buckets. To use this, script, make sure you have node.js installed and use npm to get the AWS SDK.

Set your credentials using AWS configure if you do not need a session token, or using environment variables if you do.

The script will list out all the S3 buckets the AWS account can access, then recursively check permissions on all files in the S3 buckets. Make sure your credentials have permissions to ListAllMyBuckets, ListBucket, and GetObjectAcl.


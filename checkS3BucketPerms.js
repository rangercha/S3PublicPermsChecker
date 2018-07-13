// Load the SDK and UUID
var AWS = require('aws-sdk');
 
// Create an S3 client
var s3 = new AWS.S3();
s3.listBuckets(function(err, buckets) {
  if (err) console.log(err, err.stack); // an error occurred
  else     checkPublicBuckets(buckets);           // successful response
});
 
 
function checkPublicBuckets(bucketJson){
  for (let bucket of bucketJson['Buckets']) {
     let params = {
      Bucket: bucket['Name']
    };
    s3.getBucketAcl(params, function(err, bucketAclJson) {
      if (err) console.log(err, err.stack); // an error occurred
      else {
        //Check bucket permissions for Authenticated Users and Everyone
        console.log(params.Bucket + ' --- ' + checkGrants(bucketAclJson));
        s3.getBucketPolicy(params, function(err, bucketPolicyJson) {
          if (err) {
            if (err.code !== "NoSuchBucketPolicy") {
              console.log(err, err.stack);
            }
          }
          else {
            if (bucketPolicyJson !== null) {
              console.log(params.Bucket + ' --- Policy --- ' + checkPolicy(bucketPolicyJson)); 
            }
          }
        });
        //Get bucket objects
       var bucketObjectsJson = retrieveBucketObjects(params.Bucket, null);
      }
    });
  }
}
 
function retrieveBucketObjects(bucketName, continuationToken){
  var params = {
    Bucket: bucketName,
    MaxKeys: 1000,
    ContinuationToken: continuationToken
  };
  s3.listObjectsV2(params, function(err, bucketObjectsJson) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      checkBucketObjects(bucketObjectsJson);
      if (bucketObjectsJson['IsTruncated']) {
        //truncated call. use recursion to finish
        retrieveBucketObjects(bucketName, bucketObjectsJson['NextContinuationToken']);
      }
    }
  });
}
 
function checkBucketObjects(bucketObjectsJson){
  var bucketName = bucketObjectsJson['Name'];
  for (let s3Obj of bucketObjectsJson['Contents']) {
    (function(){
      let params = {
        Bucket: bucketName,
        Key: s3Obj['Key']
      };
      s3.getObjectAcl(params, function(err, objectAclJson) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
          //Check bucket permissions for Authenticated Users and Everyone
          console.log('s3://' + params.Bucket + '/' + s3Obj['Key'] + ' --- ' + checkGrants(objectAclJson));
        }
      });
    })();
  }
}

function checkPolicy(policyJson){
  var worstPolicyPermissions = 'Private';

  var policy = JSON.parse(policyJson.Policy);

  for (let statement of policy['Statement']) {
    if (statement['Principal'] == '*' && statement['Effect'] == 'Deny' && statement['Action'] == '*') {
      return 'Private';
    }
    if (statement['Principal'] == '*' && statement['Effect'] == 'Allow') {
      worstPolicyPermissions = 'Everyone --- ' + statement['Action'] + ' --- ' + statement['Resource'];
    }
  }
  console.log(worstPolicyPermissions);
  return worstPolicyPermissions;
}

function checkGrants(grantsJson){
  var worstGrantType = 'Private';
 
  for (let grant of grantsJson['Grants']) {
    if (grant['Grantee']['Type'] == 'Group') {
      if (grant['Grantee']['URI'] == 'http://acs.amazonaws.com/groups/global/AllUsers') {
        worstGrantType = 'Everyone';
      } else {
        if (grant['Grantee']['URI'] == 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers') {
          if (worstGrantType == 'Private') {
            worstGrantType = 'Authenticated Users';
          }
        }
      }
    }
  };
  return worstGrantType;
}
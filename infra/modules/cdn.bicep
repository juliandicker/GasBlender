param cdnProfileName string
param cdnEndpointName string
param storageStaticWebHostname string

resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: cdnProfileName
  location: 'global'
  sku: {
    name: 'Standard_Microsoft'
  }
}

resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: cdnEndpointName
  location: 'global'
  properties: {
    originHostHeader: storageStaticWebHostname
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    origins: [
      {
        name: 'storage-origin'
        properties: {
          hostName: storageStaticWebHostname
          httpPort: 80
          httpsPort: 443
        }
      }
    ]
  }
}

output cdnProfileName string = cdnProfile.name
output cdnEndpointName string = cdnEndpoint.name
output cdnEndpointHostname string = cdnEndpoint.properties.hostName

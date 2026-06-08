param cdnProfileName string
param cdnEndpointName string
param customDomainHostname string

resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' existing = {
  name: cdnProfileName
}

resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' existing = {
  parent: cdnProfile
  name: cdnEndpointName
}

resource customDomain 'Microsoft.Cdn/profiles/endpoints/customDomains@2023-05-01' = {
  parent: cdnEndpoint
  name: replace(customDomainHostname, '.', '-')
  properties: {
    hostName: customDomainHostname
  }
}

output customDomainResourceName string = customDomain.name

targetScope = 'subscription'

param appName string = 'gasblender'
param location string = 'northeurope'
param environment string = 'prod'
param resourceGroupName string = 'rg-gasblender-prod'
param dnsResourceGroupName string = 'rg-dns-services-shared-001'
param customDomainHostname string = 'gasblender.redkic.co.uk'

resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: resourceGroupName
  location: location
}

var resourceToken = take(uniqueString(rg.id), 6)
var storageAccountName = toLower('st${replace(appName, '-', '')}${resourceToken}')
var cdnProfileName = 'cdnp-${appName}-${environment}'
var cdnEndpointName = '${appName}-${resourceToken}'

module storage 'modules/storage.bicep' = {
  name: 'storage-deploy'
  scope: rg
  params: {
    location: location
    storageAccountName: storageAccountName
  }
}

module app 'modules/functionApp.bicep' = {
  name: 'functionapp-deploy'
  scope: rg
  params: {
    location: location
    functionAppName: '${appName}-${resourceToken}'
    storageAccountName: storage.outputs.storageAccountName
    appEnv: environment
  }
}

module cdn 'modules/cdn.bicep' = {
  name: 'cdn-deploy'
  scope: rg
  params: {
    cdnProfileName: cdnProfileName
    cdnEndpointName: cdnEndpointName
    storageStaticWebHostname: storage.outputs.staticWebsiteHostname
  }
}

module dns 'modules/dns.bicep' = {
  name: 'dns-deploy'
  scope: resourceGroup(dnsResourceGroupName)
  params: {
    cdnEndpointHostname: cdn.outputs.cdnEndpointHostname
  }
}

module cdnDomain 'modules/cdn-domain.bicep' = {
  name: 'cdn-domain-deploy'
  scope: rg
  params: {
    cdnProfileName: cdn.outputs.cdnProfileName
    cdnEndpointName: cdn.outputs.cdnEndpointName
    customDomainHostname: customDomainHostname
  }
  dependsOn: [dns]
}

output storageAccountName string = storage.outputs.storageAccountName
output functionAppName string = app.outputs.functionAppName
output cdnProfileName string = cdn.outputs.cdnProfileName
output cdnEndpointName string = cdn.outputs.cdnEndpointName
output customDomainResourceName string = cdnDomain.outputs.customDomainResourceName

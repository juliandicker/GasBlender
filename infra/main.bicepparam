using './main.bicep'

param appName = 'gasblender'
param environment = 'prod'
param location = 'northeurope'
param resourceGroupName = 'rg-gasblender-prod'
param dnsResourceGroupName = 'rg-dns-services-shared-001'
param customDomainHostname = 'gasblender.redkic.co.uk'

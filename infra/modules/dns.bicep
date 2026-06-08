param targetHostname string
param subDomainLabel string = 'gasblender'
param dnsZoneName string = 'redkic.co.uk'

resource dnsZone 'Microsoft.Network/dnsZones@2018-05-01' existing = {
  name: dnsZoneName
}

resource cnameRecord 'Microsoft.Network/dnsZones/CNAME@2018-05-01' = {
  parent: dnsZone
  name: subDomainLabel
  properties: {
    TTL: 3600
    CNAMERecord: {
      cname: targetHostname
    }
  }
}

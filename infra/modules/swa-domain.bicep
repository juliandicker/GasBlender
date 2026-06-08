param staticWebAppName string
param customDomainHostname string

resource staticWebApp 'Microsoft.Web/staticSites@2022-03-01' existing = {
  name: staticWebAppName
}

resource customDomain 'Microsoft.Web/staticSites/customDomains@2022-03-01' = {
  parent: staticWebApp
  name: customDomainHostname
  properties: {
    validationMethod: 'cname-delegation'
  }
}

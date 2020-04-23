import Client from '@arso-project/sonar-client'

const client = new Client({
})

if (typeof window !== 'undefined') {
  window.__sonarClient = client
}

export default client

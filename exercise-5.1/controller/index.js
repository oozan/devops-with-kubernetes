const fs = require('fs')
const https = require('https')

const host = process.env.KUBERNETES_SERVICE_HOST
const port = process.env.KUBERNETES_SERVICE_PORT_HTTPS || '443'
const tokenPath = '/var/run/secrets/kubernetes.io/serviceaccount/token'
const caPath = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt'
const token = fs.readFileSync(tokenPath, 'utf8')
const ca = fs.readFileSync(caPath)

const apiRequest = (method, path, body) =>
  new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: host,
        port,
        path,
        method,
        ca,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
      },
      (response) => {
        let data = ''
        response.on('data', (chunk) => (data += chunk))
        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(data ? JSON.parse(data) : {})
            return
          }
          const error = new Error(`${method} ${path} returned ${response.statusCode}: ${data}`)
          error.statusCode = response.statusCode
          reject(error)
        })
      },
    )
    request.on('error', reject)
    if (body) request.write(JSON.stringify(body))
    request.end()
  })

const ownerReference = (site) => [
  {
    apiVersion: site.apiVersion,
    kind: site.kind,
    name: site.metadata.name,
    uid: site.metadata.uid,
    controller: true,
    blockOwnerDeletion: true,
  },
]

const labelsFor = (site) => ({
  app: `${site.metadata.name}-dummysite`,
  'app.kubernetes.io/managed-by': 'dummysite-controller',
  'dummysite.stable.dwk/name': site.metadata.name,
})

const deploymentFor = (site) => {
  const name = `${site.metadata.name}-dummysite`
  const labels = labelsFor(site)
  return {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name,
      namespace: site.metadata.namespace,
      labels,
      ownerReferences: ownerReference(site),
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: labels.app } },
      template: {
        metadata: { labels },
        spec: {
          initContainers: [
            {
              name: 'copy-site',
              image: 'curlimages/curl:8.10.1',
              command: ['sh', '-c'],
              args: ['curl -L --fail --max-time 30 "$WEBSITE_URL" -o /work-dir/index.html'],
              env: [{ name: 'WEBSITE_URL', value: site.spec.website_url }],
              volumeMounts: [{ name: 'website', mountPath: '/work-dir' }],
            },
          ],
          containers: [
            {
              name: 'nginx',
              image: 'nginx:1.27-alpine',
              ports: [{ name: 'http', containerPort: 80 }],
              readinessProbe: { httpGet: { path: '/', port: 'http' }, initialDelaySeconds: 2 },
              resources: {
                requests: { cpu: '20m', memory: '32Mi' },
                limits: { cpu: '100m', memory: '64Mi' },
              },
              volumeMounts: [{ name: 'website', mountPath: '/usr/share/nginx/html', readOnly: true }],
            },
          ],
          volumes: [{ name: 'website', emptyDir: {} }],
        },
      },
    },
  }
}

const serviceFor = (site) => {
  const name = `${site.metadata.name}-dummysite`
  const labels = labelsFor(site)
  return {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name,
      namespace: site.metadata.namespace,
      labels,
      ownerReferences: ownerReference(site),
    },
    spec: {
      selector: { app: labels.app },
      ports: [{ name: 'http', port: 80, targetPort: 'http' }],
    },
  }
}

const createOrReplace = async (basePath, resource) => {
  const itemPath = `${basePath}/${resource.metadata.name}`
  try {
    const current = await apiRequest('GET', itemPath)
    resource.metadata.resourceVersion = current.metadata.resourceVersion
    if (resource.kind === 'Service') {
      resource.spec.clusterIP = current.spec.clusterIP
      resource.spec.clusterIPs = current.spec.clusterIPs
      resource.spec.ipFamilies = current.spec.ipFamilies
      resource.spec.ipFamilyPolicy = current.spec.ipFamilyPolicy
    }
    await apiRequest('PUT', itemPath, resource)
    console.log(`Updated ${resource.kind} ${resource.metadata.namespace}/${resource.metadata.name}`)
  } catch (error) {
    if (error.statusCode !== 404) throw error
    await apiRequest('POST', basePath, resource)
    console.log(`Created ${resource.kind} ${resource.metadata.namespace}/${resource.metadata.name}`)
  }
}

const reconcile = async (site) => {
  if (!site.spec || !site.spec.website_url) return
  const namespace = site.metadata.namespace
  console.log(`Reconciling DummySite ${namespace}/${site.metadata.name}: ${site.spec.website_url}`)
  await createOrReplace(`/apis/apps/v1/namespaces/${namespace}/deployments`, deploymentFor(site))
  await createOrReplace(`/api/v1/namespaces/${namespace}/services`, serviceFor(site))
}

const watch = (resourceVersion) => {
  const path = `/apis/stable.dwk/v1/dummysites?watch=true&allowWatchBookmarks=true&resourceVersion=${encodeURIComponent(resourceVersion)}`
  const request = https.request(
    { hostname: host, port, path, ca, headers: { Authorization: `Bearer ${token}` } },
    (response) => {
      let buffer = ''
      response.on('data', (chunk) => {
        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line)
          if (['ADDED', 'MODIFIED'].includes(event.type)) {
            reconcile(event.object).catch((error) => console.error(error.message))
          }
        }
      })
      response.on('end', () => setTimeout(start, 1000))
    },
  )
  request.on('error', (error) => {
    console.error(`Watch failed: ${error.message}`)
    setTimeout(start, 2000)
  })
  request.end()
}

const start = async () => {
  try {
    const list = await apiRequest('GET', '/apis/stable.dwk/v1/dummysites')
    for (const site of list.items) await reconcile(site)
    watch(list.metadata.resourceVersion)
  } catch (error) {
    console.error(`Controller startup failed: ${error.message}`)
    setTimeout(start, 2000)
  }
}

start()

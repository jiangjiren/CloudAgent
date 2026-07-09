import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { getConnectableHost, normalizeLoopbackHost } from './shared/networkHosts.js'

const nodeModuleChunkGroups = [
  {
    name: 'vendor-react',
    packages: ['react', 'react-dom', 'react-router-dom', 'scheduler', 'use-sync-external-store']
  },
  {
    name: 'vendor-codemirror-features',
    packages: [
      '@uiw/react-codemirror',
      '@codemirror/lang-css',
      '@codemirror/lang-html',
      '@codemirror/lang-javascript',
      '@codemirror/lang-json',
      '@codemirror/lang-markdown',
      '@codemirror/lang-python',
      '@codemirror/theme-one-dark',
      '@codemirror/autocomplete',
      '@codemirror/lint',
      '@codemirror/merge',
      '@replit/codemirror-minimap'
    ]
  },
  {
    name: 'vendor-codemirror-core',
    packages: ['@codemirror', '@lezer', 'crelt', 'style-mod', 'w3c-keyname']
  },
  {
    name: 'vendor-xterm',
    packages: ['@xterm']
  },
  {
    name: 'vendor-markdown',
    packages: [
      'react-markdown',
      'remark-gfm',
      'remark-math',
      'rehype-katex',
      'rehype-raw',
      'katex',
      'hast-util',
      'mdast-util',
      'micromark',
      'unist-util',
      'vfile',
      'unified',
      'bail',
      'ccount',
      'character-entities',
      'comma-separated-tokens',
      'decode-named-character-reference',
      'devlop',
      'html-url-attributes',
      'is-plain-obj',
      'longest-streak',
      'property-information',
      'space-separated-tokens',
      'trim-lines',
      'trough',
      'zwitch'
    ]
  },
  {
    name: 'vendor-syntax-highlighter',
    packages: ['react-syntax-highlighter', 'prismjs', 'refractor', 'lowlight', 'highlight.js']
  },
  {
    name: 'vendor-icons',
    packages: ['lucide-react']
  },
  {
    name: 'vendor-i18n',
    packages: ['i18next', 'i18next-browser-languagedetector', 'react-i18next']
  },
  {
    name: 'vendor-utils',
    packages: [
      'class-variance-authority',
      'clsx',
      'cmdk',
      'dompurify',
      'fuse.js',
      'gray-matter',
      'jszip',
      'mime-types',
      'tailwind-merge'
    ]
  },
  {
    name: 'vendor-sdks',
    packages: ['@anthropic-ai', '@openai', '@octokit', '@iarna']
  }
]

const getPackageChunkName = (id) => {
  const normalizedId = id.replace(/\\/g, '/')
  const nodeModulesIndex = normalizedId.lastIndexOf('/node_modules/')

  if (nodeModulesIndex === -1) {
    return undefined
  }

  const modulePath = normalizedId.slice(nodeModulesIndex + '/node_modules/'.length)

  for (const group of nodeModuleChunkGroups) {
    if (group.packages.some((packageName) => modulePath === packageName || modulePath.startsWith(`${packageName}/`))) {
      return group.name
    }
  }

  return 'vendor-misc'
}

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  const configuredHost = env.HOST || '0.0.0.0'
  // if the host is not a loopback address, it should be used directly. 
  // This allows the vite server to EXPOSE all interfaces when the host 
  // is set to '0.0.0.0' or '::', while still using 'localhost' for browser 
  // URLs and proxy targets.
  const host = normalizeLoopbackHost(configuredHost)
  
  const proxyHost = getConnectableHost(configuredHost)
  // TODO: Remove support for legacy PORT variables in all locations in a future major release, leaving only SERVER_PORT.
  const serverPort = env.SERVER_PORT || env.PORT || 3001

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host,
      port: parseInt(env.VITE_PORT) || 5173,
      proxy: {
        '/api': `http://${proxyHost}:${serverPort}`,
        '/ws': {
          target: `ws://${proxyHost}:${serverPort}`,
          ws: true
        },
        '/shell': {
          target: `ws://${proxyHost}:${serverPort}`,
          ws: true
        },
        '/plugin-ws': {
          target: `ws://${proxyHost}:${serverPort}`,
          ws: true
        }
      }
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: getPackageChunkName
        }
      }
    }
  }
})

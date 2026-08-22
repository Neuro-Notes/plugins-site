import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const root = process.cwd()
const sourceRoots = [
  join(root, 'app'),
  join(root, '..', 'docs', '.vitepress', 'theme')
]
const errors = []
const literalColor = /(?:#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\()/

const walk = async directory => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) await walk(path)
    else if (['.vue', '.css'].includes(extname(path))) {
      const source = await readFile(path, 'utf8')
      if (extname(path) === '.vue' && /<style\b/i.test(source)) {
        errors.push(`${relative(root, path)}: component styles must live in a shared stylesheet`)
      }
      if (literalColor.test(source)) errors.push(`${relative(root, path)}: use semantic theme tokens instead of literal colors`)
    }
  }
}

for (const sourceRoot of sourceRoots) await walk(sourceRoot)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log('Style location and semantic color checks passed.')
}

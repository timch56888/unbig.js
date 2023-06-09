const crypto = require('crypto')
const { createDomainService } = require('./domains')
const fs = require('fs/promises')
const path = require('path')

const { AES_KEY, SITES_API_URL } = process.env

const packageFilePath = path.resolve(__dirname, '../package.json')

function encrypt (plaintext) {
  const cipher = crypto.createCipheriv('aes-128-ecb', AES_KEY, '')
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return encrypted
}

function decrypt (ciphertext) {
  const decipher = crypto.createDecipheriv('aes-128-ecb', AES_KEY, '')
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

(async () => {
  const service = await createDomainService(SITES_API_URL + '?site_type=player_app')

  const domains = service.get()
  if (domains.length < 0) {
    throw new Error('No domains found.')
  }

  const originalData = JSON.parse(await fs.readFile(packageFilePath, { encoding: 'utf8' }))
  const originalDomains = originalData.config.tags.map((tag) => decrypt(tag))

  if (domains.length === originalDomains.length && domains.every((d) => originalDomains.includes(d))) {
    console.log('No need to update.')

    // eslint-disable-next-line no-process-exit
    process.exit(0)
  }

  const newTags = domains.map((d) => encrypt(d))
  const [major, minor, patch] = originalData.version.split('.')

  const newPackageJson = JSON.stringify(
    {
      ...originalData,
      version: `${major}.${minor}.${Number(patch) + 1}`,
      config: {
        tags: newTags
      }
    },
    null,
    2
  )

  await fs.writeFile(packageFilePath, newPackageJson, { encoding: 'utf8' })
  console.log('Update success.')

  // eslint-disable-next-line no-process-exit
  process.exit(0)
})()

/**
 * createDomainService
 * @param {string} url
 * @returns {{ get(): string[] }}
 */
async function createDomainService (url) {
  let domains = []
  let latestUpdateTime = new Date()

  /**
   * fetchDomains
   * @returns {Promise<string[]>}
   */
  const fetchDomains = async () => {
    const data = await fetch(url).then((res) => res.json())
    if (
      'domains' in data &&
      Array.isArray(data.domains) &&
      data.domains.every((d) => typeof d === 'string')
    ) {
      domains = data.domains
      latestUpdateTime = new Date()
      console.log(`Update domains in ${latestUpdateTime.toLocaleString()}: ${url}`)
      return data.domains
    }
    throw new Error('Unknown API response.' + JSON.stringify(data, null, 2))
  }

  // init
  await fetchDomains().catch((e) => { console.error(`Fetch ${url} failed.`, e) })
  setInterval(() => {
    fetchDomains()
      .catch((e) => { console.error(`Fetch ${url} failed.`, e) })
  }, 1000 * 60 * 5)

  return {
    get () {
      return domains
    }
  }
}

module.exports = { createDomainService }

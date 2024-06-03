interface AmazonURL {
  tld: string
  store: string | null
  id: string,
  formatted: string
}

interface AmazonHTML {
  headers: string
  body: {
    raw: string
    pretty: string
  }
}

interface AmazonStore {
  length: number
  products: AmazonProduct[]
}

type AmazonProduct = any

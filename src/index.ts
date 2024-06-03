import { Hono } from 'hono'
import * as cheerio from 'cheerio'
import pretty from 'pretty'

type Bindings = {
  [key in keyof CloudflareBindings]: CloudflareBindings[key]
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('ok')
})

app.get('/amazon', async (c) => {
  const url = c.req.query('url')

  if (!url) {
    return c.json({
      status: 'error',
      data: null
    })
  }

  const amzURL = amazonURL(url)

  if (!amzURL) {
    return c.json({
      status: 'error',
      data: null
    })
  }

  const amzHTML = await amazonHTML(amzURL.formatted)

  if (!amzHTML) {
    return c.json({
      status: 'error',
      data: null
    })
  }

  const amzStore = amazonStore(amzHTML.body.raw)

  return c.json({
    status: 'test',
    data: amzStore
  })

  // if (amzStore) {
  //   return c.json({
  //     status: 'success',
  //     data: amzStore
  //   })
  // } else {
  //   return c.json({
  //     status: 'error',
  //     data: null
  //   })
  // }
})

function amazonURL(url: string): AmazonURL | null {
  const TLDs = ['com', 'ca', 'com.mx', 'co.uk', 'fr', 'de', 'it', 'es', 'in', 'jp', 'nl', 'com.tr', 'sa', 'ae', 'au', 'sg', 'com.br']

  const step1: string | undefined = url.trim().split('.amazon.')[1] ?? url.trim().split('amazon.')[1]

  if (!step1) {
    return null
  }

  const step2 = step1.split('?')[0] ?? step1
  const step3 = step2.split('/')

  if (step3.length < 4) {
    return null
  }

  const TLD = step3.shift() as string
  const ID = step3.pop() as string

  const tempID = ID.split('-')

  const validTLD = TLDs.includes(TLD)
  const validID = ID.length === 36 && !tempID.map((id, i) => id.length === (i === 0 ? 8 : i < 4 ? 4 : 12)).includes(false) // e.g. D64B2974-66CA-47F2-AAB5-6F5AAC60BB95

  const storeName = step3.length === 3 ? step3[1] : step3.length === 5 ? step3[3] : null

  if (validTLD && validID) {
    return {
      tld: TLD,
      store: storeName,
      id: ID,
      formatted: `https://www.amazon.${TLD}/stores/page/${ID}`
    }
  } else {
    return null
  }
}

async function amazonHTML(url: string): Promise<AmazonHTML | null> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      return null
    }

    const contentType = response.headers.get('content-type')

    if (!contentType?.includes('text/html')) {
      return null
    }

    const html = await response.text()
    const headers = Object.fromEntries(response.headers.entries())

    if (html) {
      return {
        headers: JSON.stringify(headers),
        body: {
          raw: html,
          pretty: pretty(html)
        }
      }
    } else {
      return null
    }
  } catch (e) {
    console.error(e)

    return null
  }
}

function amazonStore(html: string): any {
  const $ = cheerio.load(html)

  const columns = $('div.columns > div > ul')
  console.log('🐈‍⬛ ~ amazonStore ~ columns:', columns)
  
  if (columns.length === 0) {
    return null
  }

  return 'store'
  
  // const products = columns.find('li')

  // if (products.length === 0) {
  //   return null
  // }

  // const productsFormatted = products.map((i, product) => formatProduct(product)).get()
  //   const $product = $(product)
  //   const name = $product.find('h2').text()
  //   const price = $product.find('span.a-price').text()
  //   const image = $product.find('img').attr('src')

  //   return {
  //     name,
  //     price,
  //     image
  //   }
  // }

  // const store = {
  //   name: '',
  //   products: []
  // }


}

export default app

// e.g. https://www.amazon.com/stores/Keychron/page/CD002D0C-81AE-4ACE-BEFD-97ACF1D3359A?ingress=2&visitId=cf37f1c1-a279-4cf2-9e88-50cdbb363a0b&store_ref=bl_ast_dp_brandLogo_sto&ref_=ast_bln

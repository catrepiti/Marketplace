import { Order, Feedback, Question, Marketplace, OrderStatus, RealtimeSale } from '@/lib/types'
import { MARKETPLACE_KEYS } from '@/lib/marketplaces'

// ── Products per marketplace ───────────────────────────────────────────────────
const productsByMP: Record<Marketplace, { name: string; sku: string; price: number }[]> = {
  mercadolivre: [
    { name: 'Fone Bluetooth JBL Tune 510BT',   sku: 'ML-FON-001', price: 189.9  },
    { name: 'Carregador Turbo USB-C 65W',       sku: 'ML-CAR-002', price: 79.9   },
    { name: 'Capa Silicone iPhone 15',          sku: 'ML-CAP-003', price: 39.9   },
    { name: 'Mouse Gamer Logitech G203',        sku: 'ML-MOU-004', price: 159.9  },
    { name: 'Teclado Mecânico Redragon',        sku: 'ML-TEC-005', price: 249.9  },
    { name: 'Suporte Monitor Articulado',       sku: 'ML-SUP-006', price: 129.9  },
    { name: 'Webcam Full HD 1080p',             sku: 'ML-WEB-007', price: 219.9  },
    { name: 'Hub USB 7 Portas',                 sku: 'ML-HUB-008', price: 89.9   },
  ],
  shopee: [
    { name: 'Relógio Smartwatch HW67 Pro',     sku: 'SH-REL-001', price: 149.9  },
    { name: 'Kit Skincare Vitamina C',          sku: 'SH-SKI-002', price: 69.9   },
    { name: 'Luminária LED Mesa USB',           sku: 'SH-LUM-003', price: 49.9   },
    { name: 'Tênis Esportivo Running',          sku: 'SH-TEN-004', price: 199.9  },
    { name: 'Mochila Notebook 15.6"',           sku: 'SH-MOC-005', price: 119.9  },
    { name: 'Caneca Térmica 500ml',             sku: 'SH-CAN-006', price: 59.9   },
    { name: 'Organizador Gaveta Modulável',     sku: 'SH-ORG-007', price: 34.9   },
    { name: 'Fita LED RGB 5m',                  sku: 'SH-FIT-008', price: 44.9   },
  ],
  amazon: [
    { name: 'Echo Dot (5ª Geração)',            sku: 'AZ-ECH-001', price: 349.0  },
    { name: 'Kindle Paperwhite 16GB',           sku: 'AZ-KIN-002', price: 699.0  },
    { name: 'Cabo USB-C Amazon Basics 2m',      sku: 'AZ-CAB-003', price: 49.9   },
    { name: 'Suporte Notebook Ajustável',       sku: 'AZ-SUP-004', price: 189.9  },
    { name: 'Headphone Over-Ear Noise Cancel',  sku: 'AZ-HEA-005', price: 399.9  },
    { name: 'Câmera Web Logitech C920',         sku: 'AZ-CAM-006', price: 499.9  },
    { name: 'Teclado Sem Fio Bluetooth',        sku: 'AZ-TEC-007', price: 219.9  },
    { name: 'Mouse Sem Fio Silencioso',         sku: 'AZ-MOU-008', price: 149.9  },
  ],
  magalu: [
    { name: 'TV 50" 4K UHD Smart LED',         sku: 'MG-TV-001',  price: 1999.0 },
    { name: 'Geladeira Frost Free 382L',        sku: 'MG-GEL-002', price: 2799.0 },
    { name: 'Micro-ondas 30L Espelhado',        sku: 'MG-MIC-003', price: 599.0  },
    { name: 'Ar Condicionado 12000 BTUs',       sku: 'MG-ARC-004', price: 1499.0 },
    { name: 'Aspirador de Pó Vertical',         sku: 'MG-ASP-005', price: 329.9  },
    { name: 'Liquidificador 1200W Turbo',       sku: 'MG-LIQ-006', price: 189.9  },
    { name: 'Cafeteira Expresso 15 Bar',        sku: 'MG-CAF-007', price: 449.9  },
    { name: 'Fritadeira Air Fryer 5L',          sku: 'MG-FRI-008', price: 399.9  },
  ],
  americanas: [
    { name: 'Perfume Masculino 100ml',          sku: 'AM-PER-001', price: 299.9  },
    { name: 'Conjunto Pijama Inverno',          sku: 'AM-PIJ-002', price: 99.9   },
    { name: 'Kit Maquiagem Completo',           sku: 'AM-MAQ-003', price: 189.9  },
    { name: 'Tênis Casual Feminino',            sku: 'AM-TEN-004', price: 179.9  },
    { name: 'Camiseta Polo Masculina',          sku: 'AM-CAM-005', price: 79.9   },
    { name: 'Bolsa Feminina Couro Sintético',   sku: 'AM-BOL-006', price: 149.9  },
    { name: 'Relogio Masculino Analógico',      sku: 'AM-REL-007', price: 249.9  },
    { name: 'Óculos de Sol UV400',              sku: 'AM-OCS-008', price: 89.9   },
  ],
  casasbabia: [
    { name: 'Sofá Retrátil 3 Lugares',         sku: 'CB-SOF-001', price: 1899.0 },
    { name: 'Cama Box Casal Molas',             sku: 'CB-CAM-002', price: 1299.0 },
    { name: 'Mesa de Jantar 6 Lugares',         sku: 'CB-MES-003', price: 1599.0 },
    { name: 'Guarda-Roupa 6 Portas',            sku: 'CB-GUA-004', price: 999.0  },
    { name: 'Colchão Molas Ensacadas Queen',    sku: 'CB-COL-005', price: 1499.0 },
    { name: 'Poltrona Decorativa Giratória',    sku: 'CB-POL-006', price: 649.9  },
    { name: 'Rack TV Suspenso 180cm',           sku: 'CB-RAC-007', price: 499.9  },
    { name: 'Painel Lareira Elétrica',          sku: 'CB-LAR-008', price: 799.9  },
  ],
}

// Distribution weights for each marketplace (must sum to ~1.0)
const MP_WEIGHTS: Record<Marketplace, number> = {
  mercadolivre: 0.33,
  shopee:       0.24,
  amazon:       0.20,
  magalu:       0.12,
  americanas:   0.07,
  casasbabia:   0.04,
}

const MP_CUMULATIVE: { mp: Marketplace; cum: number }[] = (() => {
  let acc = 0
  return MARKETPLACE_KEYS.map(k => { acc += MP_WEIGHTS[k]; return { mp: k, cum: acc } })
})()

function pickMarketplace(): Marketplace {
  const r = Math.random()
  return (MP_CUMULATIVE.find(e => r < e.cum) ?? MP_CUMULATIVE[MP_CUMULATIVE.length - 1]).mp
}

function externalId(mp: Marketplace, rand: () => number): string {
  const n = Math.floor(rand() * 90000000) + 10000000
  switch (mp) {
    case 'mercadolivre': return `ML-${n}`
    case 'shopee':       return `SPX${n}${n}`
    case 'amazon':       return `AMZ-${n}-BR`
    case 'magalu':       return `MGL${n}`
    case 'americanas':   return `SKY-${n}`
    case 'casasbabia':   return `CB${n}`
  }
}

const firstNames = [
  'Ana', 'Carlos', 'Fernanda', 'João', 'Mariana', 'Pedro', 'Juliana',
  'Rafael', 'Beatriz', 'Lucas', 'Camila', 'Gabriel', 'Larissa', 'Matheus',
  'Priscila', 'Rodrigo', 'Tatiana', 'Vinícius', 'Yasmin', 'Thiago',
]
const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira',
  'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins',
]

const feedbackTitles = {
  5: ['Produto excelente!', 'Superou minhas expectativas', 'Recomendo muito!', 'Chegou rápido e perfeito', 'Ótima qualidade'],
  4: ['Muito bom', 'Gostei bastante', 'Entrega rápida', 'Produto conforme descrito', 'Bom custo-benefício'],
  3: ['Produto ok', 'Regular', 'Mais ou menos', 'Poderia ser melhor', 'Dentro do esperado'],
  2: ['Decepcionante', 'Qualidade inferior ao esperado', 'Demorou para chegar', 'Produto diferente da foto'],
  1: ['Péssimo', 'Não recomendo', 'Produto com defeito', 'Chegou danificado', 'Propaganda enganosa'],
}

const feedbackComments = {
  5: [
    'Produto chegou bem embalado e no prazo. Qualidade excelente, valeu cada centavo!',
    'Comprei com receio mas superou todas as expectativas. Já indiquei para amigos.',
    'Entrega super rápida, produto idêntico ao anunciado. Vendedor confiável!',
    'Ótimo produto, funciona perfeitamente. Atendimento do vendedor impecável.',
  ],
  4: [
    'Produto bom, chegou no prazo. Embalagem poderia ser melhor mas o produto está ok.',
    'Gostei bastante, único porém é que demorou 2 dias a mais que o previsto.',
    'Qualidade boa, preço justo. Recomendo para quem busca custo-benefício.',
  ],
  3: [
    'Produto chegou mas com pequeno arranhão. Funciona bem porém esperava mais.',
    'Ok, mas a qualidade não é tão boa quanto parece nas fotos.',
    'Entrega no prazo mas embalagem veio amassada.',
  ],
  2: [
    'Produto não é bem assim como mostrado nas fotos. Qualidade inferior.',
    'Demorou muito para chegar e quando chegou estava com defeito de fábrica.',
  ],
  1: [
    'Produto parou de funcionar em 3 dias. Péssima qualidade!',
    'Chegou completamente diferente do anunciado. Solicitei devolução.',
    'Produto com defeito de fábrica. Nunca mais compro neste vendedor.',
  ],
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomName() {
  return `${randItem(firstNames)} ${randItem(lastNames)}`
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3600000)
}

let orderCounter = 1000
let feedbackCounter = 500

export function generateOrders(count = 300): Order[] {
  const orders: Order[] = []
  const statuses: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']
  const statusWeights = [0.08, 0.10, 0.15, 0.57, 0.07, 0.03]

  for (let i = 0; i < count; i++) {
    const marketplace = pickMarketplace()
    const products = productsByMP[marketplace]
    const product = randItem(products)
    const qty = rand(1, 3)
    const daysBack = rand(0, 90)
    const createdAt = daysAgo(daysBack)

    let status: OrderStatus = 'delivered'
    const r = Math.random()
    let cumulative = 0
    for (let s = 0; s < statuses.length; s++) {
      cumulative += statusWeights[s]
      if (r < cumulative) { status = statuses[s]; break }
    }

    orders.push({
      id: `ORD-${++orderCounter}`,
      marketplace,
      externalId: externalId(marketplace, Math.random),
      customer: randomName(),
      product: product.name,
      sku: product.sku,
      quantity: qty,
      unitPrice: product.price,
      totalPrice: +(product.price * qty).toFixed(2),
      status,
      createdAt: createdAt.toISOString(),
      updatedAt: addHours(createdAt, rand(1, 48)).toISOString(),
      shippingDeadline: addHours(createdAt, rand(72, 168)).toISOString(),
    })
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function generateFeedbacks(orders: Order[]): Feedback[] {
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const feedbacks: Feedback[] = []
  const ratingWeights = [0.03, 0.05, 0.12, 0.35, 0.45]

  for (const order of deliveredOrders) {
    if (Math.random() > 0.65) continue

    let rating: 1 | 2 | 3 | 4 | 5 = 5
    const r = Math.random()
    let cumulative = 0
    for (let s = 0; s < 5; s++) {
      cumulative += ratingWeights[s]
      if (r < cumulative) { rating = (s + 1) as 1 | 2 | 3 | 4 | 5; break }
    }

    const replied = Math.random() > 0.3

    feedbacks.push({
      id: `FB-${++feedbackCounter}`,
      marketplace: order.marketplace,
      orderId: order.id,
      customer: order.customer,
      rating,
      title: randItem(feedbackTitles[rating]),
      comment: randItem(feedbackComments[rating]),
      replied,
      replyText: replied
        ? 'Olá! Agradecemos muito pelo seu feedback. Ficamos felizes em saber que você ficou satisfeito com a sua compra. Qualquer dúvida estamos à disposição!'
        : undefined,
      createdAt: addHours(new Date(order.updatedAt), rand(24, 120)).toISOString(),
      product: order.product,
    })
  }

  return feedbacks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function generateRealtimeSale(): RealtimeSale {
  const marketplace = pickMarketplace()
  const products = productsByMP[marketplace]
  const product = randItem(products)
  const qty = rand(1, 2)

  return {
    id: `RT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    marketplace,
    customer: randomName(),
    product: product.name,
    value: +(product.price * qty).toFixed(2),
    timestamp: new Date().toISOString(),
  }
}

const questionTemplates = [
  'Esse produto tem garantia? Por quanto tempo?',
  'Qual o prazo de entrega para o interior do estado?',
  'Tem em outras cores disponíveis?',
  'É original ou genérico?',
  'Funciona com voltagem 110v e 220v?',
  'Pode parcelar em até 12x?',
  'O produto vem com nota fiscal?',
  'Qual o tamanho exato do produto?',
  'Aceita troca caso não goste?',
  'Tem assistência técnica autorizada na minha cidade?',
  'É compatível com sistemas Android e iOS?',
  'Qual o peso do produto?',
  'Vende kit com mais de uma unidade?',
  'Tem estoque disponível para pronta entrega?',
  'O frete é grátis para capitais?',
]

let questionCounter = 100

export function generateQuestions(orders: Order[]): Question[] {
  const questions: Question[] = []
  const recentOrders = orders.slice(0, 150)

  for (const order of recentOrders) {
    if (Math.random() > 0.4) continue
    const answered = Math.random() > 0.35
    questions.push({
      id: `QST-${++questionCounter}`,
      marketplace: order.marketplace,
      customer: randomName(),
      product: order.product,
      question: randItem(questionTemplates),
      answered,
      answer: answered
        ? 'Olá! Obrigado pelo interesse. ' + randItem([
            'Sim, o produto possui garantia de 12 meses contra defeitos de fabricação.',
            'O prazo de entrega varia de 3 a 7 dias úteis dependendo da sua região.',
            'Trabalhamos com este modelo na cor exibida. Em breve teremos novas opções.',
            'É 100% original com nota fiscal e manual em português.',
            'Sim, é bivolt automático, funciona em 110v e 220v.',
          ])
        : undefined,
      createdAt: addHours(new Date(order.createdAt), rand(-48, 0)).toISOString(),
    })
  }

  return questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function generateSalesByDay(orders: Order[]) {
  const map: Record<string, Record<string, number>> = {}

  for (let i = 89; i >= 0; i--) {
    const d = daysAgo(i)
    const key = d.toISOString().split('T')[0]
    map[key] = Object.fromEntries(MARKETPLACE_KEYS.map(k => [k, 0]))
  }

  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'returned') continue
    const key = order.createdAt.split('T')[0]
    if (map[key] && order.marketplace in map[key]) {
      map[key][order.marketplace] += order.totalPrice
    }
  }

  return Object.entries(map).map(([date, vals]) => {
    const total = Object.values(vals).reduce((s, v) => s + v, 0)
    return {
      date,
      ...Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, +v.toFixed(2)])),
      total: +total.toFixed(2),
    }
  })
}

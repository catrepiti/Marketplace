export type MarketplaceKey =
  | 'mercadolivre'
  | 'shopee'
  | 'amazon'
  | 'magalu'
  | 'americanas'
  | 'casasbabia'

export interface MarketplaceDef {
  key: MarketplaceKey
  keyUpper: string
  label: string
  abbr: string
  chartColor: string
  tailwind: {
    text: string
    bg: string
    border: string
    dot: string
    bar: string
  }
  connect: {
    logo: string
    sellerIdLabel: string
    sellerIdHelp: string
    tokenLabel: string
    tokenHelp: string
    tokenUrl: string
    oauthHint: string
  }
}

export const MARKETPLACES: Record<MarketplaceKey, MarketplaceDef> = {
  mercadolivre: {
    key: 'mercadolivre',
    keyUpper: 'MERCADOLIVRE',
    label: 'Mercado Livre',
    abbr: 'ML',
    chartColor: '#EAB308',
    tailwind: { text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-400', bar: 'bg-yellow-400' },
    connect: {
      logo: '🛒',
      sellerIdLabel: 'Seller ID',
      sellerIdHelp: 'Encontre em Minha Conta → Dados Pessoais → número de usuário ML.',
      tokenLabel: 'Access Token',
      tokenHelp: 'Gere em developers.mercadolivre.com.br → Aplicativo → Credenciais → Access Token.',
      tokenUrl: 'https://developers.mercadolivre.com.br/devcenter',
      oauthHint: 'Acesse developers.mercadolivre.com.br, crie um aplicativo e gere o Access Token da sua conta.',
    },
  },
  shopee: {
    key: 'shopee',
    keyUpper: 'SHOPEE',
    label: 'Shopee',
    abbr: 'SH',
    chartColor: '#EE4D2D',
    tailwind: { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500', bar: 'bg-orange-500' },
    connect: {
      logo: '🛍️',
      sellerIdLabel: 'Shop ID',
      sellerIdHelp: 'Encontre no Shopee Seller Center → Conta → Informações da Loja → ID da Loja.',
      tokenLabel: 'Access Token',
      tokenHelp: 'Gere em open.shopee.com → Meus Aplicativos → Credenciais → Token de Acesso.',
      tokenUrl: 'https://open.shopee.com',
      oauthHint: 'Acesse open.shopee.com, registre ou acesse seu aplicativo e gere o Access Token.',
    },
  },
  amazon: {
    key: 'amazon',
    keyUpper: 'AMAZON',
    label: 'Amazon',
    abbr: 'AZ',
    chartColor: '#FF9900',
    tailwind: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-500' },
    connect: {
      logo: '📦',
      sellerIdLabel: 'Merchant ID',
      sellerIdHelp: 'Encontre no Seller Central → Configurações → Informações da Conta → Merchant Token.',
      tokenLabel: 'SP-API Token',
      tokenHelp: 'Gere no Seller Central → Aplicações → Desenvolver Aplicações → Credenciais SP-API.',
      tokenUrl: 'https://sellercentral.amazon.com.br',
      oauthHint: 'Acesse o Seller Central Amazon Brasil, vá em Aplicações e gere suas credenciais SP-API.',
    },
  },
  magalu: {
    key: 'magalu',
    keyUpper: 'MAGALU',
    label: 'Magalu',
    abbr: 'MG',
    chartColor: '#0086C3',
    tailwind: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', bar: 'bg-blue-500' },
    connect: {
      logo: '🏪',
      sellerIdLabel: 'Seller ID',
      sellerIdHelp: 'Encontre no Painel do Vendedor Magazine Luiza → Minha Conta → Dados do Vendedor.',
      tokenLabel: 'API Key',
      tokenHelp: 'Gere em developers.magazineluiza.com.br → Meus Aplicativos → Credenciais.',
      tokenUrl: 'https://developers.magazineluiza.com.br',
      oauthHint: 'Acesse developers.magazineluiza.com.br, cadastre seu aplicativo e obtenha a API Key.',
    },
  },
  americanas: {
    key: 'americanas',
    keyUpper: 'AMERICANAS',
    label: 'Americanas',
    abbr: 'AM',
    chartColor: '#E30613',
    tailwind: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', bar: 'bg-red-500' },
    connect: {
      logo: '🏬',
      sellerIdLabel: 'Seller ID Skyhub',
      sellerIdHelp: 'Encontre no Skyhub Painel → Minha Conta → Identificação do Lojista.',
      tokenLabel: 'API Token Skyhub',
      tokenHelp: 'Obtenha no Skyhub → Integrações → Token de Integração.',
      tokenUrl: 'https://api.skyhub.com.br',
      oauthHint: 'Acesse o Skyhub (integrador oficial Americanas/B2W) e obtenha o token de integração.',
    },
  },
  casasbabia: {
    key: 'casasbabia',
    keyUpper: 'CASASBABIA',
    label: 'Casas Bahia',
    abbr: 'CB',
    chartColor: '#0055A6',
    tailwind: { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500', bar: 'bg-indigo-500' },
    connect: {
      logo: '🏠',
      sellerIdLabel: 'Seller ID',
      sellerIdHelp: 'Encontre no Portal do Lojista Casas Bahia → Configurações → Dados da Loja.',
      tokenLabel: 'API Key',
      tokenHelp: 'Gere no Portal do Lojista → Integrações → Chave de API.',
      tokenUrl: 'https://sellers.casasbahia.com.br',
      oauthHint: 'Acesse o Portal do Lojista Casas Bahia e obtenha sua API Key na seção de Integrações.',
    },
  },
}

export const MARKETPLACE_LIST = Object.values(MARKETPLACES)
export const MARKETPLACE_KEYS = Object.keys(MARKETPLACES) as MarketplaceKey[]

export function getMP(key: string): MarketplaceDef {
  return MARKETPLACES[key.toLowerCase() as MarketplaceKey] ?? MARKETPLACES.mercadolivre
}

export function getMPByUpper(key: string): MarketplaceDef {
  return MARKETPLACE_LIST.find(m => m.keyUpper === key.toUpperCase()) ?? MARKETPLACES.mercadolivre
}

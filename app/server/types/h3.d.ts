import type { MarketplaceUser } from '#shared/marketplace'

declare module 'h3' {
  interface H3EventContext {
    requestId: string
    user?: MarketplaceUser
  }
}

export {}

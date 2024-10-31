
const currentEnv: keyof typeof envRepo = 'dev'

interface Env {
  THREADS: {
    request: number
  }
  REDIS_HOST: string
}

const envRepo: Record<string, Env> = {
  prod: {
    REDIS_HOST: 'prod-redis-host',
    THREADS: {
      request: 10
    }
  },
  dev: {
    REDIS_HOST: 'dev-redis-host',
    THREADS: {
    request: 5
  }
  }
}


export const config = envRepo[currentEnv]

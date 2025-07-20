class EventEmitter {
  private events: Record<string, any[]> = {}
  private sysEvent: Record<string, boolean> = {}

  constructor() {
    // 全局错误处理
    process.on('uncaughtException', (err) => {
      console.error('[KS]', 'uncaughtException', err)
    });

    process.on('unhandledRejection', (reason) => {
      console.error('[KS]', 'unhandledRejection', reason)
    });
  }

  on(name: string, callback: (...args: any[]) => void) {
    const list = this.events[name] || []
    this.events[name] = list

    if (!list.includes(callback)) {
      list.push(callback)
    }

    if (name === 'SIGINT' && !this.sysEvent[name]) {
      this.sysEvent[name] = true
      process.on(name, async () => {
        console.log('\n[KS]', 'Shutting down gracefully...')
        const timer = setTimeout(() => {
          console.log('[KS]', 'Shutting down timeout\n')
          process.exit(0)
        }, 3600);
        await this.emit(name)
        clearTimeout(timer)
        console.log('[KS]', 'Shutting down finish\n')
        process.exit(0)
      })
    }
  }

  async emit(name: string, ...args: any[]) {
    const list = this.events[name]
    if (!list) return

    for (let i = 0; i < list.length; i++) {
      try {
        await list[i](...args)
      } catch (err) {
        console.error('[KS]', 'EventEmitter Error', err)
      }
    }
  }

  off(name: string, callback: (...args: any[]) => void) {
    const list = this.events[name]
    if (list) {
      const index = list.indexOf(callback)
      if (index > -1) {
        list.splice(index, 1)
      }
    }
  }
}

export default new EventEmitter()

class BluetoothDevices {
  constructor (filters) {
    this.filters = filters
    this.isKillMode = false
    this.killDevicesStack = []
    this.statusCallback = () => {}
    this.callback = () => {}
    this._status = new Proxy(
      Array(filters.length).fill(false)
      ,
      {
        set: (target, prop, value) => {
          target[prop] = value
          this.statusCallback(target)
          return true
        }
      }
    )
  }

  instance (filter) {
    const instance = async filter => {
      this._status[filter] = false

      if (this.isKillMode) {
        return
      }

      let device = null

      for (;!this.isKillMode;) {
        try {
          device = await window.navigator.bluetooth.requestDevice(this.filters[filter])
          break
        } catch (e) {
          if (e.name !== 'SecurityError') {
            device = null
            break
          }
        }
        await sleep(500)
      }

      await sleep(3000)
      this.killDevicesStack.push(device)

      if (this.isKillMode) {
        return
      }

      this._status[filter] = !!device
      await this.callback(device, filter, instance)
    }
    instance(filter)
  }

  connect (callback) {
    this.callback = callback
    this.filters.forEach((_, filter) => this.instance(filter))
  }

  reconnect () {
    this.disconnect()
    this.isKillMode = false
    this.killDevicesStack = []
    this.filters.forEach((_, filter) => this.instance(filter))
  }

  disconnect () {
    this.isKillMode = true
    this.killDevicesStack.forEach(device => {
      try {
        device.gatt.disconnect()
      } catch (e) {}
    })
    this._status.map(() => false)
    return true
  }

  status (statusCallback) {
    this.statusCallback = statusCallback
  }
}

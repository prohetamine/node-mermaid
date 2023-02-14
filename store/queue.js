class Queue {
  constructor () {
    this.statusCallback = () => {}
    this.queue = []
    this.oldQueueCount = 0
    this.isPushQueue = false
    this.executerCallback = (_, next) => next()
  }

  add (data) {
    if (this.isPushQueue) {
      this.queue.push(data)
      this.statusEvent()
    } else {
      this.isPushQueue = true
      this.executerCallback(
        data,
        () => {
          this.isPushQueue = false
          const queueData = this.queue.shift()
          if (queueData) {
            this.statusEvent()
            this.add(queueData)
          }
        },
        () => {
          this.isPushQueue = false
          this.queue.push(data)
          const queueData = this.queue.shift()
          if (queueData) {
            this.statusEvent()
            this.add(queueData)
          }
        }
      )
    }
  }

  statusEvent () {
    if (this.oldQueueCount !== this.queue.length) {
      this.oldQueueCount = this.queue.length
      this.statusCallback(this.queue.length)
    }
  }

  status (callback) {
    this.statusCallback = callback
  }

  executer (callback) {
    this.executerCallback = callback
  }
}

module.exports = Queue

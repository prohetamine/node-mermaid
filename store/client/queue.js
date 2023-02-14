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


/*

--- Test ---

const goodData = []

const queue = new Queue()

queue.status(count => {
  console.log('queue:', count, 'good:', goodData.length + '%')
})

queue.executer(async (data, next, repeat) => {
  try {
    const result = await new Promise((res, rej) => {
      setTimeout(() => {
        if (Math.random() > 0.9) {
          res(data * 100)
        } else {
          rej(null)
        }
      }, 200)
    })

    goodData.push(result)
    console.log('result:', result, '=> next')
    next()
  } catch (e) {
    console.log('result:', null, '=> repeat')
    repeat()
  }
})

for (let i = 0; i < 101; i++) {
  setTimeout(() => {
    const number = parseInt(Math.random() * 1000)
    queue.add(number)
  }, 100 * i)
}

*/

const mongodb = require('mongodb')
const async = require('async')
const customers = require('./m3-customer-data.json')
const customerAddresses = require('./m3-customer-address-data.json')

const url = 'mongodb://database/'
const batchSize = parseInt(process.argv[2]) || 1000

let tasks = []
mongodb.MongoClient.connect(url, (error, client) => {
    if(error) {
        console.error(error)
        return process.exit(1)
    }

    console.log('Connected to db')
    let db = client.db('edx-course-db')
    customers.forEach((customer, index, list) => {
        customers[index] = Object.assign(customer, customerAddresses[index])
        
        if(index % batchSize === 0) {
            const start = index
            const end = (start + batchSize > customers.length) ? customers.length - 1 : start+batchSize
            tasks.push((done) => {
                db.collection('customers').insert(customers.slice(start, end), (error, results) => {
                    done(error, results)
                })
            })
        }
    })

    console.log('running tasks')
    async.parallel(tasks, (error, results) =>  {
        if(error) console.error(error)
        client.close();
    })
})

const mongodb = require('mongodb')
const async = require('async')
const customers = require('./m3-customer-data.json')
const customerAddresses = require('./m3-customer-address-data.json')

const url = 'mongodb://database/'
const batchSize = parseInt(process.argv[2]) || 1000

function partition(input, size)
{
    var output = [];
    for (var i = 0; i < input.length; i += size)
    {
        output[output.length] = input.slice(i, i + size);
    }

    return output;
}

let tasks = []
mongodb.MongoClient.connect(url, (error, client) => {
    if(error) {
        console.error(error)
        return process.exit(1)
    }

    console.log('Connected to db')
    let db = client.db('edx-course-db')
    customers.forEach((customer, index) => {
        customers[index] = Object.assign(customer, customerAddresses[index])
    })

    let batches = partition(customers, batchSize)
    console.log(`number of batches: ${batches.length}`)
    batches.forEach((batch, index) => {
        tasks.push((done) => {
            db.collection('customers').insert(batch, (error, results) => {
                done(error, results)
            })
        })
    })

    console.log('running tasks')
    async.parallel(tasks, (error, results) =>  {
        if(error) console.error(error)
        client.close();
    })
})

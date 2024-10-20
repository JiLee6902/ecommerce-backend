
'use strict'

const {Client} = require('@elastic/elasticsearch')

let clients = {}

const instanceEventListeners = async (elasticClient) => {
  try {
    await elasticClient.ping()
  } catch(error) {
    console.error('Error connecting to elasticsearch',error)
  }  
}

const initEs = ({
    ELASTICSEARCH_IS_ENABLED,
    ELASTICSEARCH_HOSTS = 'http://elasticsearch:9200'
}) => {
    if(ELASTICSEARCH_IS_ENABLED) {
        const elasticClient = new Client({node: ELASTICSEARCH_HOSTS})
        clients.elasticClient = elasticClient
        instanceEventListeners(elasticClient)
    }
}

const getEs = () => clients

const closeEs = () => {
}


module.exports = {
    initEs,
    getEs,
    closeEs
}
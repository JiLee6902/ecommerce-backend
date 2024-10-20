'use-strict'

const _ = require('lodash')
const { Types } = require('mongoose')

const convertToObjectIdMongoDb = id => new Types.ObjectId(id)

const getInfoData = ({ fields = [], object = {} }) => {
    return _.pick(object, fields)
}

const getSelectData = (select = []) => {
    return Object.fromEntries(select.map(el => [el, 1]))
}

const unGetSelectData = (select = []) => {
    return Object.fromEntries(select.map(el => [el, 0]))
}

const removeUndefinedObject = obj => {
    Object.keys(obj).forEach(k => {
        if (obj[k] == null || obj[k] == undefined) {
            delete obj[k]
        }
    })

    return obj;
}

const removeUndefinedObjectV2 = (obj) => {
    Object.keys(obj).forEach(k => {
        if (obj[k] === null || obj[k] === undefined) {
            delete obj[k];
        } else if (typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
            removeUndefinedObjectV2(obj[k]);
            if (Object.keys(obj[k]).length === 0) {
                delete obj[k];
            }
        }
    });

    return obj;
}

const updateNestedObjectParser = obj => {
    const final = {}
    Object.keys(obj).forEach(k => {
        if (typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
            const response = updateNestedObjectParser(obj[k])
            Object.keys(response).forEach(a => {
                final[`${k}.${a}`] = response[a]
            })
        } else {
            final[k] = obj[k]
        }
    })
    return final;
}


const flattenObject = (obj, parentKey = '') => {
    return Object.keys(obj).reduce((acc, key) => {
        const newKey = parentKey ? `${parentKey}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(acc, flattenObject(obj[key], newKey));
        } else {
            acc[newKey] = obj[key];
        }
        return acc;
    }, {});
};

const replacePlaceHolder = (template, params) => {
    Object.keys(params).forEach(k => {
        const placeholder = `{{${k}}}`
        template = template.replace(new RegExp(placeholder, 'g'), params[k])
    })
    return template;
}

const randomProductId = _ => {
    return Math.floor(Math.random() * 899999 + 10000)
}

module.exports = {
    getInfoData,
    unGetSelectData,
    getSelectData,
    removeUndefinedObject,
    updateNestedObjectParser,
    convertToObjectIdMongoDb,
    replacePlaceHolder,
    randomProductId
}
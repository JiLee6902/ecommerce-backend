
'use strict'

const Sequence = require('../models/sequence.model');

async function getNextSequence(seqName) {
    const sequence = await Sequence.findOneAndUpdate(
        { seqName: seqName },
        { $inc: { seqValue: 1 } },
        { new: true, upsert: true }
    );
    return sequence.seqValue;
}

module.exports = {
    getNextSequence
};

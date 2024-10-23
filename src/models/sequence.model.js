
'use strict';

const { model, Schema } = require('mongoose');

const sequenceSchema = new Schema({
    seqName: { type: String, required: true, unique: true },
    seqValue: { type: Number, required: true, default: 0 }
}, { collection: 'sequences' });

const Sequence = model('Sequence', sequenceSchema);

module.exports = Sequence;

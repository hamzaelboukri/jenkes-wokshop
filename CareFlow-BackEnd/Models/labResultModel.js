import mongoose from 'mongoose';

const labResultSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'LabOrder', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    storageKey: { type: String, required: true },
    contentType: { type: String },
    size: { type: Number },
    flagged: { type: Boolean, default: false },
    notes: { type: String },
}, { timestamps: true });

export default mongoose.model('LabResult', labResultSchema);
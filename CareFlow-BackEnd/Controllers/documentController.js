import mongoose from 'mongoose';
import MedicalDocument from '../Models/documentModel.js';

const documentController = {
  uploadDocument: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'file required' });

      const { patientId, category = 'other', tags = [] } = req.body;
      if (!patientId) return res.status(400).json({ success: false, message: 'patientId required' });

      const key = `documents/${patientId}/${Date.now()}_${req.file.originalname}`;
      await storageService.uploadBuffer(key, req.file.buffer, req.file.mimetype);

      const doc = new MedicalDocument({
        patient: patientId,
        uploadedBy: req.user.userId,
        originalFileName: req.file.originalname,
        fileName: key.split('/').pop(),
        fileUrl: key, // stocke la clé/URL côté storage; getPresignedUrl utilisera cette valeur
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        category,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      });

      await doc.save();
      return res.status(201).json({ success: true, document: doc });
    } catch (error) {
      console.error('uploadDocument error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  listByPatient: async (req, res) => {
    try {
      const { patientId } = req.params;
      const docs = await MedicalDocument.find({ patient: patientId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, documents: docs });
    } catch (error) {
      console.error('listByPatient error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getPresignedUrl: async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await MedicalDocument.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

      // check ownership or roles in middleware before calling this
      const url = await storageService.getPresignedUrl(doc.fileUrl, 600);
      return res.status(200).json({ success: true, url });
    } catch (error) {
      console.error('getPresignedUrl error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  deleteDocument: async (req, res) => {
    const session = await mongoose.startSession();
    try {
      const { id } = req.params;
      await session.withTransaction(async () => {
        const doc = await MedicalDocument.findById(id).session(session);
        if (!doc) throw { status: 404, message: 'Document not found' };

        await storageService.deleteObject(doc.fileUrl);
        await MedicalDocument.deleteOne({ _id: id }).session(session);
      });

      return res.status(200).json({ success: true, message: 'Document deleted' });
    } catch (error) {
      if (error && error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('deleteDocument error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    } finally {
      session.endSession();
    }
  },
};

export default documentController;

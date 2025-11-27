import mongoose from 'mongoose';
import LabOrder from '../Models/labOrderModel.js';
import LabResult from '../Models/labResultModel.js'; // <-- ajouté
import storageService from '../services/storageService.js';
import Consultation from '../Models/consultationModel.js';

const labOrderController = {
  createLabOrder: async (req, res) => {
    try {
      const { consultationId, patientId, orderedBy, tests = [] } = req.body;
      const doctorId = req.body.doctor || orderedBy || req.user?.userId || req.user?.id;

      if (!patientId || !Array.isArray(tests) || tests.length === 0) {
        return res.status(400).json({ success: false, message: 'patientId and tests required' });
      }

      if (!doctorId) {
        return res.status(400).json({ success: false, message: 'doctor (ordering user) is required' });
      }

      const labOrder = new LabOrder({
        consultation: consultationId || null,
        patient: patientId,
        doctor: doctorId,
        orderedBy: orderedBy || req.user?.userId || req.user?.id,
        tests,
        status: 'ordered',
      });

      await labOrder.save();
      if (consultationId) await Consultation.findByIdAndUpdate(consultationId, { $push: { labOrders: labOrder._id } });

      return res.status(201).json({ success: true, labOrder });
    } catch (error) {
      console.error('createLabOrder error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  uploadResult: async (req, res) => {
    const session = await mongoose.startSession();
    try {
      const { id } = req.params;
      if (!req.file) return res.status(400).json({ success: false, message: 'file required' });

      await session.withTransaction(async () => {
        const labOrder = await LabOrder.findById(id).session(session);
        if (!labOrder) throw { status: 404, message: 'Lab order not found' };

        // upload file to S3/MinIO
        const key = `lab-results/${labOrder._id}/${Date.now()}_${req.file.originalname}`;
        await storageService.uploadBuffer(key, req.file.buffer, req.file.mimetype);

        const result = new LabResult({
          order: labOrder._id,
          uploadedBy: req.user.userId,
          filename: req.file.originalname,
          storageKey: key,
          contentType: req.file.mimetype,
        });

        await result.save({ session });

        labOrder.results.push(result._id);
        labOrder.status = 'received';
        await labOrder.save({ session });
      });

      const updated = await LabOrder.findById(id).populate('results');
      return res.status(200).json({ success: true, message: 'Result uploaded', labOrder: updated });
    } catch (error) {
      if (error && error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('uploadResult error:', error);
      return res.status(500).json({ success: false, message: error });
    } finally {
      session.endSession();
    }
  },

  getAllLabOrders: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [orders, total] = await Promise.all([
        LabOrder.find().populate('patient orderedBy').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        LabOrder.countDocuments(),
      ]);
      return res.status(200).json({ success: true, orders, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total } });
    } catch (error) {
      console.error('getAllLabOrders error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getLabOrderById: async (req, res) => {
    try {
      const order = await LabOrder.findById(req.params.id).populate('patient orderedBy results');
      if (!order) return res.status(404).json({ success: false, message: 'Lab order not found' });
      return res.status(200).json({ success: true, order });
    } catch (error) {
      console.error('getLabOrderById error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getResultsForOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const order = await LabOrder.findById(id).populate('results');
      if (!order) return res.status(404).json({ success: false, message: 'Lab order not found' });
      return res.status(200).json({ success: true, results: order.results });
    } catch (error) {
      console.error('getResultsForOrder error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  downloadResultPresign: async (req, res) => {
    try {
      const { resultId } = req.params;
      const result = await LabResult.findById(resultId);
      if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

      const url = await storageService.getPresignedUrl(result.storageKey, 600);
      return res.status(200).json({ success: true, url });
    } catch (error) {
      console.error('downloadResultPresign error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },
};

export default labOrderController;
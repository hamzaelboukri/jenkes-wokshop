import Pharmacy from '../Models/pharmacyModel.js';
import Prescription from '../Models/prescriptionModel.js';

const pharmacyController = {
  createPharmacy: async (req, res) => {
    try {
      const data = req.body;
      const pharmacy = new Pharmacy(data);
      await pharmacy.save();
      return res.status(201).json({ success: true, pharmacy });
    } catch (error) {
      console.error('createPharmacy error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getAllPharmacies: async (req, res) => {
    try {
      const pharmacies = await Pharmacy.find().sort({ name: 1 });
      return res.status(200).json({ success: true, pharmacies });
    } catch (error) {
      console.error('getAllPharmacies error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getPharmacyById: async (req, res) => {
    try {
      const pharmacy = await Pharmacy.findById(req.params.id);
      if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy not found' });
      return res.status(200).json({ success: true, pharmacy });
    } catch (error) {
      console.error('getPharmacyById error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  updatePharmacy: async (req, res) => {
    try {
      const updated = await Pharmacy.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Pharmacy not found' });
      return res.status(200).json({ success: true, pharmacy: updated });
    } catch (error) {
      console.error('updatePharmacy error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  deletePharmacy: async (req, res) => {
    try {
      const deleted = await Pharmacy.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Pharmacy not found' });
      return res.status(200).json({ success: true, message: 'Pharmacy deleted' });
    } catch (error) {
      console.error('deletePharmacy error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getPrescriptionsForPharmacy: async (req, res) => {
    try {
      const { id } = req.params;
      const { status = 'sent' } = req.query;
      const prescriptions = await Prescription.find({ pharmacy: id, status }).populate('patient prescriber');
      return res.status(200).json({ success: true, prescriptions });
    } catch (error) {
      console.error('getPrescriptionsForPharmacy error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },
};

export default pharmacyController;
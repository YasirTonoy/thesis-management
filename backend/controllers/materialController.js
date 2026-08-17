const ThesisMaterial = require('../models/ThesisMaterial');
const { getAccessibleProposal } = require('../utils/proposalAccess');

const createMaterial = async (req, res) => {
  try {
    const { proposalId, title, description } = req.body;

    if (!proposalId || !title) return res.status(400).json({ success: false, message: 'Proposal and title are required' });
    if (!req.file) return res.status(400).json({ success: false, message: 'A file is required' });
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Only students can upload thesis materials' });

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis, or it is not yet approved' });

    const material = await ThesisMaterial.create({
      proposal: proposalId, title, description: description || '',
      versions: [{ filename: req.file.filename, originalName: req.file.originalname, url: `/uploads/${req.file.filename}`, uploadedBy: req.user.id, note: 'Initial upload' }]
    });

    const populated = await material.populate('versions.uploadedBy', 'name studentId');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addMaterialVersion = async (req, res) => {
  try {
    const { note } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'A file is required' });
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Only students can update thesis materials' });

    const material = await ThesisMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    const proposal = await getAccessibleProposal(material.proposal, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    material.versions.push({ filename: req.file.filename, originalName: req.file.originalname, url: `/uploads/${req.file.filename}`, uploadedBy: req.user.id, note: note || '' });
    await material.save();

    const populated = await material.populate('versions.uploadedBy', 'name studentId');
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMaterials = async (req, res) => {
  try {
    const { proposalId } = req.query;
    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId is required' });

    const proposal = await getAccessibleProposal(proposalId, req.user);
    if (!proposal) return res.status(403).json({ success: false, message: 'You do not have access to this thesis' });

    const materials = await ThesisMaterial.find({ proposal: proposalId }).populate('versions.uploadedBy', 'name studentId').sort({ createdAt: -1 });
    res.json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createMaterial, addMaterialVersion, getMaterials };

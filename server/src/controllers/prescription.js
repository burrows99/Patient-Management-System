// /controllers/prescription.js
import { Prescription } from '../models/Prescription.js';
import { User } from '../models/User.js';
import { Op } from 'sequelize';

// Create a new prescription
export const createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      content
    } = req.body;

    if (!patientId || !doctorId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patientId, doctorId, content'
      });
    }

    const patient = await User.findOne({ where: { id: patientId, role: 'patient' } });
    const doctor = await User.findOne({ where: { id: doctorId, role: 'doctor' } });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const prescription = await Prescription.create({ patientId, doctorId, content });

    const createdPrescription = await Prescription.findByPk(prescription.id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'email', 'role'] },
        { model: User, as: 'doctor', attributes: ['id', 'email', 'role'] }
      ]
    });

    res.status(201).json({ success: true, message: 'Prescription created successfully', data: createdPrescription });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get prescriptions by doctor ID
export const getPrescriptionsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, status, patientId } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { doctorId };

    // Add optional filters
    if (status) {
      whereClause.status = status;
    }
    if (patientId) {
      whereClause.patientId = patientId;
    }

    const { count, rows: prescriptions } = await Prescription.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'email', 'role']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'email', 'role']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching prescriptions by doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get prescriptions by patient ID
export const getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, doctorId } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { patientId };

    if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    const { count, rows: prescriptions } = await Prescription.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'email', 'role']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'email', 'role']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching prescriptions by patient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get a single prescription by ID
export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findByPk(id, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'email', 'role']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'email', 'role']
        }
      ]
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update a prescription
export const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const prescription = await Prescription.findByPk(id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    await prescription.update({ content });

    // Fetch updated prescription with relations
    const updatedPrescription = await Prescription.findByPk(id, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'email', 'role']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'email', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Prescription updated successfully',
      data: updatedPrescription
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete a prescription
export const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findByPk(id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    await prescription.destroy();

    res.json({
      success: true,
      message: 'Prescription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all prescriptions (admin function)
export const getAllPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { medicationName: { [Op.iLike]: `%${search}%` } },
        { diagnosis: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: prescriptions } = await Prescription.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'email', 'role']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'email', 'role']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// /models/Prescription.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { User } from './User.js';

export const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'id'
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'patient_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'doctor_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'content'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'prescriptions',
  schema: 'nhs',
  indexes: [
    {
      name: 'prescriptions_patient_id_idx',
      fields: ['patient_id']
    },
    {
      name: 'prescriptions_doctor_id_idx',
      fields: ['doctor_id']
    }
  ]
});

// Associations are defined in associations.js to avoid circular dependencies

export default Prescription;

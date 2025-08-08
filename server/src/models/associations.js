// /models/associations.js
import { User } from './User.js';
import { Prescription } from './Prescription.js';

// Define all model associations here to avoid circular dependencies

// User-Prescription associations
User.hasMany(Prescription, {
  foreignKey: 'patientId',
  as: 'prescriptionsAsPatient'
});

User.hasMany(Prescription, {
  foreignKey: 'doctorId',
  as: 'prescriptionsAsDoctor'
});

Prescription.belongsTo(User, {
  foreignKey: 'patientId',
  as: 'patient'
});

Prescription.belongsTo(User, {
  foreignKey: 'doctorId',
  as: 'doctor'
});

export { User, Prescription };

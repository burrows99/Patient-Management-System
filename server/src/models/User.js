// /models/User.js
import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: true // Allow null for invited patients who haven't set a password yet
  },
  role: {
    type: DataTypes.ENUM('doctor', 'patient'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending_verification', 'active', 'suspended', 'deactivated', 'invited'),
    defaultValue: 'pending_verification',
    allowNull: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  inviteToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'invite_token' // Using snake_case for database column
  },
  inviteTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'invite_token_expiry' // Using snake_case for database column
  },
  invitedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'invited_by', // Using snake_case for database column
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'users',
  schema: 'nhs',
  indexes: [
    {
      unique: true,
      fields: ['invite_token'],
      where: {
        invite_token: { [Op.ne]: null }
      }
    }
  ]
});

export default User;

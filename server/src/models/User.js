// /models/User.js
import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/db.js';
import { USER_ROLES, USER_STATUS } from '../constants/user.js';

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'id'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'email',
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null for invited users who haven't set a password yet
    field: 'password_hash'
  },
  role: {
    type: DataTypes.ENUM(USER_ROLES.DOCTOR, USER_ROLES.PATIENT),
    allowNull: false,
    field: 'role',
    validate: {
      isIn: [[USER_ROLES.DOCTOR, USER_ROLES.PATIENT]]
    }
  },
  status: {
    type: DataTypes.ENUM(
      USER_STATUS.PENDING_VERIFICATION,
      USER_STATUS.ACTIVE,
      USER_STATUS.SUSPENDED,
      USER_STATUS.DEACTIVATED,
      USER_STATUS.INVITED
    ),
    defaultValue: USER_STATUS.PENDING_VERIFICATION,
    allowNull: false,
    field: 'status',
    validate: {
      isIn: [
        [
          USER_STATUS.PENDING_VERIFICATION,
          USER_STATUS.ACTIVE,
          USER_STATUS.SUSPENDED,
          USER_STATUS.DEACTIVATED,
          USER_STATUS.INVITED
        ]
      ]
    }
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  verificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'verification_token'
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'reset_token'
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reset_token_expiry'
  },
  inviteToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'invite_token'
  },
  inviteTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'invite_token_expiry'
  },
  invitedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'invited_by',
    references: {
      model: 'users',
      key: 'id'
    }
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
  tableName: 'users',
  schema: 'nhs',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      name: 'users_invite_token_idx',
      unique: true,
      fields: ['invite_token'],
      where: {
        invite_token: { [Op.ne]: null }
      }
    },
    {
      name: 'users_invited_by_idx',
      fields: ['invited_by']
    },
    {
      name: 'users_status_idx',
      fields: ['status']
    },
    {
      name: 'users_role_idx',
      fields: ['role']
    }
  ]
});

// Add any static methods or instance methods here

/**
 * Find a user by ID
 * @param {string} id - The user ID
 * @returns {Promise<Object|null>} The user object or null if not found
 */
export const findUserById = async (id) => {
  try {
    return await User.findByPk(id, {
      attributes: {
        exclude: ['passwordHash', 'verificationToken', 'resetToken', 'resetTokenExpiry', 'inviteToken', 'inviteTokenExpiry']
      }
    });
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

export default User;

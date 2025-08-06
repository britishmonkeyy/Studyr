'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StudyPartner extends Model {
    static associate(models) {
      // StudyPartner belongs to requester (User)
      StudyPartner.belongsTo(models.User, {
        foreignKey: 'requesterId',
        as: 'requester'
      });

      // StudyPartner belongs to recipient (User)
      StudyPartner.belongsTo(models.User, {
        foreignKey: 'recipientId',
        as: 'recipient'
      });
    }

    // Accept partnership request
    async accept() {
      this.status = 'accepted';
      this.matchedAt = new Date();
      return await this.save();
    }

    // Decline partnership request
    async decline() {
      this.status = 'declined';
      return await this.save();
    }

    // Block partnership
    async block() {
      this.status = 'blocked';
      return await this.save();
    }

    // Check if partnership is active
    isActive() {
      return this.status === 'accepted';
    }

    // Get the other user in the partnership
    getOtherUserId(currentUserId) {
      return this.requesterId === currentUserId ? this.recipientId : this.requesterId;
    }

    // Check if user can message
    canMessage() {
      return this.status === 'accepted';
    }
  }

  StudyPartner.init({
    partnershipId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      field: 'partnership_id'
    },
    requesterId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'requester_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'recipient_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'blocked'),
      allowNull: false,
      defaultValue: 'pending'
    },
    matchedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'matched_at'
    },
    requestMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'request_message'
    }
  }, {
    sequelize,
    modelName: 'StudyPartner',
    tableName: 'study_partners',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['requester_id']
      },
      {
        fields: ['recipient_id']
      },
      {
        fields: ['status']
      },
      {
        unique: true,
        fields: ['requester_id', 'recipient_id'],
        name: 'unique_partnership'
      }
    ]
  });

  return StudyPartner;
};
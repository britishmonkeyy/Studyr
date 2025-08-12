/*
Module Name: Partner Session Model
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Sequelize model for managing study session partnerships including invitation status, acceptance tracking, and session collaboration features
Disclaimer: CURRENTLY UNUSED MODEL AS OF 12/08/2025
*/
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PartnerSession extends Model {
    static associate(models) {
      // PartnerSession belongs to StudySession
      PartnerSession.belongsTo(models.StudySession, {
        foreignKey: 'sessionId',
        as: 'session'
      });

      // PartnerSession belongs to User (partner)
      PartnerSession.belongsTo(models.User, {
        foreignKey: 'partnerId',
        as: 'partner'
      });
    }

    // Accept session invitation
    async accept() {
      this.status = 'accepted';
      this.joinedAt = new Date();
      return await this.save();
    }

    // Decline session invitation
    async decline() {
      this.status = 'declined';
      return await this.save();
    }

    // Check if partner can join session
    canJoin() {
      return this.status === 'accepted';
    }

    // Check if invitation is pending
    isPending() {
      return this.status === 'invited';
    }

    // Get invitation age in hours
    getInvitationAge() {
      const now = new Date();
      const created = new Date(this.createdAt);
      return Math.floor((now - created) / (1000 * 60 * 60));
    }
  }

  PartnerSession.init({
    partnerSessionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      field: 'partner_session_id'
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'session_id',
      references: {
        model: 'study_sessions',
        key: 'session_id'
      }
    },
    partnerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'partner_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    status: {
      type: DataTypes.ENUM('invited', 'accepted', 'declined'),
      allowNull: false,
      defaultValue: 'invited'
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'joined_at'
    },
    invitationMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'invitation_message'
    }
  }, {
    sequelize,
    modelName: 'PartnerSession',
    tableName: 'partner_sessions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['session_id']
      },
      {
        fields: ['partner_id']
      },
      {
        fields: ['status']
      },
      {
        unique: true,
        fields: ['session_id', 'partner_id'],
        name: 'unique_session_partner'
      }
    ]
  });

  return PartnerSession;
};
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PartnerSession = sequelize.define('PartnerSession', {
    partnerSessionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'StudySessions',
        key: 'sessionId'
      }
    },
    partnerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'userId'
      }
    },
    status: {
      type: DataTypes.ENUM('invited', 'accepted', 'declined'),
      defaultValue: 'invited'
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  return PartnerSession;
};
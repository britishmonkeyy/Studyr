// models/StudyPartner.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StudyPartner = sequelize.define('StudyPartner', {
    partnershipId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    requesterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'userId'
      }
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'userId'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'blocked'),
      defaultValue: 'pending'
    },
    matchedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  return StudyPartner;
};
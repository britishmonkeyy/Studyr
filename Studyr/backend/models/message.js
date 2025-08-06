'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      // Message belongs to sender (User)
      Message.belongsTo(models.User, {
        foreignKey: 'senderId',
        as: 'sender'
      });

      // Message belongs to recipient (User)
      Message.belongsTo(models.User, {
        foreignKey: 'recipientId',
        as: 'recipient'
      });
    }

    // Mark message as read
    async markAsRead() {
      this.isRead = true;
      this.readAt = new Date();
      return await this.save();
    }

    // Check if message is from today
    isFromToday() {
      const today = new Date();
      const messageDate = new Date(this.createdAt);
      return messageDate.toDateString() === today.toDateString();
    }

    // Get formatted time
    getFormattedTime() {
      return new Date(this.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  Message.init({
    messageId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      field: 'message_id'
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'sender_id',
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
    messageText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'message_text',
      validate: {
        notEmpty: true,
        len: [1, 1000] // Max 1000 characters
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'is_read',
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    },
    messageType: {
      type: DataTypes.ENUM('text', 'system', 'invitation'),
      allowNull: false,
      field: 'message_type',
      defaultValue: 'text'
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['sender_id', 'recipient_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['is_read']
      }
    ]
  });

  return Message;
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserAchievement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UserAchievement.init({
    userId: DataTypes.UUID,
    achievementId: DataTypes.UUID,
    earnedAt: DataTypes.DATE,
    progressPercentage: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'UserAchievement',
  });
  return UserAchievement;
};
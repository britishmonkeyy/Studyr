'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Achievement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Achievement.init({
    achievementName: DataTypes.STRING,
    description: DataTypes.TEXT,
    badgeIcon: DataTypes.STRING,
    pointsValue: DataTypes.INTEGER,
    category: DataTypes.STRING,
    criteriaJson: DataTypes.JSON,
    isActive: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Achievement',
  });
  return Achievement;
};
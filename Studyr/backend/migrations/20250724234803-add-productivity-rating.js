'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('study_sessions', 'productivity_rating', {
      type: Sequelize.DECIMAL(2, 1),
      allowNull: true,
      validate: {
        min: 1.0,
        max: 5.0
      },
      comment: 'User productivity rating from 1-5 stars'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('study_sessions', 'productivity_rating');
  }
};
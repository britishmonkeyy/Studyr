'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      user_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      profile_picture_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      study_level: {
        type: Sequelize.ENUM('high_school', 'university', 'professional'),
        allowNull: false
      },
      year_level: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_premium: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      timezone: {
        type: Sequelize.STRING(50),
        defaultValue: 'Australia/Melbourne'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['study_level']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
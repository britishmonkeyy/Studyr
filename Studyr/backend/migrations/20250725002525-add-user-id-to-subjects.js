'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add user_id column to existing subjects table
    await queryInterface.addColumn('subjects', 'user_id', {
      type: Sequelize.UUID,
      allowNull: true, // Initially allowing null for existing records
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add indexes for performance
    await queryInterface.addIndex('subjects', ['user_id']);
    await queryInterface.addIndex('subjects', ['user_id', 'subject_name']);


    const [users] = await queryInterface.sequelize.query('SELECT user_id FROM users LIMIT 1');
    if (users.length > 0) {
      const firstUserId = users[0].user_id;
      await queryInterface.sequelize.query(
        'UPDATE subjects SET user_id = :userId WHERE user_id IS NULL',
        { replacements: { userId: firstUserId } }
      );
    }

  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('subjects', ['user_id', 'subject_name']);
    await queryInterface.removeIndex('subjects', ['user_id']);
    
    // Remove the user_id column
    await queryInterface.removeColumn('subjects', 'user_id');
  }
};
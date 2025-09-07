import mongoose from 'mongoose';
import { User, Category } from '../config/models/index.js';
import { env } from '../config/env.js';

// Default categories that should exist for all users
const defaultCategories = [
  { name: 'Meal', color: '#EF4444', icon: '🍽️', isDefault: true },
  { name: 'House Rent', color: '#10B981', icon: '🏠', isDefault: true },
  { name: 'Travel', color: '#3B82F6', icon: '✈️', isDefault: true },
  { name: 'Loan', color: '#F59E0B', icon: '💳', isDefault: true },
  { name: 'Shopping', color: '#8B5CF6', icon: '🛍️', isDefault: true },
  { name: 'Transportation', color: '#06B6D4', icon: '🚗', isDefault: true },
  { name: 'Healthcare', color: '#EC4899', icon: '🏥', isDefault: true },
  { name: 'Entertainment', color: '#F97316', icon: '🎬', isDefault: true },
  { name: 'Education', color: '#84CC16', icon: '📚', isDefault: true },
  { name: 'Utilities', color: '#6366F1', icon: '⚡', isDefault: true }
];

async function migrateDefaultCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.mongoUri);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let totalCreated = 0;

    for (const user of users) {
      console.log(`Processing user: ${user.name} (${user.email})`);
      
      // Check which default categories don't exist for this user
      const existingCategories = await Category.find({ user: user._id });
      const existingNames = existingCategories.map(cat => cat.name.toLowerCase());
      
      const categoriesToCreate = defaultCategories.filter(
        cat => !existingNames.includes(cat.name.toLowerCase())
      );

      if (categoriesToCreate.length > 0) {
        console.log(`  Creating ${categoriesToCreate.length} missing default categories`);
        
        // Create the missing default categories
        for (const categoryData of categoriesToCreate) {
          const category = new Category({
            ...categoryData,
            user: user._id
          });
          await category.save();
          totalCreated++;
        }
      } else {
        console.log(`  All default categories already exist`);
      }
    }

    console.log(`\nMigration completed! Created ${totalCreated} default categories for ${users.length} users.`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDefaultCategories();
}

export { migrateDefaultCategories };

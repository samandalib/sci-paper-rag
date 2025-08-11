#!/bin/bash

# Cleanup script to remove temporary imported files
# Run this after you've verified the system is working correctly

echo "🧹 Cleaning up temporary imported files..."

# Remove the temporary imported files directory
if [ -d "ImportedPipeLineFiles" ]; then
    echo "Removing ImportedPipeLineFiles directory..."
    rm -rf ImportedPipeLineFiles
    echo "✅ ImportedPipeLineFiles directory removed"
else
    echo "ℹ️ ImportedPipeLineFiles directory not found"
fi

# Remove the cleanup script itself
echo "Removing cleanup script..."
rm "$0"
echo "✅ Cleanup complete!"

echo ""
echo "🎉 Your Sci-Paper RAG system is now clean and ready for production!"
echo "All temporary files have been removed."
echo ""
echo "Next steps:"
echo "1. Set up your environment variables in .env.local"
echo "2. Run 'npm run setup-db' to initialize your database"
echo "3. Start the system with 'npm run dev'"
echo "4. Upload and process your first PDFs!"

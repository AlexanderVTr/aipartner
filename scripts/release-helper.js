#!/usr/bin/env node

/**
 * Release Helper Script
 * Allows creating releases with custom names and themes
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Predefined release themes
const RELEASE_THEMES = {
  'speech': '🎤 Speech Recognition & Voice Features',
  'ai': '🤖 AI Chat & Intelligence Updates', 
  'auth': '🔐 Authentication & Security',
  'ui': '💄 UI/UX Design Improvements',
  'perf': '⚡ Performance & Optimization',
  'db': '🗄️ Database & Storage Updates',
  'api': '🔌 API & Integration Changes',
  'mobile': '📱 Mobile Experience',
  'bug': '🐛 Bug Fixes & Stability',
  'feature': '✨ New Features & Capabilities'
};

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function getCurrentVersion() {
  try {
    const version = execSync('node -p "require(\'./package.json\').version"', { encoding: 'utf-8' }).trim();
    return version;
  } catch (error) {
    console.error('Error reading version:', error.message);
    return null;
  }
}

async function getCommitsSinceLastTag() {
  try {
    const commits = execSync('git log --oneline $(git describe --tags --abbrev=0 HEAD~1)..HEAD 2>/dev/null || git log --oneline -10', { encoding: 'utf-8' });
    return commits;
  } catch (error) {
    console.log('No previous tags found, showing recent commits');
    return execSync('git log --oneline -10', { encoding: 'utf-8' });
  }
}

function suggestTheme(commits) {
  const commitText = commits.toLowerCase();
  
  if (commitText.includes('speech') || commitText.includes('voice') || commitText.includes('audio')) {
    return 'speech';
  } else if (commitText.includes('chat') || commitText.includes('ai') || commitText.includes('gpt')) {
    return 'ai';
  } else if (commitText.includes('auth') || commitText.includes('login') || commitText.includes('user')) {
    return 'auth';
  } else if (commitText.includes('ui') || commitText.includes('design') || commitText.includes('style')) {
    return 'ui';
  } else if (commitText.includes('perf') || commitText.includes('speed') || commitText.includes('optimize')) {
    return 'perf';
  } else if (commitText.includes('fix') || commitText.includes('bug')) {
    return 'bug';
  } else if (commitText.includes('db') || commitText.includes('database') || commitText.includes('supabase')) {
    return 'db';
  }
  
  return 'feature';
}

async function main() {
  console.log('🚀 AISHA Release Helper\n');
  
  const currentVersion = await getCurrentVersion();
  console.log(`📦 Current version: ${currentVersion}\n`);
  
  const commits = await getCommitsSinceLastTag();
  console.log('📝 Recent commits:');
  console.log(commits);
  
  const suggestedTheme = suggestTheme(commits);
  console.log(`💡 Suggested theme: ${RELEASE_THEMES[suggestedTheme]}\n`);
  
  // Choose release type
  console.log('📋 Available release types:');
  console.log('1. patch (0.1.0 → 0.1.1) - Bug fixes');
  console.log('2. minor (0.1.0 → 0.2.0) - New features');
  console.log('3. major (0.1.0 → 1.0.0) - Breaking changes');
  
  const releaseType = await askQuestion('\n🎯 Select release type (1-3): ');
  const typeMap = { '1': 'patch', '2': 'minor', '3': 'major' };
  const selectedType = typeMap[releaseType] || 'patch';
  
  // Choose theme
  console.log('\n🎨 Available themes:');
  Object.entries(RELEASE_THEMES).forEach(([key, theme], index) => {
    const marker = key === suggestedTheme ? ' (suggested)' : '';
    console.log(`${index + 1}. ${key} - ${theme}${marker}`);
  });
  
  const themeChoice = await askQuestion('\n🎨 Select theme (number or key): ');
  const themeKeys = Object.keys(RELEASE_THEMES);
  let selectedTheme;
  
  if (themeChoice.match(/^\d+$/)) {
    const index = parseInt(themeChoice) - 1;
    selectedTheme = themeKeys[index] || suggestedTheme;
  } else {
    selectedTheme = themeKeys.find(key => key === themeChoice.toLowerCase()) || suggestedTheme;
  }
  
  // Custom name (optional)
  const customName = await askQuestion('\n✏️ Custom release name (press Enter to use theme): ');
  
  // Preview release
  console.log('\n📋 Release Preview:');
  console.log(`Type: ${selectedType}`);
  console.log(`Theme: ${RELEASE_THEMES[selectedTheme]}`);
  if (customName) {
    console.log(`Custom name: ${customName}`);
  }
  
  const confirm = await askQuestion('\n✅ Create this release? (y/N): ');
  
  if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
    try {
      // Create release
      console.log(`\n🚀 Creating ${selectedType} release...`);
      execSync(`pnpm release:${selectedType}`, { stdio: 'inherit' });
      
      // If custom name provided, update CHANGELOG.md
      if (customName) {
        console.log('📝 Updating CHANGELOG.md with custom title...');
        try {
          const fs = require('fs');
          let changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
          
          // Find the latest version section and add custom title
          const versionRegex = /^## \[(\d+\.\d+\.\d+)\]/m;
          const match = changelog.match(versionRegex);
          
          if (match) {
            const version = match[1];
            const customTitle = `\n🎯 **${customName}**\n`;
            
            // Insert custom title after the version line
            changelog = changelog.replace(
              `## [${version}]`,
              `## [${version}]\n${customTitle}`
            );
            
            fs.writeFileSync('CHANGELOG.md', changelog);
            console.log('✅ CHANGELOG.md updated with custom title');
          }
        } catch (error) {
          console.log('⚠️ Could not update CHANGELOG.md automatically');
        }
      }
      
      console.log('\n✅ Release created successfully!');
      console.log('📤 Push with: git push --follow-tags origin main');
      
    } catch (error) {
      console.error('❌ Error creating release:', error.message);
    }
  } else {
    console.log('❌ Release cancelled');
  }
  
  rl.close();
}

main().catch(console.error); 
const fs = require('fs');
let c = fs.readFileSync('scripts/sync-notifications.js', 'utf8');

const target = '  if (notifications.length === 0) {';

const newCode = `  // NEW PROJECT LAUNCHES
  const todayStart = new Date(today + 'T00:00:00.000Z');
  const newSnap = await db.collection('projects').where('createdAt', '>=', todayStart).get();
  if (newSnap.size > 0) {
    const names = newSnap.docs.slice(0, 3).map(d => d.data().name || d.data().project || 'Unknown').join(', ');
    const more = newSnap.size > 3 ? ' and ' + (newSnap.size - 3) + ' more...' : '';
    notifications.push({
      type: 'new_launch',
      icon: '\uD83D\uDE80',
      title: newSnap.size + ' new project' + (newSnap.size > 1 ? 's' : '') + ' discovered today',
      body: names + more,
      priority: 'high',
    });
  }

  `;

c = c.replace(target, newCode + target);
fs.writeFileSync('scripts/sync-notifications.js', c, 'utf8');
console.log('Done. Has new_launch:', c.includes('new_launch'));

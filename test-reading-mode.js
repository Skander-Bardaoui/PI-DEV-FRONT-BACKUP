// Script de test du mode lecture
// Exécutez ce script dans la console du navigateur (F12)

console.log('🧪 Test du Mode Lecture - NovaEntra\n');

// Test 1: Vérifier si la classe est présente
console.log('1️⃣ Vérification de la classe reading-mode...');
const hasClass = document.documentElement.classList.contains('reading-mode');
console.log(`   ${hasClass ? '✅' : '❌'} Classe reading-mode: ${hasClass ? 'PRÉSENTE' : 'ABSENTE'}`);

if (!hasClass) {
  console.log('   💡 Activez le mode lecture et relancez ce script');
  console.log('   📍 Bouton en bas à droite ou panneau d\'accessibilité');
}

// Test 2: Vérifier si le CSS est chargé
console.log('\n2️⃣ Vérification du CSS...');
const testElement = document.createElement('div');
testElement.className = 'reading-mode';
document.body.appendChild(testElement);
const styles = window.getComputedStyle(testElement);
const bgColor = styles.backgroundColor;
document.body.removeChild(testElement);

console.log(`   Couleur de fond: ${bgColor}`);
if (bgColor === 'rgb(250, 248, 245)' || bgColor === 'rgba(250, 248, 245, 1)') {
  console.log('   ✅ CSS du mode lecture chargé correctement');
} else {
  console.log('   ⚠️ CSS du mode lecture peut-être non chargé');
  console.log('   💡 Vérifiez que reading-mode.css est importé dans index.css');
}

// Test 3: Vérifier les éléments masqués
if (hasClass) {
  console.log('\n3️⃣ Vérification des éléments masqués...');
  
  const sidebar = document.querySelector('.sidebar-container');
  const header = document.querySelector('.top-header');
  
  if (sidebar) {
    const sidebarDisplay = window.getComputedStyle(sidebar).display;
    console.log(`   Sidebar display: ${sidebarDisplay}`);
    console.log(`   ${sidebarDisplay === 'none' ? '✅' : '❌'} Sidebar ${sidebarDisplay === 'none' ? 'masquée' : 'VISIBLE'}`);
  } else {
    console.log('   ⚠️ Sidebar non trouvée');
  }
  
  if (header) {
    const headerDisplay = window.getComputedStyle(header).display;
    console.log(`   Header display: ${headerDisplay}`);
    console.log(`   ${headerDisplay === 'none' ? '✅' : '❌'} Header ${headerDisplay === 'none' ? 'masqué' : 'VISIBLE'}`);
  } else {
    console.log('   ⚠️ Header non trouvé');
  }
}

// Test 4: Vérifier le main
console.log('\n4️⃣ Vérification du contenu principal...');
const main = document.querySelector('main');
if (main) {
  const mainStyles = window.getComputedStyle(main);
  console.log(`   Max-width: ${mainStyles.maxWidth}`);
  console.log(`   Font-family: ${mainStyles.fontFamily}`);
  console.log(`   Background: ${mainStyles.backgroundColor}`);
  
  if (hasClass) {
    const isOptimized = 
      mainStyles.maxWidth.includes('800px') ||
      mainStyles.fontFamily.includes('Georgia') ||
      mainStyles.fontFamily.includes('serif');
    
    console.log(`   ${isOptimized ? '✅' : '❌'} Styles de lecture ${isOptimized ? 'appliqués' : 'NON appliqués'}`);
  }
} else {
  console.log('   ⚠️ Élément <main> non trouvé');
}

// Test 5: Fonction de toggle manuelle
console.log('\n5️⃣ Fonction de test manuelle...');
console.log('   Exécutez: toggleReadingModeTest()');

window.toggleReadingModeTest = function() {
  const html = document.documentElement;
  if (html.classList.contains('reading-mode')) {
    html.classList.remove('reading-mode');
    console.log('❌ Mode lecture désactivé');
  } else {
    html.classList.add('reading-mode');
    console.log('✅ Mode lecture activé');
  }
  console.log('📋 Classes actuelles:', html.className);
};

// Résumé
console.log('\n' + '='.repeat(50));
console.log('📊 RÉSUMÉ');
console.log('='.repeat(50));

if (hasClass) {
  console.log('✅ Mode lecture ACTIVÉ');
  console.log('💡 Si rien ne change visuellement:');
  console.log('   1. Vérifiez la console pour les erreurs CSS');
  console.log('   2. Rechargez la page (Ctrl+R)');
  console.log('   3. Videz le cache (Ctrl+Shift+R)');
} else {
  console.log('❌ Mode lecture DÉSACTIVÉ');
  console.log('💡 Pour activer:');
  console.log('   1. Cliquez sur le bouton "Mode lecture" (bas droite)');
  console.log('   2. Ou ouvrez le panneau d\'accessibilité');
  console.log('   3. Ou exécutez: toggleReadingModeTest()');
}

console.log('\n✨ Tests terminés!');
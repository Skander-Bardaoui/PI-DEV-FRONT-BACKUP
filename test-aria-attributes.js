// Script de test des attributs ARIA
// Exécutez ce script dans la console du navigateur (F12)

console.log('🧪 Test des Attributs ARIA - NovaEntra\n');

// Test 1: Boutons avec aria-label
console.log('1️⃣ Test des boutons icônes...');
const iconButtons = document.querySelectorAll('button[aria-label]');
console.log(`   ✓ ${iconButtons.length} boutons avec aria-label trouvés`);
iconButtons.forEach(btn => {
  if (!btn.getAttribute('aria-label')) {
    console.warn(`   ⚠️ Bouton sans aria-label:`, btn);
  }
});

// Test 2: Icônes décoratives
console.log('\n2️⃣ Test des icônes décoratives...');
const icons = document.querySelectorAll('svg');
const iconsWithAriaHidden = document.querySelectorAll('svg[aria-hidden="true"]');
console.log(`   ✓ ${icons.length} icônes SVG trouvées`);
console.log(`   ✓ ${iconsWithAriaHidden.length} icônes avec aria-hidden="true"`);
if (icons.length !== iconsWithAriaHidden.length) {
  console.warn(`   ⚠️ ${icons.length - iconsWithAriaHidden.length} icônes sans aria-hidden`);
}

// Test 3: Menus déroulants
console.log('\n3️⃣ Test des menus déroulants...');
const dropdownButtons = document.querySelectorAll('button[aria-expanded]');
console.log(`   ✓ ${dropdownButtons.length} boutons avec aria-expanded trouvés`);
dropdownButtons.forEach(btn => {
  const expanded = btn.getAttribute('aria-expanded');
  const controls = btn.getAttribute('aria-controls');
  if (!controls) {
    console.warn(`   ⚠️ Bouton sans aria-controls:`, btn);
  }
  console.log(`   - ${btn.getAttribute('aria-label')}: ${expanded}`);
});

// Test 4: Navigation
console.log('\n4️⃣ Test de la navigation...');
const navElements = document.querySelectorAll('nav[role="navigation"]');
console.log(`   ✓ ${navElements.length} éléments nav avec role="navigation"`);
navElements.forEach(nav => {
  const label = nav.getAttribute('aria-label');
  console.log(`   - Navigation: ${label || 'Sans label'}`);
});

// Test 5: Liens actifs
console.log('\n5️⃣ Test des liens actifs...');
const activeLinks = document.querySelectorAll('[aria-current="page"]');
console.log(`   ✓ ${activeLinks.length} liens avec aria-current="page"`);

// Test 6: Modals
console.log('\n6️⃣ Test des modals...');
const modals = document.querySelectorAll('[role="dialog"]');
console.log(`   ✓ ${modals.length} modals trouvés`);
modals.forEach(modal => {
  const labelledby = modal.getAttribute('aria-labelledby');
  const describedby = modal.getAttribute('aria-describedby');
  const ariaModal = modal.getAttribute('aria-modal');
  console.log(`   - Modal:`);
  console.log(`     aria-labelledby: ${labelledby || '❌ Manquant'}`);
  console.log(`     aria-describedby: ${describedby || '⚠️ Optionnel'}`);
  console.log(`     aria-modal: ${ariaModal || '❌ Manquant'}`);
});

// Test 7: Régions live
console.log('\n7️⃣ Test des régions live...');
const liveRegions = document.querySelectorAll('[aria-live]');
console.log(`   ✓ ${liveRegions.length} régions avec aria-live trouvées`);
liveRegions.forEach(region => {
  const politeness = region.getAttribute('aria-live');
  const role = region.getAttribute('role');
  console.log(`   - ${role || 'div'}: aria-live="${politeness}"`);
});

// Test 8: Éléments focusables
console.log('\n8️⃣ Test des éléments focusables...');
const focusableElements = document.querySelectorAll(
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
);
console.log(`   ✓ ${focusableElements.length} éléments focusables trouvés`);

// Test 9: Focus rings visibles
console.log('\n9️⃣ Test des focus rings...');
const firstFocusable = focusableElements[0];
if (firstFocusable) {
  firstFocusable.focus();
  const styles = window.getComputedStyle(firstFocusable);
  const outline = styles.outline;
  console.log(`   - Outline du premier élément: ${outline}`);
  if (outline === 'none' || outline === '0px') {
    console.warn(`   ⚠️ Focus ring potentiellement invisible`);
  } else {
    console.log(`   ✓ Focus ring visible`);
  }
}

// Test 10: Classe sr-only
console.log('\n🔟 Test de la classe sr-only...');
const srOnlyElements = document.querySelectorAll('.sr-only');
console.log(`   ✓ ${srOnlyElements.length} éléments avec classe sr-only`);

// Résumé
console.log('\n' + '='.repeat(50));
console.log('📊 RÉSUMÉ DES TESTS');
console.log('='.repeat(50));

const results = {
  'Boutons avec aria-label': iconButtons.length > 0 ? '✅' : '❌',
  'Icônes avec aria-hidden': iconsWithAriaHidden.length > 0 ? '✅' : '❌',
  'Menus avec aria-expanded': dropdownButtons.length > 0 ? '✅' : '❌',
  'Navigation avec role': navElements.length > 0 ? '✅' : '❌',
  'Liens actifs marqués': activeLinks.length > 0 ? '✅' : '⚠️',
  'Modals accessibles': modals.length > 0 ? '✅' : '⚠️',
  'Régions live': liveRegions.length > 0 ? '✅' : '⚠️',
  'Éléments focusables': focusableElements.length > 0 ? '✅' : '❌',
};

Object.entries(results).forEach(([test, status]) => {
  console.log(`${status} ${test}`);
});

console.log('\n💡 Pour plus de détails, utilisez:');
console.log('   - Chrome DevTools > Accessibility tab');
console.log('   - Lighthouse Audit (Accessibility)');
console.log('   - Extension axe DevTools');
console.log('\n✨ Tests terminés!');
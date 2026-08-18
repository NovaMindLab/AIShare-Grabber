const fs = require('fs');
let c = fs.readFileSync('src/App.vue', 'utf-8');

// Remove duplicate sections - the file has been doubled due to repeated script runs
// Find where the second <template> starts and trim everything from there
const templateCount = (c.match(/<template>/g) || []).length;
const scriptCount = (c.match(/<script setup>/g) || []).length;
const styleCount = (c.match(/<style>/g) || []).length;

console.log(`template: ${templateCount}, script setup: ${scriptCount}, style: ${styleCount}`);

if (scriptCount > 1) {
  // Find the second <script setup> and remove everything from there
  const firstIdx = c.indexOf('<script setup>');
  const secondIdx = c.indexOf('<script setup>', firstIdx + 1);
  console.log(`Removing duplicate script from index ${secondIdx}`);
  c = c.slice(0, secondIdx);
  // Close it properly - add </script>\n\n<style>\n</style> at end if needed
  // Actually the style is likely duplicated too, let's just check what we have
  // The slice should end mid-way; we need to also get the style block
  // Let's find the </script> before the second <script setup>
  const lastScriptClose = c.lastIndexOf('</script>');
  c = c.slice(0, lastScriptClose + 9); // keep up to </script>
  
  // Now find if there was a <style> after first </script>
  // It should already be in the kept portion
  const styleIdx = c.lastIndexOf('<style>');
  const styleCloseIdx = c.lastIndexOf('</style>');
  if (styleIdx > -1 && styleCloseIdx > styleIdx) {
    console.log('Style block preserved');
  } else {
    c += '\n\n<style>\n@keyframes modalSlideIn {\n  from { opacity: 0; transform: scale(0.92) translateY(-8px); }\n  to { opacity: 1; transform: scale(1) translateY(0); }\n}\n.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }\n.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }\n</style>';
  }
  
  fs.writeFileSync('src/App.vue', c);
  console.log('Fixed! New length:', c.length);
} else {
  console.log('No duplicates found');
}
